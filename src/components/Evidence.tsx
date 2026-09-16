"use client";

import { useState } from "react";

export type EvidenceData = {
  documentId: string;
  filename: string;
  sourceLocation?: string | null;
  snippet?: string | null;
  confidence?: number | null;
  date?: string | null;
};

// A compact, reusable evidence chip. Clicking it opens a document preview so
// the user can verify the AI claim against the original source. No AI claim is
// ever presented without this attribution.
export function Evidence({ data }: { data: EvidenceData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex max-w-full items-center gap-1.5 rounded border border-border bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:border-accent hover:text-accent-hover"
        title="View source document"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <span className="truncate">Source: {data.filename}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="pp-card flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {data.filename}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                  {data.sourceLocation && <span>{data.sourceLocation}</span>}
                  {data.date && <span>Date: {data.date}</span>}
                  {typeof data.confidence === "number" && (
                    <span>
                      Confidence: {Math.round(data.confidence * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/documents/${data.documentId}/raw`}
                  target="_blank"
                  rel="noreferrer"
                  className="pp-btn pp-btn-secondary"
                >
                  Open in new tab
                </a>
                <button
                  className="text-muted hover:text-foreground"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {data.snippet && (
              <div className="border-b border-border bg-amber-50 px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Supporting excerpt
                </p>
                <p className="mt-1 text-sm text-amber-900">
                  &ldquo;{data.snippet}&rdquo;
                </p>
              </div>
            )}

            <div className="flex-1 overflow-hidden bg-slate-100">
              <iframe
                src={`/api/documents/${data.documentId}/raw`}
                className="h-full w-full"
                title={`Preview of ${data.filename}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
