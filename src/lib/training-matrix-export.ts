import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  TRAINING_MATRIX_STATUS_HEX,
  TRAINING_MATRIX_STATUS_LABELS,
} from "@/features/training-matrix/constants";
import type { TrainingMatrixData } from "@/services/training-matrix.service";

function cellMap(data: TrainingMatrixData) {
  const map = new Map<string, (typeof data.cells)[number]>();
  for (const cell of data.cells) {
    map.set(`${cell.employeeId}:${cell.competencyId}`, cell);
  }
  return map;
}

export async function buildTrainingMatrixExcel(data: TrainingMatrixData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Proven";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Training Matrix", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
  });

  const headers = [
    "Worker",
    ...data.competencies.map((item) => `${item.code} ${item.title}`),
  ];
  sheet.addRow(headers);

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { wrapText: true, vertical: "middle" };

  const cells = cellMap(data);

  for (const worker of data.workers) {
    const rowValues = [
      worker.name,
      ...data.competencies.map((competency) => {
        const cell = cells.get(`${worker.id}:${competency.id}`);
        return cell
          ? TRAINING_MATRIX_STATUS_LABELS[cell.status]
          : TRAINING_MATRIX_STATUS_LABELS.NOT_STARTED;
      }),
    ];
    const row = sheet.addRow(rowValues);

    data.competencies.forEach((competency, index) => {
      const cell = cells.get(`${worker.id}:${competency.id}`);
      const status = cell?.status ?? "NOT_STARTED";
      const excelCell = row.getCell(index + 2);
      excelCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${TRAINING_MATRIX_STATUS_HEX[status]}` },
      };
      excelCell.alignment = { horizontal: "center", vertical: "middle" };
    });
  }

  sheet.getColumn(1).width = 28;
  for (let index = 2; index <= headers.length; index += 1) {
    sheet.getColumn(index).width = 18;
  }

  const legend = workbook.addWorksheet("Legend");
  legend.addRow(["Status", "Meaning"]);
  for (const [status, label] of Object.entries(TRAINING_MATRIX_STATUS_LABELS)) {
    const row = legend.addRow([label, status]);
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: `FF${TRAINING_MATRIX_STATUS_HEX[status as keyof typeof TRAINING_MATRIX_STATUS_HEX]}`,
      },
    };
  }
  legend.getColumn(1).width = 22;
  legend.getColumn(2).width = 24;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildTrainingMatrixPdf(data: TrainingMatrixData) {
  const doc = new jsPDF({
    orientation: data.competencies.length > 6 ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(14);
  doc.text(`Training Matrix — ${data.companyName}`, 40, 36);
  doc.setFontSize(9);
  doc.text(
    `Workers ${data.workers.length} · Competencies ${data.competencies.length}`,
    40,
    52,
  );

  const cells = cellMap(data);
  const head = [
    [
      "Worker",
      ...data.competencies.map((item) => item.code),
    ],
  ];
  const body = data.workers.map((worker) => [
    worker.name,
    ...data.competencies.map((competency) => {
      const cell = cells.get(`${worker.id}:${competency.id}`);
      return cell
        ? TRAINING_MATRIX_STATUS_LABELS[cell.status]
        : TRAINING_MATRIX_STATUS_LABELS.NOT_STARTED;
    }),
  ]);

  autoTable(doc, {
    startY: 64,
    head,
    body,
    styles: {
      fontSize: 7,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
    },
    didParseCell: (hook) => {
      if (hook.section !== "body" || hook.column.index === 0) return;
      const worker = data.workers[hook.row.index];
      const competency = data.competencies[hook.column.index - 1];
      if (!worker || !competency) return;
      const cell = cells.get(`${worker.id}:${competency.id}`);
      const status = cell?.status ?? "NOT_STARTED";
      const hex = TRAINING_MATRIX_STATUS_HEX[status];
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      hook.cell.styles.fillColor = [r, g, b];
      hook.cell.styles.textColor = [15, 23, 42];
    },
  });

  return Buffer.from(doc.output("arraybuffer"));
}
