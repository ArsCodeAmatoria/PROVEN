/**
 * Rebuild RidgeTech Files folders to match RTO Safety Program 2025 directory tree.
 * Usage: npx tsx scripts/organize-ridgetech-files.ts
 */
import "dotenv/config";
import { createRequire } from "module";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../src/generated/prisma/client");

const COMPANY_SLUG = "ridgetechone";
const ROOT_NAME = "Safety Program";

async function ensureFolder(
  prisma: InstanceType<typeof PrismaClient>,
  companyId: string,
  parentId: string | null,
  name: string,
  cache: Map<string, string>,
) {
  const key = `${parentId ?? "root"}::${name}`;
  const cached = cache.get(key);
  if (cached) return cached;

  let folder = await prisma.companyFolder.findFirst({
    where: {
      companyId,
      parentId,
      name,
      deletedAt: null,
    },
  });
  if (!folder) {
    folder = await prisma.companyFolder.create({
      data: { companyId, parentId, name },
    });
  }
  cache.set(key, folder.id);
  return folder.id as string;
}

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

  const company = await prisma.company.findFirst({
    where: { slug: COMPANY_SLUG, deletedAt: null },
  });
  if (!company) throw new Error("RidgeTech company not found");

  const cache = new Map<string, string>();
  const rootId = await ensureFolder(
    prisma,
    company.id,
    null,
    ROOT_NAME,
    cache,
  );

  const docs = await prisma.document.findMany({
    where: {
      companyId: company.id,
      deletedAt: null,
      description: { startsWith: "RTO Safety Program 2025:" },
    },
    select: { id: true, description: true, title: true },
  });

  let moved = 0;
  for (const doc of docs) {
    const rel = (doc.description || "")
      .replace(/^RTO Safety Program 2025:\s*/, "")
      .trim();
    if (!rel) continue;

    const parts = rel.split("/").filter(Boolean);
    // Last part is filename — folders are everything before it
    const folderParts = parts.slice(0, -1);
    let parentId: string | null = rootId;
    for (const part of folderParts) {
      parentId = await ensureFolder(
        prisma,
        company.id,
        parentId,
        part,
        cache,
      );
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: { folderId: parentId },
    });
    moved += 1;
  }

  // Soft-delete empty leftover flat folders that aren't in the new tree names
  // (keep Safety Program root and nested structure).

  const folderCount = await prisma.companyFolder.count({
    where: { companyId: company.id, deletedAt: null },
  });

  console.log(
    JSON.stringify(
      {
        company: company.name,
        documentsOrganized: moved,
        folders: folderCount,
        rootFolder: ROOT_NAME,
        tip: "Open /files → Safety Program",
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
