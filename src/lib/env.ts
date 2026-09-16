// Centralized, server-only environment access.
// Importing this from client components will throw at build time because it
// reads secrets. Keep all secret access here so it is auditable.

import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  authSecret: required("AUTH_SECRET"),

  aiProvider: (process.env.AI_PROVIDER ?? "openai").toLowerCase(),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  fileStorageDir: process.env.FILE_STORAGE_DIR ?? "./storage/uploads",

  // When set, uploaded documents are stored in Vercel Blob (durable object
  // storage) instead of the local filesystem. Required on Vercel.
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN ?? "",
};
