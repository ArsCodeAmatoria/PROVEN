import fs from "fs";
import path from "path";

import JSZip from "jszip";

import excelMap from "@/lib/cor/bccsa-excel-map.json";

export type BccsaExportHeader = {
  legalName?: string | null;
  tradeName?: string | null;
  mailingStreet?: string | null;
  cityProvince?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  primaryContact?: string | null;
  primaryEmail?: string | null;
  secondaryContact?: string | null;
  secondaryEmail?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  auditStart?: Date | null;
  auditEnd?: Date | null;
  programSize?: "LARGE" | "SMALL" | null;
  auditKind?: "CERTIFICATION" | "MAINTENANCE" | "RECERTIFICATION" | null;
};

export type BccsaExportAnswer = {
  questionKey: string;
  /** Y | N | N/A */
  technique?: string | null;
  comments?: string | null;
};

export type BccsaExportInput = {
  header: BccsaExportHeader;
  answers: BccsaExportAnswer[];
  /** Element code → summary comment cell */
  elementComments?: Record<string, string | null | undefined>;
  filenameBase: string;
};

const TEMPLATE_REL = excelMap.templateFile;

function resolveTemplatePath() {
  const candidates = [
    path.join(process.cwd(), TEMPLATE_REL),
    path.join(process.cwd(), "..", TEMPLATE_REL),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`BCCSA template not found at ${TEMPLATE_REL}`);
}

/**
 * Split a Canadian mailing line into street / city+province / postal.
 * Example: "#503 – 4211 Kingsway, Burnaby, BC V5H 1Z6"
 */
export function parseCanadianMailingAddress(raw: string | null | undefined): {
  street: string | null;
  cityProvince: string | null;
  postalCode: string | null;
} {
  if (!raw?.trim()) {
    return { street: null, cityProvince: null, postalCode: null };
  }
  const text = raw.replace(/\s+/g, " ").trim();
  const postalMatch = text.match(/\b([A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)\b/);
  const postalCode = postalMatch
    ? postalMatch[1]!
        .toUpperCase()
        .replace(/([A-Z]\d[A-Z])\s*(\d[A-Z]\d)/, "$1 $2")
    : null;
  const before = postalMatch
    ? text.slice(0, postalMatch.index).replace(/[,\s]+$/, "")
    : text;
  const cityProvMatch = before.match(
    /^(.*?),\s*([^,]+?)(?:,\s*|\s+)([A-Za-z]{2})$/,
  );
  if (cityProvMatch) {
    return {
      street: cityProvMatch[1]!.trim(),
      cityProvince: `${cityProvMatch[2]!.trim()}, ${cityProvMatch[3]!.toUpperCase()}`,
      postalCode,
    };
  }
  return { street: before || text, cityProvince: null, postalCode };
}

/**
 * Map Proven response status → BCCSA technique mark.
 */
export function statusToTechniqueMark(
  status: string,
  score: number | null | undefined,
): string | null {
  switch (status) {
    case "ADEQUATE":
      return "Y";
    case "FAIL":
    case "NEEDS_IMPROVEMENT":
      return "N";
    case "NOT_APPLICABLE":
      return "N/A";
    case "IN_PROGRESS":
    case "NOT_STARTED":
      if (score != null && score > 0) return "Y";
      return null;
    default:
      return null;
  }
}

function ymdParts(date: Date) {
  return {
    y: String(date.getFullYear()),
    m: String(date.getMonth() + 1).padStart(2, "0"),
    d: String(date.getDate()).padStart(2, "0"),
  };
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colLettersToNumber(col: string) {
  let n = 0;
  for (const ch of col.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n;
}

function parseAddress(addr: string): { col: string; row: number } {
  const match = addr.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) throw new Error(`Invalid cell address ${addr}`);
  return { col: match[1]!.toUpperCase(), row: Number(match[2]) };
}

function colNum(col: string) {
  return colLettersToNumber(col);
}

/** Top-left cell of a merge range containing `addr`, or `addr` if unmerged. */
function mergeMasterAddress(sheetXml: string, addr: string): string {
  const { col, row } = parseAddress(addr);
  const targetCol = colNum(col);
  for (const m of sheetXml.matchAll(/<mergeCell ref="([^"]+)"/g)) {
    const ref = m[1]!;
    const [start, end] = ref.split(":");
    if (!start || !end) continue;
    const a = parseAddress(start);
    const b = parseAddress(end);
    if (
      row >= a.row &&
      row <= b.row &&
      targetCol >= colNum(a.col) &&
      targetCol <= colNum(b.col)
    ) {
      return `${a.col}${a.row}`;
    }
  }
  return addr;
}

async function buildSheetPathIndex(zip: JSZip) {
  const workbookXml = await zip.file("xl/workbook.xml")!.async("string");
  const relsXml = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");

  const ridToTarget = new Map<string, string>();
  for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/g)) {
    const tag = m[0];
    const id = tag.match(/\bId="([^"]+)"/)?.[1];
    const target = tag.match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target?.includes("worksheets/")) {
      ridToTarget.set(id, target.replace(/^\.\//, ""));
    }
  }

  const nameToPath = new Map<string, string>();
  for (const m of workbookXml.matchAll(/<sheet\b[^/]*\/>/g)) {
    const tag = m[0];
    const rawName = tag.match(/\bname="([^"]+)"/)?.[1];
    const rid = tag.match(/\br:id="([^"]+)"/)?.[1];
    if (!rawName || !rid) continue;
    const name = rawName
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');
    const target = ridToTarget.get(rid);
    if (!target) continue;
    nameToPath.set(name, `xl/${target}`);
  }
  return nameToPath;
}

