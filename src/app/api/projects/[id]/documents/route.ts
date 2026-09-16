import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProjectOwner, ForbiddenError, NotFoundError } from "@/lib/authz";
import { AuthError } from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import {
  resolveDocType,
  MAX_FILE_BYTES,
} from "@/lib/fileTypes";
import { processDocument } from "@/lib/ai/pipeline";

export const runtime = "nodejs";

// Uploads one or more documents to a project, then processes them.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  try {
    await assertProjectOwner(projectId);

    const formData = await req.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const created: { id: string }[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `${file.name} exceeds the 25MB limit.` },
          { status: 400 },
        );
      }
      const docType = resolveDocType(file.type, file.name);
      if (!docType) {
        return NextResponse.json(
          { error: `${file.name} is not a supported file type.` },
          { status: 400 },
        );
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      const { storageKey, sizeBytes } = await saveFile(
        projectId,
        file.name,
        bytes,
      );

      const doc = await prisma.document.create({
        data: {
          projectId,
          filename: file.name,
          storageKey,
          mimeType: file.type || "application/octet-stream",
          docType,
          sizeBytes,
          status: "processing",
        },
        select: { id: true },
      });
      created.push(doc);
    }

    // Process sequentially so we surface errors and don't overload the model.
    // Runs within the request; the UI polls document status afterwards.
    for (const doc of created) {
      try {
        await processDocument(doc.id);
      } catch {
        // processDocument already recorded the failure on the document row.
      }
    }

    return NextResponse.json({ documents: created }, { status: 201 });
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
