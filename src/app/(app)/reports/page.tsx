import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUserOrRedirect } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function ReportsPage() {
  const user = await requireUserOrRedirect();
  const reports = await prisma.report.findMany({
    where: { project: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Weekly reports generated across your projects"
      />
      <div className="p-8">
        {reports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="Open a project and click “Generate Weekly Report” to create one."
          />
        ) : (
          <div className="pp-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Report</th>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${r.project.id}/reports/${r.id}`}
                        className="font-medium"
                        style={{ color: "var(--accent-hover)" }}
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {r.project.name}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {r.periodStart.toLocaleDateString()} –{" "}
                      {r.periodEnd.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {r.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
