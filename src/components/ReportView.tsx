"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReportContent } from "@/lib/schemas/report";
import {
  REPORT_SECTION_ORDER,
  REPORT_SECTION_TITLES,
} from "@/lib/schemas/report";
import { Evidence } from "./Evidence";
import {
  saveReportMarkdownAction,
  regenerateReportAction,
} from "@/app/(app)/projects/[id]/reports/[reportId]/reportActions";

type DocMap = Record<string, string>; // documentId -> filename

export function ReportView({
  reportId,
  title,
  periodLabel,
  content,
  markdown,
  edited,
  docMap,
}: {
  reportId: string;
  title: string;
  periodLabel: string;
  content: ReportContent;
  markdown: string;
  edited: boolean;
  docMap: DocMap;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(markdown);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byKey = new Map(content.sections.map((s) => [s.key, s]));

  function save() {
    startTransition(async () => {
      const res = await saveReportMarkdownAction(reportId, draft);
      if (res.error) setError(res.error);
      else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function regenerate() {
    if (
      !confirm(
        "Regenerate this report from the latest project data? Your manual edits will be replaced.",
      )
    )
      return;
    startTransition(async () => {
      const res = await regenerateReportAction(reportId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-8 py-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <p className="text-xs text-muted">
            {periodLabel}
            {edited && " · edited"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                className="pp-btn pp-btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setDraft(markdown);
                }}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                className="pp-btn pp-btn-primary disabled:opacity-60"
                onClick={save}
                disabled={pending}
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <>
              <button
                className="pp-btn pp-btn-secondary"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                className="pp-btn pp-btn-secondary disabled:opacity-60"
                onClick={regenerate}
                disabled={pending}
              >
                {pending ? "Regenerating…" : "Regenerate"}
              </button>
              <a
                className="pp-btn pp-btn-primary"
                href={`/api/reports/${reportId}/pdf`}
              >
                Download PDF
              </a>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Document */}
      <div className="flex justify-center p-8">
        {editing ? (
          <textarea
            className="pp-input min-h-[70vh] w-full max-w-3xl font-mono text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        ) : (
          <article className="pp-card w-full max-w-3xl px-10 py-10">
            <header className="mb-6 border-b border-border pb-4">
              <h1 className="text-2xl font-bold text-foreground">
                Weekly Project Report
              </h1>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {content.project_name}
              </p>
              <p className="text-sm text-muted">{periodLabel}</p>
            </header>

            {REPORT_SECTION_ORDER.map((key) => {
              const section = byKey.get(key);
              const heading = REPORT_SECTION_TITLES[key];
              const hasContent =
                section && (section.points.length > 0 || section.summary);
              return (
                <section key={key} className="mb-6">
                  <h2
                    className="mb-2 text-sm font-bold uppercase tracking-wide"
                    style={{ color: "var(--accent-hover)" }}
                  >
                    {heading}
                  </h2>
                  {!hasContent ? (
                    <p className="text-sm text-muted italic">
                      Information not available.
                    </p>
                  ) : (
                    <>
                      {section!.summary && (
                        <p className="mb-2 text-sm text-slate-700">
                          {section!.summary}
                        </p>
                      )}
                      <ul className="space-y-2">
                        {section!.points.map((p, i) => (
                          <li key={i} className="text-sm text-slate-800">
                            <div className="flex flex-col gap-1">
                              <span>• {p.text}</span>
                              {p.evidence.length > 0 && (
                                <div className="flex flex-wrap gap-1 pl-3">
                                  {p.evidence.map((e, j) => (
                                    <Evidence
                                      key={j}
                                      data={{
                                        documentId: e.document_id,
                                        filename:
                                          docMap[e.document_id] ??
                                          e.label ??
                                          "source document",
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </section>
              );
            })}

            <footer className="mt-8 border-t border-border pt-4 text-xs text-muted">
              Generated by ProjectPilot from processed project documents. Review
              before sending. Every factual point links to its source document
              where available.
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}
