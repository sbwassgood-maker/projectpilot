import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectDetail } from "@/lib/projectDetail";
import { ForbiddenError, NotFoundError } from "@/lib/authz";
import { AuthError } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  buildOverview,
  buildTimeline,
  buildAttention,
} from "@/lib/intelligence";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui";
import { ProjectTabs } from "@/components/ProjectTabs";
import { OverviewPanel } from "@/components/OverviewPanel";
import { Timeline } from "@/components/Timeline";
import { NeedsAttention } from "@/components/NeedsAttention";
import { DocumentsPanel, type DocRow } from "@/components/DocumentsPanel";
import { GenerateReportButton } from "@/components/GenerateReportButton";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail;
  try {
    detail = await getProjectDetail(id);
  } catch (err) {
    if (err instanceof AuthError) redirect("/login");
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      notFound();
    }
    throw err;
  }

  const { project } = detail;
  const overview = buildOverview(detail);
  const timeline = buildTimeline(detail);
  const attention = buildAttention(detail);

  const docRows: DocRow[] = detail.documents.map((d) => ({
    id: d.id,
    filename: d.filename,
    docType: d.docType,
    status: d.status,
    uploadedAt: d.uploadedAt.toLocaleDateString(),
    processingError: d.processingError,
  }));

  const latestReport = detail.reports[0];

  return (
    <div>
      {/* Header */}
      <div className="border-b border-border bg-surface px-8 py-5">
        <div className="mb-1 flex items-center gap-2 text-xs text-muted">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <span>/</span>
          <span>{project.name}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
              <Meta label="Client" value={project.clientName} />
              <Meta label="Address" value={project.address} />
              <Meta label="Start" value={formatDate(project.startDate)} />
              <Meta
                label="Expected completion"
                value={formatDate(project.targetEndDate)}
              />
            </dl>
          </div>
          <div className="flex items-center gap-2">
            {latestReport && (
              <Link
                href={`/projects/${project.id}/reports/${latestReport.id}`}
                className="pp-btn pp-btn-secondary"
              >
                Latest report
              </Link>
            )}
            <GenerateReportButton projectId={project.id} />
          </div>
        </div>
      </div>

      <div className="px-8">
        <ProjectTabs
          attentionCount={attention.filter((a) => a.severity !== "low").length}
          documentCount={docRows.length}
          overview={<OverviewPanel overview={overview} />}
          attention={<NeedsAttention items={attention} />}
          timeline={<Timeline items={timeline} />}
          documents={
            <DocumentsPanel projectId={project.id} documents={docRows} />
          }
        />
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="text-foreground">
        {value ? value : <span className="text-muted italic">Not available</span>}
      </dd>
    </div>
  );
}
