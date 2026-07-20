/**
 * Import RTO Safety Program 2025 PDFs for RidgeTech One and wire them into COR.
 *
 * - Uploads PDFs to cor-media
 * - Creates Document rows
 * - Creates/resumes an internal COR audit session
 * - Links key program chapters to matching BCCSA element questions
 * - Drafts ADEQUATE answers citing the program documents
 *
 * Usage:
 *   npx tsx scripts/seed-ridgetech-safety-program.ts
 *   RTO_SAFETY_PROGRAM_DIR="/path/to/folder" npx tsx scripts/seed-ridgetech-safety-program.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../src/generated/prisma/client");

const COMPANY_SLUG = "ridgetechone";
const BUCKET = "cor-media";
const PROGRAM_CODE = "BCCSA-COR";
const SESSION_TITLE = "Internal COR audit — RTO Safety Program 2025";
const STORAGE_PREFIX = "safety-program-2025";

const DEFAULT_SRC =
  "/Users/kojinfox/Downloads/RTO SAFETY PROGRAM 2025 - PDF";

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

/** Folder prefix → attach to first documentation question of element only */
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

function walkPdfs(root: string): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        out.push(full);
      }
    }
  }
  walk(root);
  return out.sort();
}

function sanitizeStorageSegment(name: string) {
  return (
    name
      .normalize("NFKD")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
      .replace(/[\u00a0\u202f\u2007\u2013\u2014]/g, "-")
      .replace(/[^\w.\-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120) || "file"
  );
}

function toStoragePath(companyId: string, rel: string) {
  const parts = rel.split(/[/\\]/).map(sanitizeStorageSegment);
  return `${companyId}/${STORAGE_PREFIX}/${parts.join("/")}`;
}

function mimeFor(filePath: string) {
  return filePath.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "application/octet-stream";
}

async function ensureBucket(admin: {
  storage: {
    listBuckets: () => Promise<{ data: { id: string; name: string }[] | null }>;
    createBucket: (
      id: string,
      options: { public: boolean },
    ) => Promise<unknown>;
  };
}) {
  const { data } = await admin.storage.listBuckets();
  if (!data?.some((b) => b.id === BUCKET || b.name === BUCKET)) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
    });
  }
}

async function main() {
  const srcRoot = process.env.RTO_SAFETY_PROGRAM_DIR || DEFAULT_SRC;
  if (!fs.existsSync(srcRoot)) {
    throw new Error(`Safety program folder not found: ${srcRoot}`);
  }

  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!databaseUrl || !supabaseUrl || !serviceRole) {
    throw new Error("Missing DATABASE_URL / Supabase env");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    ssl: databaseUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await ensureBucket(admin);

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
          questions: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
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
      el.questions.map((q: { id: string; number: string; requiresDocumentation: boolean }) => ({
        id: q.id,
        number: q.number,
        requiresDocumentation: q.requiresDocumentation,
      })),
    );
  }

  let session = await prisma.corAuditSession.findFirst({
    where: {
      companyId: company.id,
      title: SESSION_TITLE,
      deletedAt: null,
    },
  });
  if (!session) {
    session = await prisma.corAuditSession.create({
      data: {
        companyId: company.id,
        programId: program.id,
        type: "INTERNAL",
        status: "IN_PROGRESS",
        title: SESSION_TITLE,
        startedAt: new Date(),
        notes:
          "Drafted from RTO Safety Program 2025 PDFs. Review answers before BCCSA submission.",
      },
    });
    console.log("Created audit session", session.id);
  } else {
    console.log("Using existing audit session", session.id);
  }

  const pdfs = walkPdfs(srcRoot);
  console.log(`Found ${pdfs.length} PDFs under ${srcRoot}`);

  const chapterByRel = new Map(
    ELEMENT_CHAPTERS.map((c) => [c.rel.replace(/\\/g, "/"), c]),
  );

  let uploaded = 0;
  let linked = 0;
  let answered = 0;
  const documentByRel = new Map<string, { id: string; title: string; url: string }>();

  for (const fullPath of pdfs) {
    const rel = path.relative(srcRoot, fullPath).replace(/\\/g, "/");
    const storagePath = toStoragePath(company.id, rel);
    const bytes = fs.readFileSync(fullPath);
    const title = path.basename(fullPath, ".pdf");

    // Upload (upsert so re-runs are safe)
    const { error: upErr } = await admin.storage.from(BUCKET).upload(
      storagePath,
      bytes,
      {
        upsert: true,
        contentType: mimeFor(fullPath),
      },
    );
    if (upErr) {
      console.warn(`Upload failed ${rel}: ${upErr.message}`);
      continue;
    }
    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

    let doc = await prisma.document.findFirst({
      where: {
        companyId: company.id,
        deletedAt: null,
        OR: [
          { storagePath },
          { description: `RTO Safety Program 2025: ${rel}` },
        ],
      },
    });
    if (!doc) {
      doc = await prisma.document.create({
        data: {
          companyId: company.id,
          entityType: "COMPANY",
          entityId: company.id,
          storagePath,
          url: publicUrl,
          title: `RTO 2025 — ${title}`,
          description: `RTO Safety Program 2025: ${rel}`,
          mimeType: mimeFor(fullPath),
          sizeBytes: bytes.length,
        },
      });
      uploaded += 1;
    } else {
      doc = await prisma.document.update({
        where: { id: doc.id },
        data: {
          storagePath,
          url: publicUrl,
          title: `RTO 2025 — ${title}`,
          description: `RTO Safety Program 2025: ${rel}`,
          sizeBytes: bytes.length,
          deletedAt: null,
        },
      });
    }
    documentByRel.set(rel, { id: doc.id, title: doc.title, url: doc.url });
  }

  console.log(`Documents upserted: ${documentByRel.size} (new this run ≈ ${uploaded})`);

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
        : [
            qs.find((q) => q.requiresDocumentation) ?? qs[0]!,
          ];

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

  // TOC → every element anchor
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

  // Primary chapters → all questions in element + draft answers
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
      } else if (
        existing.status === "NOT_STARTED" ||
        !existing.comments?.includes("RTO Safety Program 2025")
      ) {
        await prisma.corQuestionResponse.update({
          where: { id: existing.id },
          data: {
            status:
              existing.status === "NOT_STARTED" || existing.status === "IN_PROGRESS"
                ? "ADEQUATE"
                : existing.status,
            comments: existing.comments?.includes("RTO Safety Program 2025")
              ? existing.comments
              : comment,
            deletedAt: null,
          },
        });
        answered += 1;
      }
    }
  }

  // Folder supporting docs → element anchor question
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

  console.log(
    JSON.stringify(
      {
        company: company.name,
        sessionId: session.id,
        documents: documentByRel.size,
        evidenceLinksCreated: linked,
        responsesTouched: answered,
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
