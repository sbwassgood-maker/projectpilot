import "server-only";
import type { AiProvider, ChatMessage } from "./client";

// ---------------------------------------------------------------------------
// Deterministic mock AI provider (AI_PROVIDER=mock).
//
// This is a TEST SEAM, not the product's intelligence. It lets the full
// pipeline run end-to-end without an API key by deriving structured output
// from the document text using conservative pattern matching. It obeys the
// same zero-fabrication contract: it only emits items for which it found a
// supporting snippet in the text, always attaches that snippet + a confidence,
// and omits values it cannot find.
//
// In production, set AI_PROVIDER=openai and OPENAI_API_KEY to use the real
// model; this file is never used on that path.
// ---------------------------------------------------------------------------

export class MockProvider implements AiProvider {
  readonly name = "mock";

  async completeJson(messages: ChatMessage[]): Promise<string> {
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const user = messages.find((m) => m.role === "user")?.content ?? "";

    if (system.includes("weekly project report")) {
      return this.buildReport(user);
    }
    return this.buildExtraction(user);
  }

  // ---- Extraction -------------------------------------------------------

  private buildExtraction(user: string): string {
    const documentId = matchLine(user, /Document id:\s*(\S+)/u) ?? "";
    const text = afterMarker(user, "Document text:");
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const events: unknown[] = [];
    const risks: unknown[] = [];
    const tasks: unknown[] = [];
    const financial_items: unknown[] = [];
    const change_orders: unknown[] = [];
    const people: unknown[] = [];
    const vendors: unknown[] = [];
    const schedule_items: unknown[] = [];

    // A change-order document carries its amount as part of the change order,
    // so we avoid also logging that amount as a standalone financial cost.
    const isChangeOrderDoc = /change order\s*#?\s*\d+/iu.test(text);

    for (const line of lines) {
      const lower = line.toLowerCase();
      const date = firstIsoDate(line);

      // Change orders. A change order document usually spreads the number,
      // amount, date and status across separate lines, so when we see the
      // number we consider the WHOLE document for those attributes (a real LLM
      // reads the entire document, not one line).
      const coNum = line.match(/change order\s*#?\s*(\d+)/iu);
      if (coNum && !change_orders.some((c) => (c as { number?: string }).number === coNum[1])) {
        const amount = firstMoney(line) ?? firstMoney(text);
        const awaiting =
          /await|pending|not (?:yet )?approved|unapproved|requires approval|before work can proceed/iu.test(
            text,
          );
        const approved = /\bapproved\b/iu.test(text) && !awaiting;
        const coDate = date ?? firstIsoDate(text);
        change_orders.push({
          number: coNum[1],
          title: `Change Order #${coNum[1]}`,
          description: line,
          ...(amount !== null ? { amount } : {}),
          currency: "USD",
          status: awaiting
            ? "awaiting_approval"
            : approved
              ? "approved"
              : "submitted",
          ...(coDate ? { item_date: coDate } : {}),
          snippet: line,
          confidence: 0.9,
        });
        continue;
      }

      // Delays
      if (/delay|delayed|pushed|slipped|behind schedule/iu.test(lower)) {
        events.push({
          type: "schedule_delay",
          title: titleFrom(line),
          description: line,
          ...(date ? { event_date: date } : {}),
          severity: "medium",
          snippet: line,
          confidence: 0.9,
        });
        continue;
      }

      // Completed work / milestones
      if (/complete|completed|finished|passed inspection|installed/iu.test(lower)) {
        events.push({
          type: /inspection/iu.test(lower)
            ? "inspection"
            : "work_completed",
          title: titleFrom(line),
          description: line,
          ...(date ? { event_date: date } : {}),
          severity: "low",
          snippet: line,
          confidence: 0.85,
        });
        continue;
      }

      // Inspections scheduled / upcoming
      if (/inspection|scheduled|upcoming|next week|will begin|to begin/iu.test(lower)) {
        events.push({
          type: /inspection/iu.test(lower) ? "inspection" : "upcoming_work",
          title: titleFrom(line),
          description: line,
          ...(date ? { event_date: date } : {}),
          severity: /not confirmed|unconfirmed|pending/iu.test(lower)
            ? "medium"
            : "low",
          snippet: line,
          confidence: 0.8,
        });
        continue;
      }

      // Invoices / costs (skip in a change-order document to avoid double count)
      const money = firstMoney(line);
      if (!isChangeOrderDoc && money !== null && /invoice|cost|paid|payment|amount|total|\$/iu.test(lower)) {
        financial_items.push({
          kind: /invoice/iu.test(lower) ? "invoice" : "cost",
          description: line,
          amount: money,
          currency: "USD",
          ...(date ? { item_date: date } : {}),
          snippet: line,
          confidence: 0.85,
        });
        continue;
      }

      // Risks
      if (/risk|concern|issue|problem|shortage|weather|may impact|could affect/iu.test(lower)) {
        risks.push({
          title: titleFrom(line),
          description: line,
          severity: /high|serious|critical|major/iu.test(lower)
            ? "high"
            : "medium",
          status: "open",
          ...(date ? { due_date: date } : {}),
          snippet: line,
          confidence: 0.8,
        });
        continue;
      }

      // Tasks / action items
      if (/need to|must|action item|to do|follow up|follow-up|required/iu.test(lower)) {
        tasks.push({
          title: titleFrom(line),
          description: line,
          status: "open",
          ...(date ? { due_date: date } : {}),
          snippet: line,
          confidence: 0.75,
        });
        continue;
      }
    }

    // Vendors / people from simple patterns
    for (const line of lines) {
      const vendor = line.match(
        /\b([A-Z][A-Za-z&.\- ]+(?:Flooring|Electric|Electrical|Plumbing|Roofing|Concrete|HVAC|Framing|Supply|Contractors?|Construction|Drywall))\b/u,
      );
      if (vendor) {
        vendors.push({
          name: vendor[1].trim(),
          ...(guessTrade(line) ? { trade: guessTrade(line) } : {}),
          snippet: line,
          confidence: 0.7,
        });
      }
      const person = line.match(
        /\b(?:from|by|contact|superintendent|PM|project manager|foreman)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)\b/u,
      );
      if (person) {
        people.push({
          name: person[1],
          ...(guessRole(line) ? { role: guessRole(line) } : {}),
          snippet: line,
          confidence: 0.65,
        });
      }
    }

    const anyFound =
      events.length +
        risks.length +
        tasks.length +
        financial_items.length +
        change_orders.length +
        people.length +
        vendors.length +
        schedule_items.length >
      0;

    return JSON.stringify({
      events,
      risks,
      tasks,
      financial_items,
      change_orders,
      people,
      vendors,
      schedule_items,
      needs_review: !anyFound,
      ...(anyFound
        ? {}
        : {
            review_reason:
              "No clearly supported project information was found in this document.",
          }),
      _docId: documentId, // ignored by schema (stripped)
    });
  }

