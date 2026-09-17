// Centralized, server-only environment access.
//
// Values are exposed as LAZY GETTERS: nothing is read (or validated) until the
// property is actually accessed at request time. This means a missing optional
// variable never crashes the build (page-data collection evaluates modules),
// and required-secret errors surface only on the request that truly needs them.

import "server-only";

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

// Reads a required secret. Throws only when accessed without a value, so it
// never breaks the build — only the specific request that needs it.
function requiredAtUse(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// A development-safe fallback for AUTH_SECRET so local dev / builds without the
// var set do not crash. In production you MUST set AUTH_SECRET; if it is unset
// we fall back to a fixed dev key and warn (sessions won't be secure).
let warnedAuthSecret = false;
function authSecretValue(): string {
  const value = process.env.AUTH_SECRET;
  if (value && value.length > 0) return value;
  if (!warnedAuthSecret) {
    warnedAuthSecret = true;
    console.warn(
      "[projectpilot] AUTH_SECRET is not set — using an insecure development fallback. Set AUTH_SECRET in production.",
    );
  }
  return "dev-insecure-fallback-auth-secret-change-me";
}

export const env = {
  // Required at use (throws only if a request actually needs the DB and it is
  // unset). Prisma itself also reads DATABASE_URL directly.
  get databaseUrl(): string {
    return requiredAtUse("DATABASE_URL");
  },

  // Never throws: falls back to an insecure dev key with a warning.
  get authSecret(): string {
    return authSecretValue();
  },

  // Default provider is the keyless deterministic extractor, so the app runs
  // with no API key. Set AI_PROVIDER=openai (+ OPENAI_API_KEY) for the real LLM.
  get aiProvider(): string {
    return (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  },
  get openaiApiKey(): string {
    return optional("OPENAI_API_KEY");
  },
  get openaiModel(): string {
    return optional("OPENAI_MODEL", "gpt-4o-mini");
  },

  get fileStorageDir(): string {
    return optional("FILE_STORAGE_DIR", "./storage/uploads");
  },

  // When set, uploaded documents are stored in Vercel Blob (durable object
  // storage) instead of the local filesystem. Required on Vercel.
  get blobReadWriteToken(): string {
    return optional("BLOB_READ_WRITE_TOKEN");
  },
};
