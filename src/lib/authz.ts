import "server-only";
import { prisma } from "./db";
import { requireUser } from "./auth";

// ---------------------------------------------------------------------------
// Authorization / ownership guards
//
// A user must NEVER access another user's projects or documents. Every guard
// here re-checks ownership against the current session, so there is no code
// path that trusts a client-supplied id without verifying it belongs to the
// caller.
// ---------------------------------------------------------------------------

export class ForbiddenError extends Error {}
export class NotFoundError extends Error {}

// Ensures the current user owns the given project. Returns the project.
export async function assertProjectOwner(projectId: string) {
  const user = await requireUser();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new NotFoundError("Project not found");
  if (project.userId !== user.id) throw new ForbiddenError("Access denied");
  return { user, project };
}

// Ensures the current user owns the project that a document belongs to.
export async function assertDocumentOwner(documentId: string) {
  const user = await requireUser();
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { project: true },
  });
  if (!document) throw new NotFoundError("Document not found");
  if (document.project.userId !== user.id) {
    throw new ForbiddenError("Access denied");
  }
  return { user, document };
}

// Ensures the current user owns the project that a report belongs to.
export async function assertReportOwner(reportId: string) {
  const user = await requireUser();
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { project: true },
  });
  if (!report) throw new NotFoundError("Report not found");
  if (report.project.userId !== user.id) {
    throw new ForbiddenError("Access denied");
  }
  return { user, report };
}
