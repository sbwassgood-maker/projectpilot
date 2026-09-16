import { NextRequest, NextResponse } from "next/server";
import { assertReportOwner, ForbiddenError, NotFoundError } from "@/lib/authz";
import { AuthError } from "@/lib/auth";
import { reportMarkdownToPdf } from "@/lib/pdf";

export const runtime = "nodejs";

// Streams the report as a downloadable PDF. Ownership enforced.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { report } = await assertReportOwner(id);
    const pdf = await reportMarkdownToPdf(report.markdown);

    const safeName = report.title.replace(/[^\w.-]+/gu, "_");
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safeName}.pdf"`,
    );
    headers.set("Cache-Control", "private, no-store");
    return new NextResponse(new Uint8Array(pdf), { status: 200, headers });
  } catch (err) {
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
}
