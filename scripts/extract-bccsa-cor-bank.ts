/**
 * Extract BCCSA COR question bank + Excel cell map from the official workbook.
 *
 * Usage: npx tsx scripts/extract-bccsa-cor-bank.ts
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";

import ExcelJS from "exceljs";

const ROOT = path.resolve(__dirname, "..");
const TEMPLATE = path.join(ROOT, "templates/bccsa-cor/official-workbook.xlsm");
const OUT_BANK = path.join(ROOT, "src/lib/cor/bccsa-question-bank.json");
const OUT_MAP = path.join(ROOT, "src/lib/cor/bccsa-excel-map.json");

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  if (typeof v === "object") {
    if ("formula" in v || "sharedFormula" in v) return "";
    if ("richText" in v && Array.isArray(v.richText)) {
      return v.richText.map((t) => t.text).join("");
    }
    if ("text" in v && v.text != null) return String(v.text);
    if ("result" in v && v.result != null) return String(v.result);
  }
  return String(v);
}

function isFormula(cell: ExcelJS.Cell) {
  const v = cell.value;
  return !!(
    v &&
    typeof v === "object" &&
    ("formula" in v || "sharedFormula" in v)
  );
}

function isWritableInput(cell: ExcelJS.Cell) {
  if (isFormula(cell)) return false;
  const t = cellText(cell.value).trim();
  return t === "" || /^(Y|N|N\/A|YES|NO)$/i.test(t);
}

function normalizeQuestionNumber(
  raw: ExcelJS.CellValue,
  elementCode: string,
  previous: string | null,
): string {
  const major = elementCode;
  if (typeof raw === "number") {
    if (previous) {
      const prevMinor = parseInt(previous.split(".")[1] || "0", 10);
      if (raw === parseFloat(`${major}.1`) && prevMinor >= 9) {
        return `${major}.10`;
      }
      const expected = `${major}.${prevMinor + 1}`;
      if (
        Math.abs(raw - parseFloat(expected)) < 1e-9 &&
        expected.endsWith("0")
      ) {
        return expected;
      }
    }
    const s = String(raw);
    const parts = s.split(".");
    if (parts.length === 1) return `${major}.${parts[0]}`;
    return `${major}.${parts[1]}`;
  }
  return String(raw ?? "").trim();
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TEMPLATE);
  const sheetNames = wb.worksheets.map((s) => s.name);

  const elements: {
    code: string;
    title: string;
    description: string | null;
    sheet: string;
    sortOrder: number;
    elementCommentsCell: string | null;
    questions: {
      number: string;
      description: string;
      weight: number;
      requiresDocumentation: boolean;
      requiresObservation: boolean;
      requiresInterview: boolean;
      sortOrder: number;
    }[];
  }[] = [];

  const questionMaps: {
    questionKey: string;
    sheet: string;
    row: number;
    cells: {
      documentation?: string;
      observation?: string;
      interview?: string;
      comments?: string;
    };
  }[] = [];

  for (let el = 1; el <= 14; el++) {
    const code = String(el);
    const sheetName = sheetNames.find((n) => n.trim() === `E${el}`);
    if (!sheetName) throw new Error(`Missing sheet E${el}`);
    const sheet = wb.getWorksheet(sheetName)!;
    const titleFromSheet = cellText(sheet.getCell(2, 1).value);
    const titleMatch = titleFromSheet.match(/ELEMENT\s+\d+:\s*(.+)/i);
    const title = (titleMatch?.[1] || `Element ${code}`).trim();

    const questions: (typeof elements)[0]["questions"] = [];
    let previousNumber: string | null = null;
    let elementCommentsRow: number | null = null;

    for (let r = 1; r <= (sheet.rowCount || 100); r++) {
      const aVal = sheet.getCell(r, 1).value;
      const aText = cellText(aVal).trim();
      if (
        /^Comments \(use this area/i.test(aText) ||
        /^Comments \(use this area/i.test(
          cellText(sheet.getCell(r, 2).value),
        )
      ) {
        elementCommentsRow = r;
      }

      const looksLikeQ =
        (typeof aVal === "number" && aVal > 0 && aVal < 100) ||
        (typeof aVal === "string" && /^\d+\.\d+$/.test(aVal.trim()));
      if (!looksLikeQ) continue;

      const b = cellText(sheet.getCell(r, 2).value).replace(/\s+/g, " ").trim();
      const dCell = sheet.getCell(r, 4);
      const dText = cellText(dCell.value).trim();
      const dIsScore =
        typeof dCell.value === "number" ||
        isFormula(dCell) ||
        /^\d+(\.\d+)?$/.test(dText);
      if (!b || b.startsWith("Guideline:") || !dIsScore) continue;

      const number = normalizeQuestionNumber(aVal, code, previousNumber);
      previousNumber = number;

      const eCell = sheet.getCell(r, 5);
      const fCell = sheet.getCell(r, 6);
      const gCell = sheet.getCell(r, 7);
      const docWritable = isWritableInput(eCell);
      const obsWritable = isWritableInput(fCell);
      const intWritable = isWritableInput(gCell);

      let commentsAddr: string | null = null;
      for (
        let rr = r + 1;
        rr <= Math.min(r + 6, sheet.rowCount || r + 6);
        rr++
      ) {
        const bt = cellText(sheet.getCell(rr, 2).value)
          .replace(/\s+/g, " ")
          .trim();
        const at = cellText(sheet.getCell(rr, 1).value).trim();
        if (!bt) continue;
        if (bt.startsWith("Guideline:")) continue;
        if (/^[DOI]\s*-/.test(at) || /^[DOI]\s*-/.test(bt)) continue;
        if (/^\d+\.\d+/.test(at)) break;
        commentsAddr = `B${rr}`;
        break;
      }

      const weightRaw =
        typeof dCell.value === "number" ? dCell.value : parseFloat(dText) || 1;

      questions.push({
        number,
        description: b,
        weight: weightRaw,
        requiresDocumentation: docWritable,
        requiresObservation: obsWritable,
        requiresInterview: intWritable,
        sortOrder: questions.length + 1,
      });

      questionMaps.push({
        questionKey: number,
        sheet: sheetName,
        row: r,
        cells: {
          ...(docWritable ? { documentation: `E${r}` } : {}),
          ...(obsWritable ? { observation: `F${r}` } : {}),
          ...(intWritable ? { interview: `G${r}` } : {}),
          ...(commentsAddr ? { comments: commentsAddr } : {}),
        },
      });
    }

    elements.push({
      code,
      title,
      description: titleFromSheet || null,
      sheet: sheetName,
      sortOrder: el,
      elementCommentsCell: elementCommentsRow
        ? `A${elementCommentsRow + 1}`
        : null,
      questions,
    });
  }

  const buf = fs.readFileSync(TEMPLATE);
  const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);

  const bank = {
    programCode: "BCCSA-COR",
    programTitle: "BCCSA COR OHS Audit",
    programVersion: "V2-R13-2026Jan01",
    templateFile: "templates/bccsa-cor/official-workbook.xlsm",
    templateHash: hash,
    sourceFile: "BCCSACOROHSAuditV2-01Jan2026R13_2026Jan01.xlsm",
    elements,
  };

  const map = {
    templateFile: "templates/bccsa-cor/official-workbook.xlsm",
    templateHash: hash,
    programVersion: bank.programVersion,
    headerCells: {
      sheet: "Audit Information",
      legalName: "B12",
      tradeName: "G12",
      mailingStreet: "B15",
      cityProvince: "E15",
      postalCode: "G15",
      phone: "I15",
      primaryContact: "B17",
      primaryEmail: "G17",
      secondaryContact: "B19",
      secondaryEmail: "G19",
      ownerName: "B21",
      ownerEmail: "G21",
      auditStartYear: "B3",
      auditStartMonth: "C3",
      auditStartDay: "D3",
      auditEndYear: "G3",
      auditEndMonth: "H3",
      auditEndDay: "I3",
      largeCorMark: "B6",
      smallCorMark: "E6",
      certAuditMark: "B8",
      maintenanceAuditMark: "E8",
      recertAuditMark: "H8",
    },
    elementComments: Object.fromEntries(
      elements
        .filter((e) => e.elementCommentsCell)
        .map((e) => [e.code, { sheet: e.sheet, cell: e.elementCommentsCell }]),
    ),
    questions: questionMaps,
  };

  fs.mkdirSync(path.dirname(OUT_BANK), { recursive: true });
  fs.writeFileSync(OUT_BANK, JSON.stringify(bank, null, 2));
  fs.writeFileSync(OUT_MAP, JSON.stringify(map, null, 2));

  console.log(`Elements: ${elements.length}`);
  console.log(`Questions: ${questionMaps.length}`);
  for (const e of elements) {
    console.log(
      `  E${e.code}: ${e.questions.length} qs — ${e.questions.map((q) => q.number).join(", ")}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
