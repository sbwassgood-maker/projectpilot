import { z } from "zod";

// ---------------------------------------------------------------------------
// Extraction schemas
//
// These schemas define the ONLY shape the AI layer is allowed to return.
// Every extracted record must carry evidence (a confidence score and, where
// available, a text snippet + location within the source document). The
// source document itself is attached by the pipeline (the model is told the
// document id, but we re-stamp it server-side so the model can never point a
// claim at a document the user does not own).
//
// Zero-fabrication is enforced structurally:
//   - Numeric/date fields are OPTIONAL. When the source does not support a
//     value the model omits it (rendered as "Not available" in the UI) rather
//     than inventing one.
//   - Every record requires a snippet-backed confidence; low-confidence items
//     are surfaced for review, not presented as fact.
// ---------------------------------------------------------------------------

export const severityEnum = z.enum(["low", "medium", "high"]);

export const eventTypeEnum = z.enum([
  "milestone_completed",
  "work_completed",
  "work_underway",
  "schedule_delay",
  "schedule_change",
  "inspection",
  "delivery",
  "change_order",
  "cost",
  "invoice",
  "decision",
  "issue",
  "risk",
  "meeting",
  "upcoming_work",
  "other",
]);

// Shared evidence fields present on every extracted record.
const evidence = {
  // Optional textual location within the source (e.g. "page 2", "row 14").
  source_location: z.string().trim().max(200).optional(),
  // Verbatim supporting snippet from the document, when available.
  snippet: z.string().trim().max(2000).optional(),
  // Model confidence 0..1 that this item is supported by the source.
  confidence: z.number().min(0).max(1),
};

// An ISO date string (YYYY-MM-DD) or omitted. We never accept free-form dates.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "date must be YYYY-MM-DD")
  .optional();

export const projectEventSchema = z.object({
  type: eventTypeEnum.default("other"),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  event_date: isoDate,
  severity: severityEnum.default("low"),
  ...evidence,
});

export const riskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  severity: severityEnum.default("medium"),
  status: z.enum(["open", "mitigated", "closed"]).default("open"),
  due_date: isoDate,
  ...evidence,
});

export const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  status: z.enum(["open", "in_progress", "done"]).default("open"),
  due_date: isoDate,
  assignee: z.string().trim().max(200).optional(),
  ...evidence,
});

export const financialItemSchema = z.object({
  kind: z.enum(["invoice", "cost", "payment", "budget", "other"]).default("other"),
  description: z.string().trim().min(1).max(4000),
  amount: z.number().nonnegative().optional(),
  currency: z.string().trim().length(3).default("USD"),
  item_date: isoDate,
  ...evidence,
});

export const changeOrderSchema = z.object({
  number: z.string().trim().max(50).optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  amount: z.number().optional(),
  currency: z.string().trim().length(3).default("USD"),
  status: z
    .enum(["submitted", "awaiting_approval", "approved", "rejected"])
    .default("submitted"),
  item_date: isoDate,
  ...evidence,
});

export const personSchema = z.object({
  name: z.string().trim().min(1).max(200),
  role: z.string().trim().max(200).optional(),
  organization: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().trim().max(50).optional(),
  ...evidence,
});

export const vendorSchema = z.object({
  name: z.string().trim().min(1).max(200),
  trade: z.string().trim().max(200).optional(),
  contact: z.string().trim().max(200).optional(),
  ...evidence,
});

export const scheduleItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional(),
  planned_start: isoDate,
  planned_end: isoDate,
  status: z
    .enum(["planned", "in_progress", "completed", "delayed"])
    .default("planned"),
  ...evidence,
});

// The full extraction envelope returned by the AI for a single document.
export const extractionResultSchema = z.object({
  events: z.array(projectEventSchema).default([]),
  risks: z.array(riskSchema).default([]),
  tasks: z.array(taskSchema).default([]),
  financial_items: z.array(financialItemSchema).default([]),
  change_orders: z.array(changeOrderSchema).default([]),
  people: z.array(personSchema).default([]),
  vendors: z.array(vendorSchema).default([]),
  schedule_items: z.array(scheduleItemSchema).default([]),
  // When true, the model judged the document too ambiguous/low-signal and the
  // document should be flagged "needs_review" rather than "processed".
  needs_review: z.boolean().default(false),
  review_reason: z.string().trim().max(1000).optional(),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;
export type ExtractedEvent = z.infer<typeof projectEventSchema>;
export type ExtractedRisk = z.infer<typeof riskSchema>;
export type ExtractedTask = z.infer<typeof taskSchema>;
export type ExtractedFinancialItem = z.infer<typeof financialItemSchema>;
export type ExtractedChangeOrder = z.infer<typeof changeOrderSchema>;
export type ExtractedPerson = z.infer<typeof personSchema>;
export type ExtractedVendor = z.infer<typeof vendorSchema>;
export type ExtractedScheduleItem = z.infer<typeof scheduleItemSchema>;
