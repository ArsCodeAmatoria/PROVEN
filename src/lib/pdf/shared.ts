import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const PDF = {
  margin: 40,
  pageWidth: 612,
  pageHeight: 792,
  contentWidth: 532,
  primary: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  line: [226, 232, 240] as [number, number, number],
  accent: [14, 165, 233] as [number, number, number],
};

export type PdfImage = {
  dataUrl: string;
  format: "JPEG" | "PNG" | "WEBP";
  width: number;
  height: number;
};

export async function fetchPdfImage(
  url: string | null | undefined,
  maxBytes = 2_500_000,
): Promise<PdfImage | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > maxBytes) return null;

    let format: PdfImage["format"] = "JPEG";
    if (contentType.includes("png") || url.toLowerCase().includes(".png")) {
      format = "PNG";
    } else if (
      contentType.includes("webp") ||
      url.toLowerCase().includes(".webp")
    ) {
      format = "WEBP";
    }

    const dataUrl = `data:${contentType || "image/jpeg"};base64,${buffer.toString("base64")}`;
    return { dataUrl, format, width: 120, height: 120 };
  } catch {
    return null;
  }
}

export function createReportDoc(title: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });
  doc.setProperties({
    title,
    creator: "Proven CMS",
    author: "Proven",
  });
  return doc;
}

export async function drawReportHeader(
  doc: jsPDF,
  options: {
    companyName: string;
    reportTitle: string;
    subtitle?: string | null;
    logoUrl?: string | null;
    generatedAt?: Date;
  },
) {
  const logo = await fetchPdfImage(options.logoUrl);
  let cursorY = PDF.margin;

  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, PDF.margin, cursorY, 48, 48);
    } catch {
      // Unsupported format — fall through to text brand.
    }
  }

  const textX = logo ? PDF.margin + 60 : PDF.margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PDF.primary);
  doc.text(options.companyName, textX, cursorY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...PDF.muted);
  doc.text(options.reportTitle, textX, cursorY + 36);

  if (options.subtitle) {
    doc.setFontSize(9);
    doc.text(options.subtitle, textX, cursorY + 50);
  }

  const stamp = (options.generatedAt ?? new Date()).toLocaleString();
  doc.setFontSize(8);
  doc.setTextColor(...PDF.muted);
  doc.text(stamp, PDF.pageWidth - PDF.margin, cursorY + 18, {
    align: "right",
  });

  cursorY = Math.max(cursorY + 64, options.subtitle ? 100 : 88);
  doc.setDrawColor(...PDF.line);
  doc.setLineWidth(1);
  doc.line(PDF.margin, cursorY, PDF.pageWidth - PDF.margin, cursorY);
  return cursorY + 18;
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  ensureSpace(doc, y, 40);
  const pageY = (doc as jsPDF & { __cursorY?: number }).__cursorY ?? y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PDF.primary);
  doc.text(title, PDF.margin, pageY);
  doc.setDrawColor(...PDF.accent);
  doc.setLineWidth(1.5);
  doc.line(PDF.margin, pageY + 4, PDF.margin + 36, pageY + 4);
  return pageY + 18;
}

export function drawKeyValueGrid(
  doc: jsPDF,
  y: number,
  rows: { label: string; value: string }[],
) {
  let cursor = y;
  doc.setFontSize(9);
  for (const row of rows) {
    ensureSpace(doc, cursor, 16);
    cursor = currentY(doc, cursor);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF.muted);
    doc.text(row.label, PDF.margin, cursor);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF.primary);
    const lines = doc.splitTextToSize(row.value || "—", 360);
    doc.text(lines, PDF.margin + 140, cursor);
    cursor += Math.max(14, lines.length * 12);
  }
  return cursor + 8;
}

export function drawParagraph(doc: jsPDF, y: number, text: string | null | undefined) {
  if (!text?.trim()) return y;
  ensureSpace(doc, y, 40);
  const cursor = currentY(doc, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF.primary);
  const lines = doc.splitTextToSize(text.trim(), PDF.contentWidth);
  doc.text(lines, PDF.margin, cursor);
  return cursor + lines.length * 12 + 8;
}

export async function drawWorkerCard(
  doc: jsPDF,
  y: number,
  worker: {
    name: string;
    photoUrl?: string | null;
    meta: string[];
  },
) {
  ensureSpace(doc, y, 70);
  const cursor = currentY(doc, y);
  const photo = await fetchPdfImage(worker.photoUrl);

  if (photo) {
    try {
      doc.addImage(photo.dataUrl, photo.format, PDF.margin, cursor, 52, 52);
    } catch {
      // ignore
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(PDF.margin, cursor, 52, 52, 4, 4, "F");
    doc.setFontSize(10);
    doc.setTextColor(...PDF.muted);
    doc.text("No photo", PDF.margin + 8, cursor + 30);
  }

  const textX = PDF.margin + 64;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF.primary);
  doc.text(worker.name, textX, cursor + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF.muted);
  worker.meta.filter(Boolean).forEach((line, index) => {
    doc.text(line, textX, cursor + 32 + index * 12);
  });

  return cursor + 68;
}

