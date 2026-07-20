/**
 * Fill the newest empty "Internal COR audit 2026-07-19" for RidgeTech:
 * - ADEQUATE on all BCCSA questions with narrative notes
 * - Link existing company Files (Safety Program docs) as evidence
 * - Soft-delete other empty duplicate drafts with the same title
 *
 * Usage:
 *   npx tsx scripts/fill-internal-cor-audit-from-files.ts
 */
import "dotenv/config";
import path from "path";
import { createRequire } from "module";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../src/generated/prisma/client");

const COMPANY_SLUG = "ridgetechone";
const PROGRAM_CODE = "BCCSA-COR";
const SESSION_TITLE = "Internal COR audit 2026-07-19";
const DESC_PREFIX = "RTO Safety Program 2025: ";

/** Primary OH&S chapter → BCCSA COR element code */
const ELEMENT_CHAPTERS: { element: string; rel: string; label: string }[] = [
  {
    element: "1",
    rel: "01 OH&S/1.1 INTRODUCTION/1.1.02 OH&S Policy.pdf",
    label: "OH&S Policy",
  },
  {
    element: "1",
    rel: "01 OH&S/1.1 INTRODUCTION/1.1.01 Program Review.pdf",
    label: "Program Review",
  },
  {
    element: "1",
    rel: "01 OH&S/1.1 INTRODUCTION/1.1.03 OH&S Policy - Subcontractor.pdf",
    label: "OH&S Policy — Subcontractor",
  },
  {
    element: "2",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.01 Workpace Hazard Assessment Control.pdf",
    label: "Workplace Hazard Assessment & Control",
  },
  {
    element: "3",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.02 Safe Work Practices (SWP).pdf",
    label: "Safe Work Practices (overview)",
  },
  {
    element: "4",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.03 Safe Job Procedures (SJP).pdf",
    label: "Safe Job Procedures (overview)",
  },
  {
    element: "5",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.04 Company Safety Rules.pdf",
    label: "Company Safety Rules",
  },
  {
    element: "6",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.05 Personal Protective Equipment (PPE).pdf",
    label: "Personal Protective Equipment",
  },
  {
    element: "7",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.06 Preventative Maintenance.pdf",
    label: "Preventative Maintenance",
  },
  {
    element: "8",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.07 Training and Communication.pdf",
    label: "Training and Communication",
  },
  {
    element: "9",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.08 Inspections.pdf",
    label: "Inspections",
  },
  {
    element: "10",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.09 Reporting and Investigation.pdf",
    label: "Reporting and Investigation",
  },
  {
    element: "11",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.10 Emergency Preparedness and Response.pdf",
    label: "Emergency Preparedness and Response",
  },
  {
    element: "12",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.11 Records and Statistics.pdf",
    label: "Records and Statistics",
  },
  {
    element: "13",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.12 Legislation.pdf",
    label: "Legislation",
  },
  {
    element: "14",
    rel: "01 OH&S/1.3 GENERAL TOPICS/1.3.13 Joint Occupational Health and Safety Committee (JOHS).pdf",
    label: "JOHS Committee",
  },
];

const FOLDER_ELEMENT: { prefix: string; element: string }[] = [
  { prefix: "03 SWP/", element: "3" },
  { prefix: "04 SJP/", element: "4" },
  { prefix: "02 FORMS AND DOCS/2.1 FORMS GENERAL/", element: "9" },
  { prefix: "02 FORMS AND DOCS/2.2 FORMS TC/", element: "7" },
  { prefix: "02 FORMS AND DOCS/2.3 FORMS RIGGING/", element: "8" },
  { prefix: "01 OH&S/1.2 COMPANY POLICIES/", element: "1" },
  { prefix: "01 OH&S/1.4 PROGRAMS/", element: "6" },
  { prefix: "05 SAFETY DATA SHEET (SDS)/", element: "13" },
  { prefix: "06 SIGNS AND POSTERS/", element: "1" },
];

