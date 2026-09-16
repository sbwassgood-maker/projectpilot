"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertReportOwner } from "@/lib/authz";
import { getProjectDetail } from "@/lib/projectDetail";
import { generateWeeklyReport } from "@/lib/ai/reportGenerator";

export async function saveReportMarkdownAction(
  reportId: string,
  markdown: string,
): Promise<{ error: string | null }> {
  const { report } = await assertReportOwner(reportId);
  await prisma.report.update({
    where: { id: reportId },
    data: { markdown, edited: true },
  });
  revalidatePath(`/projects/${report.projectId}/reports/${reportId}`);
  return { error: null };
}

export async function regenerateReportAction(
  reportId: string,
): Promise<{ error: string | null }> {
  const { report } = await assertReportOwner(reportId);
  try {
    const detail = await getProjectDetail(report.projectId);
    const generated = await generateWeeklyReport(detail, {
      start: report.periodStart,
      end: report.periodEnd,
    });
    await prisma.report.update({
      where: { id: reportId },
      data: {
        content: generated.content,
        markdown: generated.markdown,
        edited: false,
      },
    });
  } catch (err) {
    return { error: (err as Error).message };
  }
  revalidatePath(`/projects/${report.projectId}/reports/${reportId}`);
  return { error: null };
}
