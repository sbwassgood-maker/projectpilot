/**
 * Seeds a demo account so the running app can be explored immediately.
 *   Login: demo@projectpilot.app / demo12345
 * Creates the "Johnson Residence" project and processes the sample documents
 * through the real pipeline (uses AI_PROVIDER from the environment).
 *
 * Run with: bash scripts/with-db.sh node scripts/run-node-script.js scripts/seed.ts
 */
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { saveFile } from "../src/lib/storage";
import { resolveDocType } from "../src/lib/fileTypes";
import { processDocument } from "../src/lib/ai/pipeline";

const SAMPLES = [
  { file: "Daily_Report_0912.txt", mime: "text/plain" },
  { file: "Flooring_Delivery_Email.txt", mime: "text/plain" },
  { file: "Change_Order_14.txt", mime: "text/plain" },
  { file: "Schedule_Update.csv", mime: "text/csv" },
  { file: "Invoice_Electrical.txt", mime: "text/plain" },
];

async function main() {
  const email = "demo@projectpilot.app";
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      name: "Demo Manager",
      passwordHash: await hashPassword("demo12345"),
    },
  });

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

  for (const s of SAMPLES) {
    const bytes = await fs.readFile(path.join(process.cwd(), "samples", s.file));
    const docType = resolveDocType(s.mime, s.file)!;
    const { storageKey, sizeBytes } = await saveFile(project.id, s.file, bytes);
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
  }

  console.log("Seeded demo account: demo@projectpilot.app / demo12345");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
