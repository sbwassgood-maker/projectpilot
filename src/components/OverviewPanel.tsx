import { formatDate } from "@/lib/format";

type Overview = {
  progressPct: number | null;
  scheduleStatus: string | null;
  openRisks: number;
  openTasks: number;
  hasFinancials: boolean;
  recentActivity: { title: string; type: string; date: string | null }[];
};

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "warn" | "ok";
}) {
  const color =
    tone === "warn"
      ? "var(--sev-high)"
      : tone === "ok"
        ? "var(--ok)"
        : "var(--foreground)";
  return (
    <div className="pp-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export function OverviewPanel({ overview }: { overview: Overview }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Progress"
          value={
            overview.progressPct !== null ? (
              `${overview.progressPct}%`
            ) : (
              <span className="text-base font-medium text-muted italic">
                Not available
              </span>
            )
          }
        />
        <StatCard
          label="Schedule"
          value={
            overview.scheduleStatus ? (
              overview.scheduleStatus
            ) : (
              <span className="text-base font-medium text-muted italic">
                Not available
              </span>
            )
          }
          tone={overview.scheduleStatus === "At risk" ? "warn" : "ok"}
        />
        <StatCard
          label="Open risks"
          value={overview.openRisks}
          tone={overview.openRisks > 0 ? "warn" : "ok"}
        />
        <StatCard label="Open tasks" value={overview.openTasks} />
      </div>

      {!overview.hasFinancials && (
        <div className="pp-card px-4 py-3 text-sm text-muted">
          <span className="font-semibold text-foreground">
            Budget status:
          </span>{" "}
          Not available — no financial documents have been processed for this
          project yet.
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Recent activity
        </h3>
        {overview.recentActivity.length === 0 ? (
          <div className="pp-card px-4 py-6 text-center text-sm text-muted">
            No activity yet. Upload and process documents to populate the
            project.
          </div>
        ) : (
          <ul className="pp-card divide-y divide-border">
            {overview.recentActivity.map((a, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {a.title}
                  </p>
                  <p className="text-xs text-muted">{a.type}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {formatDate(a.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
