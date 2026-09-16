const DOC_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  docx: "Word",
  xlsx: "Excel",
  csv: "CSV",
  txt: "Text",
  image: "Image",
  other: "File",
};

export function docTypeLabel(t: string): string {
  return DOC_TYPE_LABELS[t] ?? "File";
}

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  uploading: { bg: "#f1f5f9", color: "#475569", label: "Uploading" },
  processing: { bg: "#eff6ff", color: "#1d4ed8", label: "Processing" },
  processed: { bg: "#ecfdf5", color: "#047857", label: "Processed" },
  needs_review: { bg: "#fefce8", color: "#a16207", label: "Needs review" },
  failed: { bg: "#fef2f2", color: "#b91c1c", label: "Failed" },
};

export function DocumentStatusBadge({ status }: { status: string }) {
  const s =
    STATUS_STYLES[status] ?? { bg: "#f1f5f9", color: "#475569", label: status };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {(status === "processing" || status === "uploading") && (
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {s.label}
    </span>
  );
}
