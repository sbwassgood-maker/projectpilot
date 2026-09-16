import "server-only";
import {
  extractionResultSchema,
  type ExtractionResult,
} from "../schemas/extraction";
import { getAiProvider, type ChatMessage } from "./client";
import { EXTRACTION_SYSTEM_PROMPT } from "./prompts";

// ---------------------------------------------------------------------------
// Event extractor — normalized text -> validated structured extraction.
//
// The model returns JSON; we parse it, strip markdown fences defensively, and
// validate with Zod. Invalid output is REJECTED (never persisted). We attempt
// one repair retry if the first response fails validation.
// ---------------------------------------------------------------------------

export type ExtractionOutput = {
  result: ExtractionResult;
  rawModelJson: string;
};

function stripFences(s: string): string {
  const trimmed = s.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?/u, "")
      .replace(/```$/u, "")
      .trim();
  }
  return trimmed;
}

export async function extractStructured(
  documentText: string,
  meta: { filename: string; documentId: string },
): Promise<ExtractionOutput> {
  const provider = getAiProvider();

  const userContent = [
    `Filename: ${meta.filename}`,
    `Document id: ${meta.documentId}`,
    "",
    "Document text:",
    "-----",
    documentText.slice(0, 60_000), // guard against oversized inputs
    "-----",
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];

  let raw = await provider.completeJson(messages);
  let parsed = tryParse(raw);

  if (!parsed.ok) {
    // One repair attempt: tell the model exactly what was wrong.
    const repair: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: `Your previous response was not valid. Error: ${parsed.error}. Return ONLY a valid JSON object matching the required contract.`,
      },
    ];
    raw = await provider.completeJson(repair);
    parsed = tryParse(raw);
  }

  if (!parsed.ok) {
    throw new ExtractionValidationError(parsed.error);
  }

  return { result: parsed.value, rawModelJson: raw };
}

type ParseResult =
  | { ok: true; value: ExtractionResult }
  | { ok: false; error: string };

function tryParse(raw: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(stripFences(raw));
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
  const validated = extractionResultSchema.safeParse(json);
  if (!validated.success) {
    return {
      ok: false,
      error: validated.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }
  return { ok: true, value: validated.data };
}

export class ExtractionValidationError extends Error {}
