// Maps uploads to our DocumentType enum and enforces the allowed set.

export type DocType =
  | "pdf"
  | "docx"
  | "xlsx"
  | "csv"
  | "txt"
  | "image"
  | "other";

// Accepted MIME types -> DocType
const MIME_MAP: Record<string, DocType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/csv": "csv",
  "text/plain": "txt",
  "image/jpeg": "image",
  "image/png": "image",
};

const EXT_MAP: Record<string, DocType> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".xlsx": "xlsx",
  ".csv": "csv",
  ".txt": "txt",
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
};

export const ACCEPT_ATTR =
  ".pdf,.docx,.xlsx,.csv,.txt,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain,image/jpeg,image/png";

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export function resolveDocType(
  mime: string,
  filename: string,
): DocType | null {
  if (MIME_MAP[mime]) return MIME_MAP[mime];
  const dot = filename.lastIndexOf(".");
  if (dot >= 0) {
    const ext = filename.slice(dot).toLowerCase();
    if (EXT_MAP[ext]) return EXT_MAP[ext];
  }
  return null; // not allowed
}
