"use client";

import { useMemo, useState } from "react";
import { Evidence, type EvidenceData } from "./Evidence";
import { SeverityDot } from "./ui";
import { EVENT_TYPE_LABELS, formatDate, formatMoney } from "@/lib/format";

export type TimelineItem = {
  id: string;
  category: "schedule" | "financial" | "change_order" | "risk" | "task" | "document";
  type: string;
  title: string;
  description: string;
  date: string | null; // ISO
  severity: "low" | "medium" | "high";
  amount?: string | null;
  currency?: string;
  evidence: EvidenceData;
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "schedule", label: "Schedule" },
  { key: "financial", label: "Financial" },
  { key: "change_order", label: "Change orders" },
  { key: "risk", label: "Risks" },
  { key: "task", label: "Tasks" },
  { key: "document", label: "Documents" },
];

export function Timeline({ items }: { items: TimelineItem[] }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const list =
      filter === "all" ? items : items.filter((i) => i.category === filter);
    // Sort chronologically; undated items sink to the bottom.
    return [...list].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  }, [items, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={
                active
                  ? {
                      background: "var(--accent)",
                      color: "#fff",
                      borderColor: "var(--accent)",
                    }
                  : { background: "var(--surface)", color: "var(--muted)" }
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="pp-card px-6 py-10 text-center text-sm text-muted">
          No timeline items in this category yet.
        </div>
      ) : (
        <ol className="relative border-l-2 border-border pl-6">
          {filtered.map((item) => (
            <li key={item.id} className="relative mb-6 last:mb-0">
              <span
                className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white"
                style={{
                  background:
                    item.severity === "high"
                      ? "var(--sev-high)"
                      : item.severity === "medium"
                        ? "var(--sev-medium)"
                        : "var(--accent)",
                }}
              />
              <div className="pp-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {EVENT_TYPE_LABELS[item.type] ?? "Update"}
                      </span>
                      {item.severity !== "low" && (
                        <SeverityDot severity={item.severity} />
                      )}
                    </div>
                    <h4 className="mt-0.5 font-semibold text-foreground">
                      {item.title}
                    </h4>
                  </div>
                  <time className="shrink-0 text-xs font-medium text-muted">
                    {formatDate(item.date)}
                  </time>
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  {item.description}
                </p>

                {item.amount != null && (
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(item.amount, item.currency ?? "USD")}
                  </p>
                )}

                <div className="mt-2">
                  <Evidence data={item.evidence} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
