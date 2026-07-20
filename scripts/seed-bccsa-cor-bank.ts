/**
 * Upsert official BCCSA COR question bank into the platform CorProgram.
 * Usage: npx tsx scripts/seed-bccsa-cor-bank.ts
 */
import "dotenv/config";

import { createRequire } from "module";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import bank from "../src/lib/cor/bccsa-question-bank.json";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../src/generated/prisma/client");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Missing DATABASE_URL");

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    ssl: databaseUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  let program = await prisma.corProgram.findFirst({
    where: { companyId: null, code: bank.programCode, deletedAt: null },
  });

  if (!program) {
    program = await prisma.corProgram.create({
      data: {
        companyId: null,
        code: bank.programCode,
        title: bank.programTitle,
        description:
          "Official BCCSA COR OHS Audit question bank (V2 R13).",
        version: bank.programVersion,
        isActive: true,
        sortOrder: 0,
      },
    });
  } else {
    program = await prisma.corProgram.update({
      where: { id: program.id },
      data: {
        title: bank.programTitle,
        version: bank.programVersion,
        description:
          "Official BCCSA COR OHS Audit question bank (V2 R13).",
        deletedAt: null,
        isActive: true,
      },
    });
  }

  const keepNumbers = new Set(
    bank.elements.flatMap((e) => e.questions.map((q) => q.number)),
  );

  for (const [index, element] of bank.elements.entries()) {
    const row = await prisma.corElement.upsert({
      where: {
        programId_code: { programId: program.id, code: element.code },
      },
      create: {
        programId: program.id,
        code: element.code,
        title: element.title,
        description: element.description,
        weight: 1,
        sortOrder: index + 1,
      },
      update: {
        title: element.title,
        description: element.description,
        sortOrder: index + 1,
        deletedAt: null,
      },
    });

    for (const [qIndex, q] of element.questions.entries()) {
      await prisma.corQuestion.upsert({
        where: {
          elementId_number: { elementId: row.id, number: q.number },
        },
        create: {
          elementId: row.id,
          number: q.number,
          reference: `BCCSA-${q.number}`,
          description: q.description,
          weight: q.weight,
          requiresDocumentation: q.requiresDocumentation,
          requiresObservation: q.requiresObservation,
          requiresInterview: q.requiresInterview,
          sortOrder: qIndex + 1,
        },
        update: {
          description: q.description,
          weight: q.weight,
          requiresDocumentation: q.requiresDocumentation,
          requiresObservation: q.requiresObservation,
          requiresInterview: q.requiresInterview,
          sortOrder: qIndex + 1,
          deletedAt: null,
        },
      });
    }
  }

  const liveElements = await prisma.corElement.findMany({
    where: { programId: program.id, deletedAt: null },
    select: { id: true },
  });
  await prisma.corQuestion.updateMany({
    where: {
      elementId: { in: liveElements.map((e: { id: string }) => e.id) },
      deletedAt: null,
      number: { notIn: [...keepNumbers] },
    },
    data: { deletedAt: new Date() },
  });

  const counts = await prisma.corQuestion.count({
    where: {
      deletedAt: null,
      element: { programId: program.id, deletedAt: null },
    },
  });

  console.log(
    `Seeded ${bank.programCode} ${bank.programVersion}: ${bank.elements.length} elements, ${counts} questions`,
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
