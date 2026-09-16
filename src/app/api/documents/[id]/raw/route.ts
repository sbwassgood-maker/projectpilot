import { NextRequest, NextResponse } from "next/server";
import { assertDocumentOwner, ForbiddenError, NotFoundError } from "@/lib/authz";
import { AuthError } from "@/lib/auth";
import { readFile } from "@/lib/storage";

// Serves the original uploaded document bytes for inline preview.
// Access is gated by ownership: a user can only read documents that belong to
// a project they own. This is the file access control layer.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { document } = await assertDocumentOwner(id);
    const bytes = await readFile(document.storageKey);

    const headers = new Headers();
    headers.set("Content-Type", document.mimeType || "application/octet-stream");
    // inline so PDFs/images render in the iframe viewer.
    headers.set(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(document.filename)}"`,
    );
    headers.set("Cache-Control", "private, no-store");

    return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
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
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
