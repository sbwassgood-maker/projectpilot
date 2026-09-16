/**
 * End-to-end verification of the ProjectPilot MVP success flow, exercising the
 * REAL production code paths (Prisma, storage, AI pipeline, report generator).
 *
 *   1. Create a user (hashed password)
 *   2. Create "Johnson Residence"
 *   3. Upload several realistic construction documents
 *   4. Process them through the AI pipeline (extract -> validate -> persist)
 *   5. Assert events / risks / change orders / financials were extracted
 *   6. Assert timeline + needs-attention + evidence derive correctly
 *   7. Generate a weekly report and assert it is grounded in real data
 *
 * Run with: bash scripts/with-db.sh npx tsx scripts/e2e.ts
 */
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { saveFile } from "../src/lib/storage";
import { resolveDocType } from "../src/lib/fileTypes";
import { processDocument } from "../src/lib/ai/pipeline";
import { loadProjectDetail } from "../src/lib/projectDetail";
import {
  buildTimeline,
  buildAttention,
  buildOverview,
} from "../src/lib/intelligence";
import { generateWeeklyReport, renderMarkdown } from "../src/lib/ai/reportGenerator";

const SAMPLES = [
  { file: "Daily_Report_0912.txt", mime: "text/plain" },
  { file: "Flooring_Delivery_Email.txt", mime: "text/plain" },
  { file: "Change_Order_14.txt", mime: "text/plain" },
  { file: "Schedule_Update.csv", mime: "text/csv" },
  { file: "Invoice_Electrical.txt", mime: "text/plain" },
];

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log("\n=== ProjectPilot E2E verification ===\n");

  // Clean any prior run for a deterministic result.
  const email = "e2e@johnsonbuild.com";
  await prisma.user.deleteMany({ where: { email } });

  // 1. User
  console.log("1. Create account");
  const user = await prisma.user.create({
    data: {
      email,
      name: "E2E Tester",
      passwordHash: await hashPassword("supersecret123"),
    },
  });
  assert(user.id, "user created with hashed password");
  assert(user.passwordHash !== "supersecret123", "password is not stored in plaintext");

  // 2. Project
  console.log("\n2. Create project 'Johnson Residence'");
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: "Johnson Residence",
      clientName: "Mr. & Mrs. Johnson",
      address: "1420 Maple Ave, Austin, TX",
      startDate: new Date("2026-09-01"),
      targetEndDate: new Date("2026-12-15"),
    },
  });
  assert(project.id, "project created");

  // 3 + 4. Upload + process documents
  console.log("\n3-4. Upload and process documents");
  for (const s of SAMPLES) {
    const bytes = await fs.readFile(
      path.join(process.cwd(), "samples", s.file),
    );
    const docType = resolveDocType(s.mime, s.file)!;
    const { storageKey, sizeBytes } = await saveFile(
      project.id,
      s.file,
      bytes,
    );
    const doc = await prisma.document.create({
      data: {
        projectId: project.id,
        filename: s.file,
        storageKey,
        mimeType: s.mime,
        docType,
        sizeBytes,
        status: "processing",
      },
    });
    await processDocument(doc.id);
    const after = await prisma.document.findUnique({ where: { id: doc.id } });
    console.log(`  · ${s.file} -> ${after?.status}`);
  }

  // 5. Assert extraction
  console.log("\n5. Structured extraction persisted");
  const detail = await loadProjectDetail(project);
  assert(detail.events.length > 0, `events extracted (${detail.events.length})`);
  assert(
    detail.changeOrders.length > 0,
    `change orders extracted (${detail.changeOrders.length})`,
  );
  assert(
    detail.financialItems.length > 0,
    `financial items extracted (${detail.financialItems.length})`,
  );

  const delay = detail.events.find((e) => e.type === "schedule_delay");
  assert(delay, "flooring delay detected as a schedule_delay event");

  const co = detail.changeOrders.find((c) => c.number === "14");
  assert(co, "Change Order #14 detected");
  assert(
    co!.status === "awaiting_approval",
    "Change Order #14 flagged awaiting approval",
  );
  assert(
    co!.amount != null && Number(co!.amount) === 8200,
    "Change Order #14 amount = $8,200 (not fabricated, read from doc)",
  );

  // 6. Evidence — every AI record references a real source document
  console.log("\n6. Evidence / source tracking");
  const allRecords = [
    ...detail.events,
    ...detail.risks,
    ...detail.changeOrders,
    ...detail.financialItems,
  ];
  assert(
    allRecords.every((r) => r.sourceDocumentId),
    "every extracted record has a sourceDocumentId",
  );
  assert(
    allRecords.every((r) => r.sourceDocument && r.sourceDocument.filename),
    "every record resolves to a real source document filename",
  );
  const flooringDelayFromEmail = detail.events.find(
    (e) =>
      e.type === "schedule_delay" &&
      e.sourceDocument.filename === "Flooring_Delivery_Email.txt",
  );
  assert(
    flooringDelayFromEmail,
    "a flooring delay traces to Flooring_Delivery_Email.txt",
  );
  assert(
    flooringDelayFromEmail!.snippet &&
      flooringDelayFromEmail!.snippet.length > 0,
    "the flooring delay has a supporting snippet (evidence)",
  );

  // Timeline + attention derivation
  console.log("\n7. Timeline & Needs Attention");
  const timeline = buildTimeline(detail);
  assert(timeline.length > 0, `timeline built (${timeline.length} items)`);
  assert(
    timeline.every((t) => t.evidence.documentId),
    "every timeline item carries evidence",
  );

  const attention = buildAttention(detail);
  assert(attention.length > 0, `needs-attention items built (${attention.length})`);
  const coAttention = attention.find((a) => a.title.includes("Change Order 14"));
  assert(coAttention, "Change Order 14 surfaced in Needs Attention");
  assert(coAttention!.severity === "high", "Change Order 14 is RED (high severity)");

  const overview = buildOverview(detail);
  console.log(
    `  · overview: progress=${overview.progressPct ?? "N/A"} schedule=${overview.scheduleStatus ?? "N/A"} openRisks=${overview.openRisks}`,
  );

  // 8. Weekly report
  console.log("\n8. Generate weekly report");
  const end = new Date("2026-09-19");
  const start = new Date("2026-09-08");
  const generated = await generateWeeklyReport(detail, { start, end });
  assert(generated.content.sections.length > 0, "report has sections");
  assert(
    generated.markdown.includes("Johnson Residence"),
    "report references the project name",
  );
  assert(
    generated.markdown.includes("Change Order"),
    "report includes the change order",
  );
  assert(
    generated.markdown.includes("Information not available."),
    "empty sections say 'Information not available.' (no fabrication)",
  );

  // Persist the report (as the API route does)
  const report = await prisma.report.create({
    data: {
      projectId: project.id,
      title: "Weekly Report — Sep 19, 2026",
      periodStart: start,
      periodEnd: end,
      content: generated.content,
      markdown: generated.markdown,
    },
  });
  assert(report.id, "report persisted to database");

  // Re-render from stored content to confirm round-trip
  const reloaded = await prisma.report.findUnique({ where: { id: report.id } });
  const rerendered = renderMarkdown(generated.content);
  assert(reloaded!.markdown === rerendered, "stored markdown matches renderer");

  console.log("\n--- REPORT PREVIEW (first 40 lines) ---\n");
  console.log(generated.markdown.split("\n").slice(0, 40).join("\n"));

  console.log("\n=== ALL E2E ASSERTIONS PASSED ✓ ===\n");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
