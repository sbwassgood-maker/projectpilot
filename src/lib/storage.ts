import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "./env";

// ---------------------------------------------------------------------------
// File storage abstraction
//
// For the MVP we store uploaded documents on the local filesystem under a
// configurable directory. The interface (save/read/remove/path) is deliberately
// storage-agnostic so it can be swapped for S3-compatible storage later without
// touching callers.
// ---------------------------------------------------------------------------

function storageRoot(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), env.fileStorageDir);
}

export async function saveFile(
  projectId: string,
  originalName: string,
  bytes: Buffer,
): Promise<{ storageKey: string; sizeBytes: number }> {
  const root = storageRoot();
  const dir = path.join(root, projectId);
  await fs.mkdir(dir, { recursive: true });

  const ext = path.extname(originalName);
  const key = `${projectId}/${crypto.randomUUID()}${ext}`;
  const full = path.join(root, key);
  await fs.writeFile(full, bytes);

  return { storageKey: key, sizeBytes: bytes.length };
}

export async function readFile(storageKey: string): Promise<Buffer> {
  const full = path.join(storageRoot(), storageKey);
  return fs.readFile(full);
}

export async function removeFile(storageKey: string): Promise<void> {
  const full = path.join(storageRoot(), storageKey);
  await fs.rm(full, { force: true });
}