  // ---- Report -----------------------------------------------------------

  private buildReport(user: string): string {
    // The user content embeds a JSON blob of structured data under DATA:.
    const dataJson = afterMarker(user, "DATA:");
    let data: MockReportData;
    try {
      data = JSON.parse(dataJson) as MockReportData;
    } catch {
      data = {
        project_name: "Project",
        period_start: "1970-01-01",
        period_end: "1970-01-01",
        events: [],
        risks: [],
        change_orders: [],
        financial_items: [],
        tasks: [],
      };
    }

    const sections: unknown[] = [];

    const overviewPts = [
      `Project: ${data.project_name}.`,
      `Reporting period: ${data.period_start} to ${data.period_end}.`,
    ].map((t) => ({ text: t, evidence: [] }));
    sections.push({
      key: "project_overview",
      heading: "Project Overview",
      points: overviewPts,
    });

    const completed = data.events.filter(
      (e) => e.type === "work_completed" || e.type === "milestone_completed",
    );
    if (completed.length) {
      sections.push({
        key: "work_completed",
        heading: "Work Completed",
        points: completed.map((e) => ({
          text: e.title,
          evidence: [{ document_id: e.source_document_id }],
        })),
      });
    }

    const underway = data.events.filter((e) => e.type === "work_underway");
    if (underway.length) {
      sections.push({
        key: "work_underway",
        heading: "Work Underway",
        points: underway.map((e) => ({
          text: e.title,
          evidence: [{ document_id: e.source_document_id }],
        })),
      });
    }

    const delays = data.events.filter((e) => e.type === "schedule_delay");
    if (delays.length) {
      sections.push({
        key: "delays",
        heading: "Delays",
        points: delays.map((e) => ({
          text: e.description,
          evidence: [{ document_id: e.source_document_id }],
        })),
      });
    }

    if (data.risks.length) {
      sections.push({
        key: "risks_issues",
        heading: "Risks / Issues",
        points: data.risks.map((r) => ({
          text: `${r.title}: ${r.description}`,
          evidence: [{ document_id: r.source_document_id }],
        })),
      });
    }

    if (data.change_orders.length) {
      sections.push({
        key: "change_orders",
        heading: "Change Orders",
        points: data.change_orders.map((c) => ({
          text:
            `Change Order #${c.number ?? "—"}` +
            (c.amount != null ? ` for ${formatUsd(c.amount)}` : "") +
            ` — status: ${c.status.replace(/_/gu, " ")}.`,
          evidence: [{ document_id: c.source_document_id }],
        })),
      });
    }

    if (data.financial_items.length) {
      sections.push({
        key: "financial_information",
        heading: "Financial Information",
        points: data.financial_items.map((f) => ({
          text:
            (f.amount != null ? `${formatUsd(f.amount)} — ` : "") +
            f.description,
          evidence: [{ document_id: f.source_document_id }],
        })),
      });
    }

    const upcoming = data.events.filter((e) => e.type === "upcoming_work" || e.type === "inspection");
    if (upcoming.length) {
      sections.push({
        key: "upcoming_work",
        heading: "Upcoming Work",
        points: upcoming.map((e) => ({
          text: e.title,
          evidence: [{ document_id: e.source_document_id }],
        })),
      });
    }

    // Executive summary synthesized ONLY from counts of real items.
    const summaryBits: string[] = [];
    if (completed.length) summaryBits.push(`${completed.length} item(s) of work were reported complete`);
    if (delays.length) summaryBits.push(`${delays.length} schedule delay(s) were reported`);
    if (data.change_orders.length) summaryBits.push(`${data.change_orders.length} change order(s) are in progress`);
    if (data.risks.length) summaryBits.push(`${data.risks.length} open risk(s) require attention`);
    if (summaryBits.length) {
      sections.unshift({
        key: "executive_summary",
        heading: "Executive Summary",
        summary: `Based on the available project information, ${summaryBits.join(", ")}.`,
        points: [],
      });
    }

    const attention = [
      ...data.change_orders
        .filter((c) => c.status === "awaiting_approval")
        .map((c) => ({
          text: `Change Order #${c.number ?? "—"} is awaiting approval.`,
          evidence: [{ document_id: c.source_document_id }],
        })),
      ...data.risks.map((r) => ({
        text: r.title,
        evidence: [{ document_id: r.source_document_id }],
      })),
    ];
    if (attention.length) {
      sections.push({
        key: "items_requiring_attention",
        heading: "Items Requiring Attention",
        points: attention,
      });
    }

    return JSON.stringify({
      project_name: data.project_name,
      period_start: data.period_start,
      period_end: data.period_end,
      sections,
    });
  }
}

