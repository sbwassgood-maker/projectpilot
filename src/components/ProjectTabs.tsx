"use client";

import { useState } from "react";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "attention", label: "Needs Attention" },
  { key: "timeline", label: "Timeline" },
  { key: "documents", label: "Documents" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ProjectTabs({
  overview,
  attention,
  timeline,
  documents,
  attentionCount,
  documentCount,
}: {
  overview: React.ReactNode;
  attention: React.ReactNode;
  timeline: React.ReactNode;
  documents: React.ReactNode;
  attentionCount: number;
  documentCount: number;
}) {
  const [tab, setTab] = useState<TabKey>("overview");

  const content: Record<TabKey, React.ReactNode> = {
    overview,
    attention,
    timeline,
    documents,
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const active = tab === t.key;
          const badge =
            t.key === "attention"
              ? attentionCount
              : t.key === "documents"
                ? documentCount
                : null;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative -mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
              style={
                active
                  ? { borderColor: "var(--accent)", color: "var(--accent-hover)" }
                  : { borderColor: "transparent", color: "var(--muted)" }
              }
            >
              {t.label}
              {badge !== null && badge > 0 && (
                <span
                  className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
                  style={{
                    background:
                      t.key === "attention"
                        ? "var(--sev-high)"
                        : "var(--muted)",
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="py-6">{content[tab]}</div>
    </div>
  );
}
