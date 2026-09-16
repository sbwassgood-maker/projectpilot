// Shared formatting helpers (no fabrication: null -> "Not available").

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "Not available";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateISO(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

export function formatMoney(
  amount: number | string | null | undefined,
  currency = "USD",
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "Not available";
  }
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "Not available";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  milestone_completed: "Milestone",
  work_completed: "Work completed",
  work_underway: "Work underway",
  schedule_delay: "Schedule delay",
  schedule_change: "Schedule change",
  inspection: "Inspection",
  delivery: "Delivery",
  change_order: "Change order",
  cost: "Cost",
  invoice: "Invoice",
  decision: "Decision",
  issue: "Issue",
  risk: "Risk",
  meeting: "Meeting",
  upcoming_work: "Upcoming work",
  other: "Update",
};
