/**
 * Generate a filled BCCSA COR .xlsm from the Internal COR audit session.
 *
 * Usage:
 *   npx tsx scripts/export-bccsa-excel.ts
 *   SESSION_ID=... OUT=./exports/filled.xlsm npx tsx scripts/export-bccsa-excel.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import {
  buildBccsaCorWorkbook,
  parseCanadianMailingAddress,
  statusToTechniqueMark,
} from "../src/lib/cor/bccsa-excel-export";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../src/generated/prisma/client");

const COMPANY_SLUG = "ridgetechone";
const DEFAULT_SESSION = "d3dea68a-8e46-41f0-8304-3a32bed3ac76";
const FALLBACK_ADDRESS = "#503 – 4211 Kingsway, Burnaby, BC V5H 1Z6";
const FALLBACK_PHONE = "(604) 335-9216";

async function main() {
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");

  const sessionId = process.env.SESSION_ID || DEFAULT_SESSION;
  const outPath =
    process.env.OUT ||
    path.join(
      process.cwd(),
      "exports",
      `Ridgetechone-BCCSA-COR-${new Date().toISOString().slice(0, 10)}.xlsm`,
    );

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    ssl: databaseUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const company = await prisma.company.findFirst({
    where: { slug: COMPANY_SLUG, deletedAt: null },
  });
  if (!company) throw new Error("Company not found");

  const session = await prisma.corAuditSession.findFirst({
    where: { id: sessionId, companyId: company.id, deletedAt: null },
    include: {
      leadEmployee: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      program: true,
    },
  });
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const staff = await prisma.employee.findMany({
    where: { companyId: company.id, deletedAt: null },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  const owner =
    staff.find((e: { user: { email: string } }) => /chris@/i.test(e.user.email)) ??
    null;
  const secondary =
    staff.find((e: { user: { email: string } }) =>
      /britt@|leigh@|safety@/i.test(e.user.email),
    ) ?? null;

  const mailingRaw = company.address?.trim() || FALLBACK_ADDRESS;
  const parsed = parseCanadianMailingAddress(mailingRaw);

  const elements = await prisma.corElement.findMany({
    where: { programId: session.programId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      questions: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
    },
  });

  const responses = await prisma.corQuestionResponse.findMany({
    where: { sessionId, deletedAt: null },
  });
  const responseByQ = new Map<
    string,
    { status: string; score: number | null; comments: string | null }
  >(
    responses.map(
      (r: { questionId: string; status: string; score: number | null; comments: string | null }) => [
        r.questionId,
        r,
      ],
    ),
  );

  const links = await prisma.corEvidenceLink.findMany({
    where: { sessionId, deletedAt: null },
  });
  const docIds = links
    .filter((l: { sourceType: string }) => l.sourceType === "DOCUMENT")
    .map((l: { sourceId: string }) => l.sourceId);
  const docs = docIds.length
    ? await prisma.document.findMany({
        where: { id: { in: docIds }, deletedAt: null },
        select: { id: true, title: true },
      })
    : [];
  const docById = new Map<string, { id: string; title: string }>(
    docs.map((d: { id: string; title: string }) => [d.id, d]),
  );

  const evidenceByQ = new Map<string, string[]>();
  for (const link of links) {
    const title =
      link.sourceType === "DOCUMENT"
        ? docById.get(link.sourceId)?.title
        : link.notes;
    if (!title) continue;
    const list = evidenceByQ.get(link.questionId) ?? [];
    list.push(title);
    evidenceByQ.set(link.questionId, list);
  }

  const answers = [];
  const elementComments: Record<string, string> = {};

  for (const el of elements) {
    for (const q of el.questions) {
      const response = responseByQ.get(q.id);
      const status = response?.status ?? "NOT_STARTED";
      const technique = statusToTechniqueMark(status, response?.score ?? null);
      const evidenceTitles = (evidenceByQ.get(q.id) ?? []).slice(0, 10);
      const evidenceNote =
        evidenceTitles.length > 0
          ? `Evidence on file: ${evidenceTitles.join("; ")}.`
          : null;
      const comments = [response?.comments?.trim(), evidenceNote]
        .filter(Boolean)
        .join("\n");
      if (technique || comments) {
        answers.push({
          questionKey: q.number,
          technique,
          comments: comments || null,
        });
      }
      if (!elementComments[el.code] && (technique || comments)) {
        elementComments[el.code] =
          `Element ${el.code} (${el.title}): internal review of company Safety Program documentation. Documentation reviewed and scored against BCCSA criteria — confirm interview/observation items before final submission.`;
      }
    }
  }

  const built = await buildBccsaCorWorkbook({
    header: {
      legalName: company.name,
      tradeName: "Ridgetechone",
      mailingStreet: parsed.street ?? mailingRaw,
      cityProvince: parsed.cityProvince,
      postalCode: parsed.postalCode,
      phone: company.phone?.trim() || FALLBACK_PHONE,
      auditStart: session.startedAt ?? session.scheduledAt ?? session.createdAt,
      auditEnd:
        session.completedAt ??
        session.startedAt ??
        session.scheduledAt ??
        session.createdAt,
      programSize: "LARGE",
      auditKind: "MAINTENANCE",
      primaryContact: session.leadEmployee
        ? `${session.leadEmployee.user.firstName} ${session.leadEmployee.user.lastName}`
        : owner
          ? `${owner.user.firstName} ${owner.user.lastName}`
          : null,
      primaryEmail:
        session.leadEmployee?.user.email ?? owner?.user.email ?? null,
      secondaryContact: secondary
        ? `${secondary.user.firstName} ${secondary.user.lastName}`
        : null,
      secondaryEmail: secondary?.user.email ?? null,
      ownerName: owner
        ? `${owner.user.firstName} ${owner.user.lastName}`
        : null,
      ownerEmail: owner?.user.email ?? null,
    },
    answers,
    elementComments,
    filenameBase: company.name,
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, built.buffer);

  console.log(
    JSON.stringify(
      {
        sessionId,
        answers: answers.length,
        elementComments: Object.keys(elementComments).length,
        outPath,
        filename: built.filename,
        bytes: built.buffer.length,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
