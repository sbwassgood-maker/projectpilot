import "server-only";
import { prisma } from "./db";
import { requireUserOrRedirect } from "./auth";

// ---------------------------------------------------------------------------
// Project intelligence derivation
//
// All values here are DERIVED from stored, evidence-backed records. We never
// invent progress percentages or budget numbers. "Progress" is only reported
// when we have completed vs. total schedule items to compute it from; otherwise
// it is null and the UI shows "Not available".
// ---------------------------------------------------------------------------

export type ProjectSummary = {
  id: string;
  name: string;
  clientName: string | null;
  status: string;
  // Derived progress 0..100, or null when not computable.
  progressPct: number | null;
  attentionCount: number;
  documentCount: number;
  recentActivity: { title: string; date: Date | null; type: string }[];
};

// Attention = open risks (any severity) + high-severity events +
// change orders awaiting approval. Used for the "N items need attention" badge.
async function attentionCountForProject(projectId: string): Promise<number> {
  const [openRisks, highEvents, pendingCOs] = await Promise.all([
    prisma.risk.count({ where: { projectId, status: "open" } }),
    prisma.projectEvent.count({
      where: { projectId, severity: "high" },
    }),
    prisma.changeOrder.count({
      where: { projectId, status: "awaiting_approval" },
    }),
  ]);
  return openRisks + highEvents + pendingCOs;
}

async function progressForProject(projectId: string): Promise<number | null> {
  const total = await prisma.scheduleItem.count({ where: { projectId } });
  if (total === 0) return null; // Not computable -> "Not available"
  const done = await prisma.scheduleItem.count({
    where: { projectId, status: "completed" },
  });
  return Math.round((done / total) * 100);
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const user = await requireUserOrRedirect();
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { documents: true } } },
  });

  return Promise.all(
    projects.map(async (p) => {
      const [attentionCount, progressPct, recentEvents] = await Promise.all([
        attentionCountForProject(p.id),
        progressForProject(p.id),
        prisma.projectEvent.findMany({
          where: { projectId: p.id },
          orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
          take: 3,
          select: { title: true, eventDate: true, type: true },
        }),
      ]);

      return {
        id: p.id,
        name: p.name,
        clientName: p.clientName,
        status: p.status,
        progressPct,
        attentionCount,
        documentCount: p._count.documents,
        recentActivity: recentEvents.map((e) => ({
          title: e.title,
          date: e.eventDate,
          type: e.type,
        })),
      };
    }),
  );
}
