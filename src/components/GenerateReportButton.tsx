"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateISO } from "@/lib/format";

export function GenerateReportButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [start, setStart] = useState(formatDateISO(weekAgo)!);
  const [end, setEnd] = useState(formatDateISO(today)!);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodStart: start, periodEnd: end }),
      });
      const data = (await res.json()) as { reportId?: string; error?: string };
      if (!res.ok || !data.reportId) {
        throw new Error(data.error ?? "Failed to generate report");
      }
      router.push(`/projects/${projectId}/reports/${data.reportId}`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="pp-btn pp-btn-primary"
        onClick={() => setOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Generate Weekly Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="pp-card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground">
              Generate weekly report
            </h2>
            <p className="mt-1 text-sm text-muted">
              ProjectPilot will analyze this project&apos;s data for the selected
              period and draft an evidence-backed report.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="pp-label" htmlFor="start">
                  Period start
                </label>
                <input
                  id="start"
                  type="date"
                  className="pp-input"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div>
                <label className="pp-label" htmlFor="end">
                  Period end
                </label>
                <input
                  id="end"
                  type="date"
                  className="pp-input"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="pp-btn pp-btn-secondary"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="pp-btn pp-btn-primary disabled:opacity-60"
                onClick={generate}
                disabled={loading}
              >
                {loading ? "Generating…" : "Generate report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
