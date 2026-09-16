import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUserOrRedirect } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui";
import { DocumentStatusBadge, docTypeLabel } from "@/components/DocumentBits";

export default async function DocumentsPage() {
  const user = await requireUserOrRedirect();
  const documents = await prisma.document.findMany({
    where: { project: { userId: user.id } },
    orderBy: { uploadedAt: "desc" },
    include: { project: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="All documents across your projects"
      />
      <div className="p-8">
        {documents.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Open a project and upload documents to get started."
          />
        ) : (
          <div className="pp-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Filename</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">Uploaded</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-border last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {d.filename}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {docTypeLabel(d.docType)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${d.project.id}`}
                        className="font-medium"
                        style={{ color: "var(--accent-hover)" }}
                      >
                        {d.project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {d.uploadedAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <DocumentStatusBadge status={d.status} />
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