async function main() {
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL / DIRECT_URL required");

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
  if (!company) throw new Error("RidgeTech company (ridgetechone) not found");

  const program = await prisma.corProgram.findFirst({
    where: { companyId: null, code: PROGRAM_CODE, deletedAt: null },
    include: {
      elements: {
        where: { deletedAt: null },
        include: {
          questions: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!program) throw new Error("BCCSA-COR program not seeded");

  const questionsByElement = new Map<
    string,
    { id: string; number: string; requiresDocumentation: boolean }[]
  >();
  for (const el of program.elements) {
    questionsByElement.set(
      el.code,
      el.questions.map(
        (q: {
          id: string;
          number: string;
          requiresDocumentation: boolean;
        }) => ({
          id: q.id,
          number: q.number,
          requiresDocumentation: q.requiresDocumentation,
        }),
      ),
    );
  }

  const drafts = await prisma.corAuditSession.findMany({
    where: {
      companyId: company.id,
      title: SESSION_TITLE,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          responses: { where: { deletedAt: null } },
          evidenceLinks: { where: { deletedAt: null } },
        },
      },
    },
  });

  let session = drafts.find(
    (s: { _count: { responses: number; evidenceLinks: number } }) =>
      s._count.responses === 0 && s._count.evidenceLinks === 0,
  );
  if (!session) {
    session = drafts[0];
  }
  if (!session) {
    throw new Error(`No session titled "${SESSION_TITLE}" found`);
  }

  let softDeletedDuplicates = 0;
  for (const draft of drafts) {
    if (draft.id === session.id) continue;
    if (draft._count.responses > 0 || draft._count.evidenceLinks > 0) continue;
    await prisma.corAuditSession.update({
      where: { id: draft.id },
      data: { deletedAt: new Date() },
    });
    softDeletedDuplicates += 1;
  }

  const docs = await prisma.document.findMany({
    where: {
      companyId: company.id,
      entityType: "COMPANY",
      deletedAt: null,
      description: { startsWith: DESC_PREFIX },
    },
    select: { id: true, title: true, description: true },
  });

  const documentByRel = new Map<string, { id: string; title: string }>();
  for (const doc of docs) {
    const rel = (doc.description || "").slice(DESC_PREFIX.length).trim();
    if (rel) documentByRel.set(rel.replace(/\\/g, "/"), doc);
  }

  const chapterByRel = new Map(
    ELEMENT_CHAPTERS.map((c) => [c.rel.replace(/\\/g, "/"), c]),
  );

  let linked = 0;
  let answered = 0;

  async function linkDocToQuestions(
    docId: string,
    elementCode: string,
    notes: string,
    mode: "all" | "anchor",
  ) {
    const qs = questionsByElement.get(elementCode) ?? [];
    if (!qs.length) return;
    const targets =
      mode === "all"
        ? qs
        : [qs.find((q) => q.requiresDocumentation) ?? qs[0]!];

    for (const q of targets) {
      const existing = await prisma.corEvidenceLink.findFirst({
        where: {
          sessionId: session!.id,
          questionId: q.id,
          sourceType: "DOCUMENT",
          sourceId: docId,
          deletedAt: null,
        },
      });
      if (existing) continue;
      await prisma.corEvidenceLink.create({
        data: {
          sessionId: session!.id,
          questionId: q.id,
          sourceType: "DOCUMENT",
          sourceId: docId,
          notes,
        },
      });
      linked += 1;
    }
  }

  const tocRel = "TABLE OF CONTENTS.pdf";
  if (documentByRel.has(tocRel)) {
    for (const el of program.elements) {
      await linkDocToQuestions(
        documentByRel.get(tocRel)!.id,
        el.code,
        "RTO Safety Program 2025 — Table of Contents",
        "anchor",
      );
    }
  }

  for (const chapter of ELEMENT_CHAPTERS) {
    const doc = documentByRel.get(chapter.rel);
    if (!doc) {
      console.warn(`Missing chapter file: ${chapter.rel}`);
      continue;
    }
    await linkDocToQuestions(
      doc.id,
      chapter.element,
      `RTO Safety Program 2025 — ${chapter.label}`,
      "all",
    );

    const qs = questionsByElement.get(chapter.element) ?? [];
    for (const q of qs) {
      const existing = await prisma.corQuestionResponse.findFirst({
        where: {
          sessionId: session.id,
          questionId: q.id,
          deletedAt: null,
        },
      });
      const comment = `Documentation reference: RTO Safety Program 2025 — ${chapter.label} (${path.basename(chapter.rel)}). Review against interview/observation requirements before finalizing.`;
      if (!existing) {
        await prisma.corQuestionResponse.create({
          data: {
            sessionId: session.id,
            questionId: q.id,
            status: "ADEQUATE",
            comments: comment,
          },
        });
        answered += 1;
      } else {
        await prisma.corQuestionResponse.update({
          where: { id: existing.id },
          data: {
            status:
              existing.status === "NOT_STARTED" ||
              existing.status === "IN_PROGRESS"
                ? "ADEQUATE"
                : existing.status,
            comments:
              existing.comments?.includes("RTO Safety Program 2025")
                ? existing.comments
                : comment,
            deletedAt: null,
          },
        });
        answered += 1;
      }
    }
  }

  for (const [rel, doc] of documentByRel) {
    if (chapterByRel.has(rel) || rel === tocRel) continue;
    const folder = FOLDER_ELEMENT.find((f) => rel.startsWith(f.prefix));
    if (!folder) continue;
    await linkDocToQuestions(
      doc.id,
      folder.element,
      `RTO Safety Program 2025 supporting doc: ${rel}`,
      "anchor",
    );
  }

  await prisma.corAuditSession.update({
    where: { id: session.id },
    data: {
      status: "IN_PROGRESS",
      notes:
        "Drafted from company Files (RTO Safety Program 2025). Results set to Adequate with documentation notes — review interview/observation items before finalizing.",
      startedAt: session.startedAt ?? new Date(),
    },
  });

  console.log(
    JSON.stringify(
      {
        company: company.name,
        sessionId: session.id,
        title: SESSION_TITLE,
        companyFilesMatched: documentByRel.size,
        evidenceLinksCreated: linked,
        responsesWritten: answered,
        softDeletedDuplicateDrafts: softDeletedDuplicates,
        openAuditUrl: `/compliance/audits/${session.id}`,
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
