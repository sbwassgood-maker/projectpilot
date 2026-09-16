import "server-only";
import { prisma } from "../db";
import { readFile } from "../storage";
import { extractText } from "./documentProcessor";
import { extractStructured } from "./eventExtractor";
import type { DocType } from "../fileTypes";
import type { ExtractionResult } from "../schemas/extraction";

// ---------------------------------------------------------------------------
// Document processing pipeline
//
//   Document (uploaded)
//     -> read bytes from storage
//     -> extract text (documentProcessor)
//     -> AI structured extraction (eventExtractor, Zod-validated)
//     -> persist evidence-backed records in a transaction
//     -> update document status
//
// The AI never writes to the DB itself: it returns validated JSON and THIS
// function performs the writes, re-stamping every record with the server-known
// project id and source document id (the model cannot point a claim at another
// project's document).
// ---------------------------------------------------------------------------

function toDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function processDocument(documentId: string): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });
  if (!document) throw new Error("Document not found");

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "processing", processingError: null },
  });

  try {
    const bytes = await readFile(document.storageKey);
    const extraction = await extractText(bytes, document.docType as DocType);

    // Persist extracted text regardless (used for evidence context).
    await prisma.document.update({
      where: { id: documentId },
      data: { extractedText: extraction.text.slice(0, 500_000) },
    });

    // Low-signal (e.g. image, empty): mark needs_review, do not invent data.
    if (extraction.lowSignal || extraction.text.trim().length === 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "needs_review",
          processedAt: new Date(),
          processingError:
            extraction.note ??
            "No extractable text found; manual review recommended.",
        },
      });
      return;
    }

    const { result } = await extractStructured(extraction.text, {
      filename: document.filename,
      documentId: document.id,
    });

    await persistExtraction(document.projectId, document.id, result);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: result.needs_review ? "needs_review" : "processed",
        processedAt: new Date(),
        processingError: result.needs_review
          ? (result.review_reason ?? "Flagged for review by analyzer.")
          : null,
      },
    });
  } catch (err) {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "failed",
        processingError: (err as Error).message.slice(0, 2000),
      },
    });
    throw err;
  }
}

async function persistExtraction(
  projectId: string,
  sourceDocumentId: string,
  result: ExtractionResult,
): Promise<void> {
  // Remove any prior extractions from THIS document (idempotent re-processing).
  await prisma.$transaction([
    prisma.projectEvent.deleteMany({ where: { sourceDocumentId } }),
    prisma.risk.deleteMany({ where: { sourceDocumentId } }),
    prisma.task.deleteMany({ where: { sourceDocumentId } }),
    prisma.financialItem.deleteMany({ where: { sourceDocumentId } }),
    prisma.changeOrder.deleteMany({ where: { sourceDocumentId } }),
    prisma.person.deleteMany({ where: { sourceDocumentId } }),
    prisma.vendor.deleteMany({ where: { sourceDocumentId } }),
    prisma.scheduleItem.deleteMany({ where: { sourceDocumentId } }),
  ]);

  const base = { projectId, sourceDocumentId };

  await prisma.$transaction([
    prisma.projectEvent.createMany({
      data: result.events.map((e) => ({
        ...base,
        type: e.type,
        title: e.title,
        description: e.description,
        eventDate: toDate(e.event_date),
        severity: e.severity,
        sourceLocation: e.source_location ?? null,
        snippet: e.snippet ?? null,
        confidence: e.confidence,
      })),
    }),
    prisma.risk.createMany({
      data: result.risks.map((r) => ({
        ...base,
        title: r.title,
        description: r.description,
        severity: r.severity,
        status: r.status,
        dueDate: toDate(r.due_date),
        sourceLocation: r.source_location ?? null,
        snippet: r.snippet ?? null,
        confidence: r.confidence,
      })),
    }),
    prisma.task.createMany({
      data: result.tasks.map((t) => ({
        ...base,
        title: t.title,
        description: t.description,
        status: t.status,
        dueDate: toDate(t.due_date),
        assignee: t.assignee ?? null,
        sourceLocation: t.source_location ?? null,
        snippet: t.snippet ?? null,
        confidence: t.confidence,
      })),
    }),
    prisma.financialItem.createMany({
      data: result.financial_items.map((f) => ({
        ...base,
        kind: f.kind,
        description: f.description,
        amount: f.amount ?? null,
        currency: f.currency,
        itemDate: toDate(f.item_date),
        sourceLocation: f.source_location ?? null,
        snippet: f.snippet ?? null,
        confidence: f.confidence,
      })),
    }),
    prisma.changeOrder.createMany({
      data: result.change_orders.map((c) => ({
        ...base,
        number: c.number ?? null,
        title: c.title,
        description: c.description,
        amount: c.amount ?? null,
        currency: c.currency,
        status: c.status,
        itemDate: toDate(c.item_date),
        sourceLocation: c.source_location ?? null,
        snippet: c.snippet ?? null,
        confidence: c.confidence,
      })),
    }),
    prisma.person.createMany({
      data: result.people.map((p) => ({
        ...base,
        name: p.name,
        role: p.role ?? null,
        organization: p.organization ?? null,
        email: p.email ?? null,
        phone: p.phone ?? null,
        sourceLocation: p.source_location ?? null,
        snippet: p.snippet ?? null,
        confidence: p.confidence,
      })),
    }),
    prisma.vendor.createMany({
      data: result.vendors.map((v) => ({
        ...base,
        name: v.name,
        trade: v.trade ?? null,
        contact: v.contact ?? null,
        sourceLocation: v.source_location ?? null,
        snippet: v.snippet ?? null,
        confidence: v.confidence,
      })),
    }),
    prisma.scheduleItem.createMany({
      data: result.schedule_items.map((s) => ({
        ...base,
        title: s.title,
        description: s.description ?? null,
        plannedStart: toDate(s.planned_start),
        plannedEnd: toDate(s.planned_end),
        status: s.status,
        sourceLocation: s.source_location ?? null,
        snippet: s.snippet ?? null,
        confidence: s.confidence,
      })),
    }),
  ]);
}
