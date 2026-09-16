"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { DocumentStatusBadge, docTypeLabel } from "./DocumentBits";
import { ACCEPT_ATTR } from "@/lib/fileTypes";
import {
  reprocessDocumentAction,
  deleteDocumentAction,
} from "@/app/(app)/projects/[id]/documentActions";

export type DocRow = {
  id: string;
  filename: string;
  docType: string;
  status: string;
  uploadedAt: string;
  processingError: string | null;
};

export function DocumentsPanel({
  projectId,
  documents,
}: {
  projectId: string;
  documents: DocRow[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of list) fd.append("files", f);
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Upload failed");
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void uploadFiles(e.dataTransfer.files);
        }}
        className="pp-card flex flex-col items-center justify-center border-2 border-dashed px-6 py-10 text-center transition-colors"
        style={{
          borderColor: dragOver ? "var(--accent)" : "var(--border)",
          background: dragOver ? "rgba(217,119,6,0.04)" : "var(--surface)",
        }}
      >
        <p className="text-sm font-medium text-foreground">
          Drag &amp; drop documents here
        </p>
        <p className="mt-1 text-xs text-muted">
          PDF, Word, Excel, CSV, TXT, JPG, PNG · up to 25MB each
        </p>
        <button
          className="pp-btn pp-btn-primary mt-4 disabled:opacity-60"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading & processing…" : "Select files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
        />
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
        {uploading && (
          <p className="mt-3 text-xs text-muted">
            Documents are being read and analyzed by the AI. This can take a
            few seconds per file.
          </p>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="pp-card px-4 py-8 text-center text-sm text-muted">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="pp-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Filename</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Uploaded</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-border last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`/api/documents/${d.id}/raw`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-foreground hover:underline"
                    >
                      {d.filename}
                    </a>
                    {d.processingError && d.status !== "processed" && (
                      <p className="mt-0.5 max-w-md truncate text-xs text-muted">
                        {d.processingError}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {docTypeLabel(d.docType)}
                  </td>
                  <td className="px-4 py-3 text-muted">{d.uploadedAt}</td>
                  <td className="px-4 py-3">
                    <DocumentStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {(d.status === "failed" ||
                        d.status === "needs_review") && (
                        <button
                          className="text-xs font-semibold text-accent-hover hover:underline disabled:opacity-50"
                          style={{ color: "var(--accent-hover)" }}
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              await reprocessDocumentAction(d.id);
                              router.refresh();
                            })
                          }
                        >
                          Reprocess
                        </button>
                      )}
                      <button
                        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await deleteDocumentAction(d.id);
                            router.refresh();
                          })
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
