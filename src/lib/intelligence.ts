import "server-only";
import type { ProjectDetail } from "./projectDetail";
import type { TimelineItem } from "@/components/Timeline";
import type { AttentionItem } from "@/components/NeedsAttention";
import { formatDateISO, EVENT_TYPE_LABELS } from "./format";

// Maps a source document relation to the Evidence shape used by the UI.
function evidenceOf(
  rec: {
    sourceDocument: { id: string; filename: string };
    sourceLocation: string | null;
    snippet: string | null;
    confidence: number;
  },
  date: Date | null,
) {
  return {
    documentId: rec.sourceDocument.id,
    filename: rec.sourceDocument.filename,
    sourceLocation: rec.sourceLocation,
    snippet: rec.snippet,
    confidence: rec.confidence,
    date: formatDateISO(date),
  };
}

// Categorize an event type into a timeline filter bucket.
function eventCategory(type: string): TimelineItem["category"] {
  if (["cost", "invoice"].includes(type)) return "financial";
  if (type === "change_order") return "change_order";
  if (["risk", "issue"].includes(type)) return "risk";
  if (
    ["schedule_delay", "schedule_change", "milestone_completed", "work_completed", "work_underway", "inspection", "delivery", "upcoming_work"].includes(
      type,
    )
  )
    return "schedule";
  return "document";
}

export function buildTimeline(detail: ProjectDetail): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const e of detail.events) {
    items.push({
      id: `event-${e.id}`,
      category: eventCategory(e.type),
      type: e.type,
      title: e.title,
      description: e.description,
      date: formatDateISO(e.eventDate),
      severity: e.severity as TimelineItem["severity"],
      evidence: evidenceOf(e, e.eventDate),
    });
  }

  for (const c of detail.changeOrders) {
    items.push({
      id: `co-${c.id}`,
      category: "change_order",
      type: "change_order",
      title: c.number ? `Change Order ${c.number}: ${c.title}` : c.title,
      description: c.description,
      date: formatDateISO(c.itemDate),
      severity: c.status === "awaiting_approval" ? "high" : "low",
      amount: c.amount ? c.amount.toString() : null,
      currency: c.currency,
      evidence: evidenceOf(c, c.itemDate),
    });
  }

  for (const f of detail.financialItems) {
    items.push({
      id: `fin-${f.id}`,
      category: "financial",
      type: f.kind === "invoice" ? "invoice" : "cost",
      title: f.description,
      description: `${f.kind[0].toUpperCase()}${f.kind.slice(1)}`,
      date: formatDateISO(f.itemDate),
      severity: "low",
      amount: f.amount ? f.amount.toString() : null,
      currency: f.currency,
      evidence: evidenceOf(f, f.itemDate),
    });
  }

  for (const t of detail.tasks) {
    items.push({
      id: `task-${t.id}`,
      category: "task",
      type: "other",
      title: t.title,
      description: t.description,
      date: formatDateISO(t.dueDate),
      severity: "low",
      evidence: evidenceOf(t, t.dueDate),
    });
  }

  return items;
}

