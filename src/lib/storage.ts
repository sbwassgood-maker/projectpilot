import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "./env";

// ---------------------------------------------------------------------------
// File storage abstraction
//
// Two backends behind one interface (saveFile / readFile / removeFile):
//
//   - Vercel Blob (production): used automatically when BLOB_READ_WRITE_TOKEN
//     is set. Serverless filesystems are ephemeral/read-only, so uploaded
//     documents must live in durable object storage. The stored `storageKey`
//     is the blob's canonical URL (prefixed with "blob:").
//
//   - Local filesystem (development): used when no blob token is present.
//     The `storageKey` is a project-relative path under FILE_STORAGE_DIR.
//
// Callers never need to know which backend is active.
// ---------------------------------------------------------------------------

const BLOB_PREFIX = "blob:";

function isBlobEnabled(): boolean {
  return env.blobReadWriteToken.length > 0;
}

function storageRoot(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), env.fileStorageDir);
}

export async function saveFile(
  projectId: string,
  originalName: string,
  bytes: Buffer,
): Promise<{ storageKey: string; sizeBytes: number }> {
  const ext = path.extname(originalName);
  const objectPath = `${projectId}/${crypto.randomUUID()}${ext}`;

  if (isBlobEnabled()) {
    const { put } = await import("@vercel/blob");
    const result = await put(objectPath, bytes, {
      access: "public",
      token: env.blobReadWriteToken,
      addRandomSuffix: false,
      contentType: "application/octet-stream",
    });
    return { storageKey: `${BLOB_PREFIX}${result.url}`, sizeBytes: bytes.length };
  }

  // Local filesystem
  const root = storageRoot();
  const full = path.join(root, objectPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, bytes);
  return { storageKey: objectPath, sizeBytes: bytes.length };
}

export async function readFile(storageKey: string): Promise<Buffer> {
  if (storageKey.startsWith(BLOB_PREFIX)) {
    const url = storageKey.slice(BLOB_PREFIX.length);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to read blob (${res.status})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const full = path.join(storageRoot(), storageKey);
  return fs.readFile(full);
}

export async function removeFile(storageKey: string): Promise<void> {
  if (storageKey.startsWith(BLOB_PREFIX)) {
    const url = storageKey.slice(BLOB_PREFIX.length);
    const { del } = await import("@vercel/blob");
    await del(url, { token: env.blobReadWriteToken }).catch(() => {});
    return;
  }

  const full = path.join(storageRoot(), storageKey);
  await fs.rm(full, { force: true });
}