export async function drawSignatureBlock(
  doc: jsPDF,
  y: number,
  signatures: {
    role: string;
    signerName: string;
    signedAt: string;
    signatureUrl?: string | null;
  }[],
) {
  if (signatures.length === 0) return y;
  let cursor = drawSectionTitle(doc, "Signatures", y);

  for (const signature of signatures) {
    ensureSpace(doc, cursor, 70);
    cursor = currentY(doc, cursor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF.primary);
    doc.text(`${signature.role}: ${signature.signerName}`, PDF.margin, cursor);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF.muted);
    doc.text(signature.signedAt, PDF.margin + 280, cursor);

    const image = await fetchPdfImage(signature.signatureUrl);
    cursor += 8;
    if (image) {
      try {
        doc.addImage(image.dataUrl, image.format, PDF.margin, cursor, 140, 40);
        cursor += 48;
      } catch {
        doc.setDrawColor(...PDF.line);
        doc.line(PDF.margin, cursor + 24, PDF.margin + 160, cursor + 24);
        cursor += 36;
      }
    } else {
      doc.setDrawColor(...PDF.line);
      doc.line(PDF.margin, cursor + 24, PDF.margin + 160, cursor + 24);
      doc.setFontSize(8);
      doc.text("Signed electronically", PDF.margin, cursor + 36);
      cursor += 48;
    }
  }

  return cursor + 4;
}

export async function drawPhotoEvidence(
  doc: jsPDF,
  y: number,
  photos: { url: string; caption?: string | null }[],
  includePhotos: boolean,
) {
  if (!includePhotos || photos.length === 0) return y;
  let cursor = drawSectionTitle(doc, "Photo Evidence", y);
  const usable = photos.slice(0, 6);

  for (let index = 0; index < usable.length; index += 2) {
    ensureSpace(doc, cursor, 130);
    cursor = currentY(doc, cursor);
    const pair = usable.slice(index, index + 2);
    for (let col = 0; col < pair.length; col += 1) {
      const photo = pair[col];
      const image = await fetchPdfImage(photo.url);
      const x = PDF.margin + col * 260;
      if (image) {
        try {
          doc.addImage(image.dataUrl, image.format, x, cursor, 240, 100);
        } catch {
          doc.setFillColor(248, 250, 252);
          doc.rect(x, cursor, 240, 100, "F");
        }
      }
      if (photo.caption) {
        doc.setFontSize(7);
        doc.setTextColor(...PDF.muted);
        doc.text(photo.caption.slice(0, 60), x, cursor + 112);
      }
    }
    cursor += 124;
  }

  return cursor;
}

export function drawSimpleTable(
  doc: jsPDF,
  y: number,
  head: string[],
  body: string[][],
) {
  ensureSpace(doc, y, 60);
  const startY = currentY(doc, y);
  autoTable(doc, {
    startY,
    head: [head],
    body,
    margin: { left: PDF.margin, right: PDF.margin },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: PDF.primary,
      lineColor: PDF.line,
    },
    headStyles: {
      fillColor: PDF.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? startY + 40;
  return finalY + 16;
}

export function drawTrendBars(
  doc: jsPDF,
  y: number,
  points: { label: string; score: number; max?: number }[],
) {
  if (points.length === 0) return y;
  let cursor = drawSectionTitle(doc, "Competency Trends", y);
  const maxScore = Math.max(...points.map((point) => point.max ?? 4), 1);

  for (const point of points.slice(-12)) {
    ensureSpace(doc, cursor, 18);
    cursor = currentY(doc, cursor);
    doc.setFontSize(8);
    doc.setTextColor(...PDF.muted);
    doc.text(point.label, PDF.margin, cursor + 8);
    const barWidth = Math.max(8, (point.score / maxScore) * 280);
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(PDF.margin + 110, cursor, 280, 10, 2, 2, "F");
    doc.setFillColor(...PDF.accent);
    doc.roundedRect(PDF.margin + 110, cursor, barWidth, 10, 2, 2, "F");
    doc.setTextColor(...PDF.primary);
    doc.text(String(point.score), PDF.margin + 400, cursor + 8);
    cursor += 16;
  }

  return cursor + 8;
}

export function finalizeReport(doc: jsPDF, companyName: string) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(...PDF.muted);
    doc.text(
      `${companyName} · Confidential · Page ${page} of ${pageCount}`,
      PDF.pageWidth / 2,
      PDF.pageHeight - 24,
      { align: "center" },
    );
  }
  return Buffer.from(doc.output("arraybuffer"));
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  const cursor = currentY(doc, y);
  if (cursor + needed > PDF.pageHeight - 48) {
    doc.addPage();
    setCurrentY(doc, PDF.margin);
  }
}

function currentY(doc: jsPDF, fallback: number) {
  const typed = doc as jsPDF & { __cursorY?: number };
  return typed.__cursorY ?? fallback;
}

function setCurrentY(doc: jsPDF, y: number) {
  (doc as jsPDF & { __cursorY?: number }).__cursorY = y;
}

export function syncCursor(doc: jsPDF, y: number) {
  setCurrentY(doc, y);
  return y;
}
