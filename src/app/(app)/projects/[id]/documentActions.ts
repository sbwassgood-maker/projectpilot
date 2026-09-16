"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertDocumentOwner } from "@/lib/authz";
import { removeFile } from "@/lib/storage";
import { processDocument } from "@/lib/ai/pipeline";

export async function reprocessDocumentAction(
  documentId: string,
): Promise<{ error: string | null }> {
  const { document } = await assertDocumentOwner(documentId);
  try {
    await processDocument(documentId);
  } catch (err) {
    return { error: (err as Error).message };
  }
  revalidatePath(`/projects/${document.projectId}`);
  return { error: null };
}

export async function deleteDocumentAction(
  documentId: string,
): Promise<void> {
  const { document } = await assertDocumentOwner(documentId);
  await removeFile(document.storageKey).catch(() => {});
  // Cascades remove all extracted records tied to this document.
  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath(`/projects/${document.projectId}`);
}