// ---- helpers -------------------------------------------------------------

type MockEvent = {
  type: string;
  title: string;
  description: string;
  source_document_id: string;
};
type MockReportData = {
  project_name: string;
  period_start: string;
  period_end: string;
  events: MockEvent[];
  risks: { title: string; description: string; source_document_id: string }[];
  change_orders: {
    number?: string;
    amount?: number;
    status: string;
    source_document_id: string;
  }[];
  financial_items: {
    amount?: number;
    description: string;
    source_document_id: string;
  }[];
  tasks: { title: string; source_document_id: string }[];
};

function matchLine(s: string, re: RegExp): string | null {
  const m = s.match(re);
  return m ? m[1] : null;
}

function afterMarker(s: string, marker: string): string {
  const idx = s.indexOf(marker);
  if (idx < 0) return "";
  return s.slice(idx + marker.length).replace(/^-+\n?/u, "").trim();
}

function firstIsoDate(line: string): string | null {
  // ISO first
  const iso = line.match(/\b(\d{4})-(\d{2})-(\d{2})\b/u);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // "September 15, 2026" or "Sept 15 2026"
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const m = line.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/u);
  if (m) {
    const mon = months[m[1].slice(0, 3).toLowerCase()];
    if (mon) {
      const day = m[2].padStart(2, "0");
      return `${m[3]}-${mon}-${day}`;
    }
  }
  return null;
}

function firstMoney(line: string): number | null {
  const m = line.match(/\$\s*([\d,]+(?:\.\d{2})?)/u);
  if (!m) return null;
  const n = Number(m[1].replace(/,/gu, ""));
  return Number.isNaN(n) ? null : n;
}

function titleFrom(line: string): string {
  const clean = line.replace(/^[-•*\d.)\s]+/u, "").trim();
  const firstSentence = clean.split(/[.;]/u)[0].trim();
  return (firstSentence || clean).slice(0, 120);
}

function guessTrade(line: string): string | undefined {
  const l = line.toLowerCase();
  for (const t of ["flooring", "electrical", "plumbing", "roofing", "concrete", "hvac", "framing", "drywall"]) {
    if (l.includes(t)) return t;
  }
  return undefined;
}

function guessRole(line: string): string | undefined {
  const l = line.toLowerCase();
  if (l.includes("superintendent")) return "Superintendent";
  if (l.includes("project manager") || l.includes("pm")) return "Project Manager";
  if (l.includes("foreman")) return "Foreman";
  return undefined;
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}
