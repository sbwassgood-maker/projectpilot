import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border bg-surface px-8 py-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  in_progress: "In progress",
  on_hold: "On hold",
  completed: "Completed",
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  planning: { bg: "#eff6ff", color: "#1d4ed8" },
  in_progress: { bg: "#fefce8", color: "#a16207" },
  on_hold: { bg: "#fef2f2", color: "#b91c1c" },
  completed: { bg: "#ecfdf5", color: "#047857" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "#f1f5f9", color: "#475569" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function SeverityDot({
  severity,
}: {
  severity: "low" | "medium" | "high";
}) {
  const color =
    severity === "high"
      ? "var(--sev-high)"
      : severity === "medium"
        ? "var(--sev-medium)"
        : "var(--sev-low)";
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: color }}
      aria-label={`${severity} severity`}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="pp-card flex flex-col items-center justify-center px-6 py-14 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Renders a value or an explicit "Not available." per the zero-fabrication rule.
export function ValueOrNA({ value }: { value: ReactNode | null | undefined }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted italic">Not available</span>;
  }
  return <>{value}</>;
}