// Builds Needs Attention items. The "why it matters" text is grounded in the
// stored record — we never assert causation beyond what the data supports, and
// language is hedged with "Based on the available project information".
export function buildAttention(detail: ProjectDetail): AttentionItem[] {
  const items: AttentionItem[] = [];

  // Change orders awaiting approval -> RED
  for (const c of detail.changeOrders.filter(
    (c) => c.status === "awaiting_approval",
  )) {
    items.push({
      id: `co-${c.id}`,
      kind: "change_order",
      severity: "high",
      title: c.number
        ? `Change Order ${c.number} awaiting approval`
        : `${c.title} awaiting approval`,
      whatHappened: c.description,
      whyItMatters:
        "Based on the available project information, this change order is pending approval. Unapproved change orders can hold up related work and affect budget until a decision is recorded.",
      date: formatDateISO(c.itemDate),
      relatedEvents: relatedByKeyword(detail, c.title),
      evidence: evidenceOf(c, c.itemDate),
    });
  }

  // Open risks -> severity from record
  for (const r of detail.risks.filter((r) => r.status === "open")) {
    items.push({
      id: `risk-${r.id}`,
      kind: "risk",
      severity: r.severity as AttentionItem["severity"],
      title: r.title,
      whatHappened: r.description,
      whyItMatters:
        "Based on the available project information, this was identified as an open risk. It is surfaced here so it can be reviewed and mitigated before it affects the schedule or budget.",
      date: formatDateISO(r.dueDate),
      relatedEvents: relatedByKeyword(detail, r.title),
      evidence: evidenceOf(r, r.dueDate),
    });
  }

  // High-severity events (e.g. schedule delays) -> from record
  for (const e of detail.events.filter(
    (e) => e.severity === "high" || e.type === "schedule_delay",
  )) {
    // Avoid duplicating change orders already listed
    if (e.type === "change_order") continue;
    items.push({
      id: `event-${e.id}`,
      kind: "event",
      severity: (e.severity === "low" ? "medium" : e.severity) as AttentionItem["severity"],
      title: e.title,
      whatHappened: e.description,
      whyItMatters:
        e.type === "schedule_delay"
          ? "Based on the available project information, this is a schedule delay. Downstream tasks that depend on this work may be affected."
          : "Based on the available project information, this item was flagged as significant and may need a decision or follow-up.",
      date: formatDateISO(e.eventDate),
      relatedEvents: relatedByKeyword(detail, e.title, e.id),
      evidence: evidenceOf(e, e.eventDate),
    });
  }

  // Order: RED first, then YELLOW, then INFO
  const rank = { high: 0, medium: 1, low: 2 } as const;
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

// Finds other events sharing a significant keyword with the given title.
// This is a conservative, data-only relation (no invented causation).
function relatedByKeyword(
  detail: ProjectDetail,
  title: string,
  excludeEventId?: string,
): { title: string; date: string | null }[] {
  const words = title
    .toLowerCase()
    .split(/\W+/u)
    .filter((w) => w.length >= 4);
  if (words.length === 0) return [];
  return detail.events
    .filter((e) => e.id !== excludeEventId)
    .filter((e) => {
      const t = e.title.toLowerCase();
      return words.some((w) => t.includes(w));
    })
    .slice(0, 4)
    .map((e) => ({ title: e.title, date: formatDateISO(e.eventDate) }));
}

// Overview stats derived only from stored data.
export function buildOverview(detail: ProjectDetail) {
  const totalSchedule = detail.scheduleItems.length;
  const doneSchedule = detail.scheduleItems.filter(
    (s) => s.status === "completed",
  ).length;
  const progressPct =
    totalSchedule > 0 ? Math.round((doneSchedule / totalSchedule) * 100) : null;

  const delays = detail.events.filter(
    (e) => e.type === "schedule_delay",
  ).length;
  const scheduleStatus =
    totalSchedule === 0
      ? null
      : delays > 0
        ? "At risk"
        : "On track";

  const openRisks = detail.risks.filter((r) => r.status === "open").length;
  const openTasks = detail.tasks.filter((t) => t.status !== "done").length;

  // Budget is only shown if we have financial items; we never invent a number.
  const hasFinancials = detail.financialItems.length > 0;

  const recentActivity = [...detail.events]
    .sort((a, b) => {
      const da = a.eventDate?.getTime() ?? 0;
      const db = b.eventDate?.getTime() ?? 0;
      return db - da;
    })
    .slice(0, 5)
    .map((e) => ({
      title: e.title,
      type: EVENT_TYPE_LABELS[e.type] ?? "Update",
      date: formatDateISO(e.eventDate),
    }));

  return {
    progressPct,
    scheduleStatus,
    openRisks,
    openTasks,
    hasFinancials,
    recentActivity,
  };
}
