import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProjectOwner, ForbiddenError, NotFoundError } from "@/lib/authz";
import { AuthError } from "@/lib/auth";
import { getProjectDetail } from "@/lib/projectDetail";
import { generateWeeklyReport } from "@/lib/ai/reportGenerator";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";

// Generates a weekly report for a project over a period (default: last 7 days).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  try {
    await assertProjectOwner(projectId);

    const body = (await req.json().catch(() => ({}))) as {
      periodStart?: string;
      periodEnd?: string;
    };

    const end = body.periodEnd ? new Date(body.periodEnd) : new Date();
    const start = body.periodStart
      ? new Date(body.periodStart)
      : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    const detail = await getProjectDetail(projectId);
    const generated = await generateWeeklyReport(detail, { start, end });

    const report = await prisma.report.create({
      data: {
        projectId,
        title: `Weekly Report — ${formatDate(end)}`,
        periodStart: start,
        periodEnd: end,
        content: generated.content,
        markdown: generated.markdown,
      },
      select: { id: true },
    });

    return NextResponse.json({ reportId: report.id }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(
    { error: (err as Error).message ?? "Server error" },
    { status: 500 },
  );
}