function buildInlineCellXml(addr: string, style: string | null, value: string) {
  const styleAttr = style ? ` s="${style}"` : "";
  // Preserve whitespace for multi-line comments.
  const space =
    value !== value.trim() || /\n|\t/.test(value) ? ' xml:space="preserve"' : "";
  return `<c r="${addr}"${styleAttr} t="inlineStr"><is><t${space}>${escapeXml(value)}</t></is></c>`;
}

function setSheetCellValue(sheetXml: string, addr: string, value: string) {
  const { col, row } = parseAddress(addr);
  const cellRe = new RegExp(`<c r="${addr}"[^>]*/>|<c r="${addr}"[^>]*>[\\s\\S]*?</c>`);
  const existing = sheetXml.match(cellRe)?.[0] ?? null;
  const style = existing?.match(/\bs="(\d+)"/)?.[1] ?? null;
  const replacement = buildInlineCellXml(addr, style, value);

  if (existing) {
    return sheetXml.replace(cellRe, replacement);
  }

  // Insert into the matching row, or create a row.
  const rowRe = new RegExp(`<row r="${row}"[^>]*>[\\s\\S]*?</row>`);
  const rowMatch = sheetXml.match(rowRe);
  if (rowMatch) {
    const rowXml = rowMatch[0];
    const cells = [...rowXml.matchAll(/<c r="([A-Z]+)(\d+)"[^>]*\/>|<c r="([A-Z]+)(\d+)"[^>]*>[\s\S]*?<\/c>/g)];
    let insertAt = rowXml.lastIndexOf("</row>");
    for (const cell of cells) {
      const cellCol = (cell[1] || cell[3])!;
      if (colLettersToNumber(cellCol) > colLettersToNumber(col)) {
        insertAt = cell.index!;
        break;
      }
    }
    const openEnd = rowXml.indexOf(">") + 1;
    const at = Math.max(insertAt, openEnd);
    const nextRowXml =
      rowXml.slice(0, at) + replacement + rowXml.slice(at);
    return sheetXml.replace(rowXml, nextRowXml);
  }

  const newRow = `<row r="${row}">${replacement}</row>`;
  const sheetDataClose = sheetXml.indexOf("</sheetData>");
  if (sheetDataClose < 0) {
    throw new Error(`sheetData missing while inserting ${addr}`);
  }
  return (
    sheetXml.slice(0, sheetDataClose) + newRow + sheetXml.slice(sheetDataClose)
  );
}

