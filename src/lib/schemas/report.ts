import { z } from "zod";

// ---------------------------------------------------------------------------
// Weekly report schema
//
// The report generator returns structured sections. Each section may contain
// bullet points, and each point can carry evidence references (document ids)
// so the UI can render inline source links. Sections that have no supporting
// information are omitted by the model (we never fabricate content); the UI
// renders "Information not available." for expected-but-empty sections.
// ---------------------------------------------------------------------------

export const reportEvidenceRefSchema = z.object({
  document_id: z.string().min(1),
  // Optional short label the UI can show (falls back to filename).
  label: z.string().trim().max(200).optional(),
});

export const reportPointSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  evidence: z.array(reportEvidenceRefSchema).default([]),
});

export const reportSectionKey = z.enum([
  "project_overview",
  "executive_summary",
  "work_completed",
  "work_underway",
  "schedule_status",
  "delays",
  "risks_issues",
  "change_orders",
  "financial_information",
  "upcoming_work",
  "decisions_needed",
  "items_requiring_attention",
]);

export const reportSectionSchema = z.object({
  key: reportSectionKey,
  heading: z.string().trim().min(1).max(200),
  // Free-form summary text for the section (optional).
  summary: z.string().trim().max(4000).optional(),
  points: z.array(reportPointSchema).default([]),
});

export const reportContentSchema = z.object({
  project_name: z.string().trim().min(1),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  sections: z.array(reportSectionSchema).default([]),
});

export type ReportContent = z.infer<typeof reportContentSchema>;
export type ReportSection = z.infer<typeof reportSectionSchema>;
export type ReportPoint = z.infer<typeof reportPointSchema>;

export const REPORT_SECTION_ORDER: z.infer<typeof reportSectionKey>[] = [
  "project_overview",
  "executive_summary",
  "work_completed",
  "work_underway",
  "schedule_status",
  "delays",
  "risks_issues",
  "change_orders",
  "financial_information",
  "upcoming_work",
  "decisions_needed",
  "items_requiring_attention",
];

export const REPORT_SECTION_TITLES: Record<
  z.infer<typeof reportSectionKey>,
  string
> = {
  project_overview: "Project Overview",
  executive_summary: "Executive Summary",
  work_completed: "Work Completed",
  work_underway: "Work Underway",
  schedule_status: "Schedule Status",
  delays: "Delays",
  risks_issues: "Risks / Issues",
  change_orders: "Change Orders",
  financial_information: "Financial Information",
  upcoming_work: "Upcoming Work",
  decisions_needed: "Decisions Needed",
  items_requiring_attention: "Items Requiring Attention",
};
