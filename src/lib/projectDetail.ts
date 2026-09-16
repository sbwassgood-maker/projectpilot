import "server-only";
import { assertProjectOwner } from "./authz";
import { prisma } from "./db";

// Loads a full project detail payload (project + all evidence-backed records),
// enforcing ownership. Callers that already hold an authorized project should
// use loadProjectDetail directly.
export async function getProjectDetail(projectId: string) {
  const { project } = await assertProjectOwner(projectId);
  return loadProjectDetail(project);
}

type ProjectRecord = Awaited<
  ReturnType<typeof prisma.project.findUniqueOrThrow>
>;

// Loads all evidence-backed records for an already-authorized project.
// Does NOT perform authorization — the caller must have verified ownership.
export async function loadProjectDetail(project: ProjectRecord) {
  const projectId = project.id;

  const [
    documents,
    events,
    risks,
    tasks,
    financialItems,
    changeOrders,
    people,
    vendors,
    scheduleItems,
    reports,
  ] = await Promise.all([
    prisma.document.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.projectEvent.findMany({
      where: { projectId },
      orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
      include: { sourceDocument: { select: { id: true, filename: true } } },
    }),
    prisma.risk.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { sourceDocument: { select: { id: true, filename: true } } },
    }),
    prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { sourceDocument: { select: { id: true, filename: true } } },
    }),
    prisma.financialItem.findMany({
      where: { projectId },
      orderBy: { itemDate: "desc" },
      include: { sourceDocument: { select: { id: true, filename: true } } },
    }),
    prisma.changeOrder.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { sourceDocument: { select: { id: true, filename: true } } },
    }),
    prisma.person.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { sourceDocument: { select: { id: true, filename: true } } },
    }),
    prisma.vendor.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { sourceDocument: { select: { id: true, filename: true } } },
    }),
    prisma.scheduleItem.findMany({
      where: { projectId },
      orderBy: { plannedStart: "asc" },
      include: { sourceDocument: { select: { id: true, filename: true } } },
    }),
    prisma.report.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        periodStart: true,
        periodEnd: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    project,
    documents,
    events,
    risks,
    tasks,
    financialItems,
    changeOrders,
    people,
    vendors,
    scheduleItems,
    reports,
  };
}

export type ProjectDetail = NonNullable<
  Awaited<ReturnType<typeof getProjectDetail>>
>;