function collectWrites(input: BccsaExportInput) {
  const writes: { sheet: string; addr: string; value: string }[] = [];
  const h = excelMap.headerCells;
  const header = input.header;

  const put = (sheet: string, addr: string, value: string | null | undefined) => {
    if (value == null || value === "") return;
    writes.push({ sheet, addr, value });
  };

  put(h.sheet, h.legalName, header.legalName);
  put(h.sheet, h.tradeName, header.tradeName);
  put(h.sheet, h.mailingStreet, header.mailingStreet);
  put(h.sheet, h.cityProvince, header.cityProvince);
  put(h.sheet, h.postalCode, header.postalCode);
  put(h.sheet, h.phone, header.phone);
  put(h.sheet, h.primaryContact, header.primaryContact);
  put(h.sheet, h.primaryEmail, header.primaryEmail);
  put(h.sheet, h.secondaryContact, header.secondaryContact);
  put(h.sheet, h.secondaryEmail, header.secondaryEmail);
  put(h.sheet, h.ownerName, header.ownerName);
  put(h.sheet, h.ownerEmail, header.ownerEmail);

  if (header.auditStart) {
    const p = ymdParts(header.auditStart);
    // B3:D3 (and G3:I3) are merged — write one visible date into the master cell.
    put(h.sheet, h.auditStartYear, `${p.y}-${p.m}-${p.d}`);
  }
  if (header.auditEnd) {
    const p = ymdParts(header.auditEnd);
    put(h.sheet, h.auditEndYear, `${p.y}-${p.m}-${p.d}`);
  }

  if (header.programSize === "LARGE") put(h.sheet, h.largeCorMark, "X");
  if (header.programSize === "SMALL") put(h.sheet, h.smallCorMark, "X");
  if (header.auditKind === "CERTIFICATION") put(h.sheet, h.certAuditMark, "X");
  if (header.auditKind === "MAINTENANCE") {
    put(h.sheet, h.maintenanceAuditMark, "X");
  }
  if (header.auditKind === "RECERTIFICATION") {
    put(h.sheet, h.recertAuditMark, "X");
  }

  const byKey = new Map(excelMap.questions.map((q) => [q.questionKey, q]));
  for (const answer of input.answers) {
    const map = byKey.get(answer.questionKey);
    if (!map) continue;
    const mark = answer.technique?.trim().toUpperCase() || null;
    if (mark === "Y" || mark === "N" || mark === "N/A") {
      const v = mark === "N/A" ? "N/A" : mark;
      if (map.cells.documentation) {
        put(map.sheet, map.cells.documentation, v);
      }
      if (map.cells.observation) put(map.sheet, map.cells.observation, v);
      if (map.cells.interview) put(map.sheet, map.cells.interview, v);
    }
    if (answer.comments?.trim() && map.cells.comments) {
      put(map.sheet, map.cells.comments, answer.comments.trim());
    }
  }

  const elementCommentMap = excelMap.elementComments as Record<
    string,
    { sheet: string; cell: string }
  >;
  for (const [code, text] of Object.entries(input.elementComments ?? {})) {
    const mapped = elementCommentMap[code];
    if (!mapped || !text?.trim()) continue;
    put(mapped.sheet.trim(), mapped.cell, text.trim());
  }

  return writes;
}

/**
 * Copy the official .xlsm and patch mapped cells in worksheet XML.
 * Preserves `vbaProject.bin`, styles, and formulas.
 */
export async function buildBccsaCorWorkbook(
  input: BccsaExportInput,
): Promise<{ buffer: Buffer; filename: string }> {
  const templatePath = resolveTemplatePath();
  const templateBytes = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(templateBytes);
  const sheetPaths = await buildSheetPathIndex(zip);
  const resolveSheetPath = (sheet: string) => {
    if (sheetPaths.has(sheet)) return sheetPaths.get(sheet)!;
    const trimmed = sheet.trim();
    for (const [name, filePath] of sheetPaths) {
      if (name.trim() === trimmed) return filePath;
    }
    return null;
  };
  const writes = collectWrites(input);

  const sheetsTouched = new Map<string, string>();
  for (const write of writes) {
    const filePath = resolveSheetPath(write.sheet);
    if (!filePath) {
      throw new Error(`Unknown sheet in template: ${JSON.stringify(write.sheet)}`);
    }
    if (!sheetsTouched.has(filePath)) {
      const file = zip.file(filePath);
      if (!file) throw new Error(`Missing ${filePath}`);
      sheetsTouched.set(filePath, await file.async("string"));
    }
  }

  for (const write of writes) {
    const filePath = resolveSheetPath(write.sheet)!;
    const xml = sheetsTouched.get(filePath)!;
    const master = mergeMasterAddress(xml, write.addr);
    sheetsTouched.set(filePath, setSheetCellValue(xml, master, write.value));
  }

  for (const [filePath, xml] of sheetsTouched) {
    zip.file(filePath, xml);
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const safeBase = input.filenameBase
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const filename = `${safeBase || "company"}-BCCSA-COR-${stamp}.xlsm`;

  return { buffer: Buffer.from(buffer), filename };
}

export const BCCSA_EXCEL_MAP_META = {
  templateHash: excelMap.templateHash,
  programVersion: excelMap.programVersion,
  questionCount: excelMap.questions.length,
};
