import "server-only";
import {
  reportContentSchema,
  type ReportContent,
  REPORT_SECTION_ORDER,
  REPORT_SECTION_TITLES,
} from "../schemas/report";
import { getAiProvider, type ChatMessage } from "./client";
import { REPORT_SYSTEM_PROMPT } from "./prompts";
import type { ProjectDetail } from "../projectDetail";
import { formatDateISO } from "../format";

// ---------------------------------------------------------------------------
// Report generator — structured project data -> validated weekly report.
//
// We assemble ONLY the stored, evidence-backed records into a compact JSON
// payload, hand it to the model with the strict zero-fabrication prompt, then
// validate the response with Zod. The model may only reference document ids
// that we supplied.
// ---------------------------------------------------------------------------

export type GeneratedReport = {
  content: ReportContent;
  markdown: string;
};

export async function generateWeeklyReport(
  detail: ProjectDetail,
  period: { start: Date; end: Date },
): Promise<GeneratedReport> {
  const provider = getAiProvider();

  const startIso = formatDateISO(period.start)!;
  const endIso = formatDateISO(period.end)!;

  // Filter records to the reporting period where a date exists; undated items
  // are included (they are still real, just not date-stamped).
  const inPeriod = (d: Date | null) =>
    !d || (d >= period.start && d <= period.end);

  const validDocIds = new Set(detail.documents.map((d) => d.id));

  const payload = {
    project_name: detail.project.name,
    period_start: startIso,
    period_end: endIso,
    events: detail.events
      .filter((e) => inPeriod(e.eventDate))
      .map((e) => ({
        type: e.type,
        title: e.title,
        description: e.description,
        date: formatDateISO(e.eventDate),
        severity: e.severity,
        source_document_id: e.sourceDocumentId,
      })),
    risks: detail.risks
      .filter((r) => r.status === "open")
      .map((r) => ({
        title: r.title,
        description: r.description,
        severity: r.severity,
        source_document_id: r.sourceDocumentId,
      })),
    tasks: detail.tasks.map((t) => ({
      title: t.title,
      status: t.status,
      source_document_id: t.sourceDocumentId,
    })),
    change_orders: detail.changeOrders.map((c) => ({
      number: c.number,
      amount: c.amount ? Number(c.amount) : undefined,
      status: c.status,
      source_document_id: c.sourceDocumentId,
    })),
    financial_items: detail.financialItems
      .filter((f) => inPeriod(f.itemDate))
      .map((f) => ({
        kind: f.kind,
        description: f.description,
        amount: f.amount ? Number(f.amount) : undefined,
        source_document_id: f.sourceDocumentId,
      })),
  };

  const messages: ChatMessage[] = [
    { role: "system", content: REPORT_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Generate the weekly report for the period ${startIso} to ${endIso}.\n\nDATA:\n${JSON.stringify(payload)}`,
    },
  ];

  let raw = await provider.completeJson(messages);
  let content = tryParseReport(raw, validDocIds);

  if (!content.ok) {
    const repair: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: `Your previous response was invalid: ${content.error}. Return ONLY valid JSON matching the contract, referencing only the provided document ids.`,
      },
    ];
    raw = await provider.completeJson(repair);
    content = tryParseReport(raw, validDocIds);
  }

  if (!content.ok) {
    throw new ReportValidationError(content.error);
  }

  return { content: content.value, markdown: renderMarkdown(content.value) };
}

type ReportParse =
  | { ok: true; value: ReportContent }
  | { ok: false; error: string };

function tryParseReport(raw: string, validDocIds: Set<string>): ReportParse {
  let json: unknown;
  try {
    const s = raw.trim().replace(/^```(?:json)?/u, "").replace(/```$/u, "");
    json = JSON.parse(s);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
  const validated = reportContentSchema.safeParse(json);
  if (!validated.success) {
    return {
      ok: false,
      error: validated.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }
  // Drop any evidence refs pointing at documents outside this project.
  const cleaned: ReportContent = {
    ...validated.data,
    sections: validated.data.sections.map((s) => ({
      ...s,
      points: s.points.map((p) => ({
        ...p,
        evidence: p.evidence.filter((e) => validDocIds.has(e.document_id)),
      })),
    })),
  };
  return { ok: true, value: cleaned };
}

// Renders the structured report to editable markdown, ordered canonically.
export function renderMarkdown(content: ReportContent): string {
  const lines: string[] = [];
  lines.push(`# Weekly Project Report — ${content.project_name}`);
  lines.push(`_Reporting period: ${content.period_start} to ${content.period_end}_`);
  lines.push("");

  const byKey = new Map(content.sections.map((s) => [s.key, s]));
  for (const key of REPORT_SECTION_ORDER) {
    const section = byKey.get(key);
    lines.push(`## ${REPORT_SECTION_TITLES[key]}`);
    if (!section || (section.points.length === 0 && !section.summary)) {
      lines.push("Information not available.");
      lines.push("");
      continue;
    }
    if (section.summary) {
      lines.push(section.summary);
      lines.push("");
    }
    for (const p of section.points) {
      lines.push(`- ${p.text}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim() + "\n";
}

export class ReportValidationError extends Error {}
