import "server-only";
import PDFDocument from "pdfkit";

// Renders report markdown to a PDF buffer. We handle a small, known subset of
// markdown (H1/H2, list items, paragraphs, italics-as-meta) which is exactly
// what renderMarkdown produces — no arbitrary HTML/markdown parsing needed.
export async function reportMarkdownToPdf(
  markdown: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 64 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const accent = "#b45309";
      const dark = "#0f172a";
      const muted = "#64748b";

      const lines = markdown.split("\n");
      for (const line of lines) {
        const trimmed = line.trimEnd();
        if (trimmed.length === 0) {
          doc.moveDown(0.4);
          continue;
        }
        if (trimmed.startsWith("# ")) {
          doc
            .fillColor(dark)
            .font("Helvetica-Bold")
            .fontSize(20)
            .text(trimmed.slice(2));
          doc.moveDown(0.3);
        } else if (trimmed.startsWith("## ")) {
          doc.moveDown(0.4);
          doc
            .fillColor(accent)
            .font("Helvetica-Bold")
            .fontSize(13)
            .text(trimmed.slice(3).toUpperCase());
          doc
            .strokeColor("#e2e8f0")
            .lineWidth(1)
            .moveTo(doc.x, doc.y + 2)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
            .stroke();
          doc.moveDown(0.4);
        } else if (trimmed.startsWith("- ")) {
          doc
            .fillColor(dark)
            .font("Helvetica")
            .fontSize(11)
            .text(`•  ${trimmed.slice(2)}`, {
              indent: 8,
              lineGap: 2,
            });
        } else if (trimmed.startsWith("_") && trimmed.endsWith("_")) {
          doc
            .fillColor(muted)
            .font("Helvetica-Oblique")
            .fontSize(10)
            .text(trimmed.slice(1, -1));
        } else {
          doc
            .fillColor(dark)
            .font("Helvetica")
            .fontSize(11)
            .text(trimmed, { lineGap: 2 });
        }
      }

      doc.end();
    } catch (err) {
      reject(err as Error);
    }
  });
}
