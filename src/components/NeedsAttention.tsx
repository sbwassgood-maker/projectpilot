"use client";

import { useState } from "react";
import { Evidence, type EvidenceData } from "./Evidence";
import { formatDate } from "@/lib/format";

export type AttentionItem = {
  id: string;
  kind: "risk" | "event" | "change_order";
  severity: "low" | "medium" | "high";
  title: string;
  whatHappened: string;
  whyItMatters: string;
  date: string | null;
  relatedEvents: { title: string; date: string | null }[];
  evidence: EvidenceData;
};

function severityColor(sev: string) {
  return sev === "high"
    ? "var(--sev-high)"
    : sev === "medium"
      ? "var(--sev-medium)"
      : "var(--sev-low)";
}

function severityLabel(sev: string) {
  return sev === "high" ? "RED" : sev === "medium" ? "YELLOW" : "INFO";
}

export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  const [selected, setSelected] = useState<AttentionItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="pp-card flex items-center gap-3 px-5 py-4">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: "var(--ok)" }}
        />
        <p className="text-sm text-foreground">
          Nothing needs attention right now. As documents are processed,
          ProjectPilot will surface risks and pending items here.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => setSelected(item)}
              className="pp-card flex w-full items-center gap-3 px-4 py-3 text-left transition-shadow hover:shadow-md"
            >
              <span
                className="inline-flex h-6 shrink-0 items-center rounded px-2 text-[10px] font-bold text-white"
                style={{ background: severityColor(item.severity) }}
              >
                {severityLabel(item.severity)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="truncate text-xs text-muted">
                  {item.whatHappened}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted">
                {formatDate(item.date)}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="pp-card w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: severityColor(selected.severity), color: "#fff" }}
            >
              <span className="text-xs font-bold">
                {severityLabel(selected.severity)} · Needs attention
              </span>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="text-white/90 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-foreground">
                {selected.title}
              </h3>

              <Section label="What happened">
                <p className="text-sm text-slate-700">{selected.whatHappened}</p>
              </Section>

              <Section label="Why it matters">
                <p className="text-sm text-slate-700">
                  {selected.whyItMatters}
                </p>
              </Section>

              <div className="grid grid-cols-2 gap-4">
                <Section label="Date">
                  <p className="text-sm text-slate-700">
                    {formatDate(selected.date)}
                  </p>
                </Section>
                <Section label="Severity">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: severityColor(selected.severity) }}
                  >
                    {severityLabel(selected.severity)}
                  </p>
                </Section>
              </div>

              {selected.relatedEvents.length > 0 && (
                <Section label="Related project events">
                  <ul className="space-y-1">
                    {selected.relatedEvents.map((e, i) => (
                      <li key={i} className="text-sm text-slate-700">
                        • {e.title}{" "}
                        <span className="text-muted">
                          ({formatDate(e.date)})
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section label="Supporting source">
                <Evidence data={selected.evidence} />
              </Section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}
