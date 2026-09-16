import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { assertReportOwner, ForbiddenError, NotFoundError } from "@/lib/authz";
import { AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reportContentSchema } from "@/lib/schemas/report";
import { formatDate } from "@/lib/format";
import { ReportView } from "@/components/ReportView";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string; reportId: string }>;
}) {
  const { id: projectId, reportId } = await params;

  let report;
  try {
    ({ report } = await assertReportOwner(reportId));
  } catch (err) {
    if (err instanceof AuthError) redirect("/login");
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      notFound();
    }
    throw err;
  }

  // Build a documentId -> filename map for evidence rendering.
  const docs = await prisma.document.findMany({
    where: { projectId: report.projectId },
    select: { id: true, filename: true },
  });
  const docMap: Record<string, string> = {};
  for (const d of docs) docMap[d.id] = d.filename;

  const parsed = reportContentSchema.safeParse(report.content);
  if (!parsed.success) {
    // Stored content should always be valid; guard anyway.
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">
          This report&apos;s stored content could not be read.
        </p>
      </div>
    );
  }

  const periodLabel = `Reporting period: ${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}`;

  return (
    <div>
      <div className="px-8 pt-4">
        <Link
          href={`/projects/${projectId}`}
          className="text-xs text-muted hover:underline"
        >
          ← Back to project
        </Link>
      </div>
      <ReportView
        reportId={report.id}
        title={report.title}
        periodLabel={periodLabel}
        content={parsed.data}
        markdown={report.markdown}
        edited={report.edited}
        docMap={docMap}
      />
    </div>
  );
}
