import "server-only";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import type { DocType } from "../fileTypes";

// ---------------------------------------------------------------------------
// Document processor — file bytes -> normalized plain text.
//
// This is the first stage of the pipeline. It extracts textual content from
// each supported file type so the AI layer has clean text to reason over.
// Images (JPG/PNG) have no embedded text in the MVP; we return an empty string
// and the pipeline flags the document as "needs_review" so a human can decide
// whether OCR is warranted (we never fabricate content from an image).
// ---------------------------------------------------------------------------

export type ExtractionOutcome = {
  text: string;
  // True when we could not extract meaningful text (e.g. images, empty files).
  lowSignal: boolean;
  note?: string;
};

export async function extractText(
  bytes: Buffer,
  docType: DocType,
): Promise<ExtractionOutcome> {
  switch (docType) {
    case "pdf":
      return extractPdf(bytes);
    case "docx":
      return extractDocx(bytes);
    case "xlsx":
      return extractXlsx(bytes);
    case "csv":
    case "txt":
      return normalize(bytes.toString("utf8"));
    case "image":
      return {
        text: "",
        lowSignal: true,
        note: "Image files have no extractable text in this version.",
      };
    default:
      return normalize(bytes.toString("utf8"));
  }
}

function normalize(raw: string): ExtractionOutcome {
  const text = raw.replace(/\r\n/gu, "\n").replace(/\u0000/gu, "").trim();
  return { text, lowSignal: text.length < 20 };
}

async function extractPdf(bytes: Buffer): Promise<ExtractionOutcome> {
  try {
    // pdf-parse v2 exposes a named export; fall back to default for safety.
    const mod = (await import("pdf-parse")) as unknown as {
      default?: (b: Buffer) => Promise<{ text: string }>;
      pdf?: (b: Buffer) => Promise<{ text: string }>;
    };
    const fn = mod.pdf ?? mod.default;
    if (!fn) throw new Error("pdf-parse unavailable");
    const result = await fn(bytes);
    return normalize(result.text ?? "");
  } catch (err) {
    return {
      text: "",
      lowSignal: true,
      note: `Could not read PDF: ${(err as Error).message}`,
    };
  }
}

async function extractDocx(bytes: Buffer): Promise<ExtractionOutcome> {
  try {
    const result = await mammoth.extractRawText({ buffer: bytes });
    return normalize(result.value ?? "");
  } catch (err) {
    return {
      text: "",
      lowSignal: true,
      note: `Could not read DOCX: ${(err as Error).message}`,
    };
  }
}

function extractXlsx(bytes: Buffer): ExtractionOutcome {
  try {
    const wb = XLSX.read(bytes, { type: "buffer" });
    const parts: string[] = [];
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim().length > 0) {
        parts.push(`# Sheet: ${sheetName}\n${csv}`);
      }
    }
    return normalize(parts.join("\n\n"));
  } catch (err) {
    return {
      text: "",
      lowSignal: true,
      note: `Could not read spreadsheet: ${(err as Error).message}`,
    };
  }
}
