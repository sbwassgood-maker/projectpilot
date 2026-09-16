import Link from "next/link";
import type { ProjectSummary } from "@/lib/projects";
import { StatusBadge } from "./ui";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="pp-card block p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            {project.name}
          </h3>
          <p className="truncate text-sm text-muted">
            {project.clientName ?? "No client set"}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mt-4">
        {project.progressPct !== null ? (
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Progress</span>
              <span className="font-semibold text-foreground">
                {project.progressPct}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${project.progressPct}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted italic">Progress not available</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span
          className="inline-flex items-center gap-1.5 font-medium"
          style={{
            color:
              project.attentionCount > 0 ? "var(--sev-high)" : "var(--muted)",
          }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background:
                project.attentionCount > 0
                  ? "var(--sev-high)"
                  : "var(--ok)",
            }}
          />
          {project.attentionCount > 0
            ? `${project.attentionCount} item${project.attentionCount === 1 ? "" : "s"} need attention`
            : "No open attention items"}
        </span>
        <span className="text-muted">{project.documentCount} docs</span>
      </div>

      {project.recentActivity.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Recent activity
          </p>
          <ul className="space-y-1">
            {project.recentActivity.map((a, i) => (
              <li key={i} className="truncate text-xs text-foreground">
                • {a.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Link>
  );
}
