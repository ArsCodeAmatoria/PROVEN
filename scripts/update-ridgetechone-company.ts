/**
 * Update RidgeTech One company profile from public website data.
 * Usage: npx tsx scripts/update-ridgetechone-company.ts
 */
import "dotenv/config";

import { createRequire } from "module";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../src/generated/prisma/client");

const COMPANY_SLUG = "ridgetechone";
const LEGAL_NAME = "Ridgetechone Construction and Development Corp.";
const WEBSITE = "https://www.ridgetechone.com/";
const PHONE = "(604) 335-9216";
const ADDRESS = "#503 – 4211 Kingsway, Burnaby, BC V5H 1Z6";
const LOGO_URL =
  "https://images.squarespace-cdn.com/content/v1/6535b51c32a9774c3dd908d2/3213c3f6-858e-4848-bfaa-26ad20e1a756/white+logo.png?format=1500w";

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

  const company = await prisma.company.update({
    where: { slug: COMPANY_SLUG },
    data: {
      name: LEGAL_NAME,
      website: WEBSITE,
      phone: PHONE,
      address: ADDRESS,
      logoUrl: LOGO_URL,
      isActive: true,
      deletedAt: null,
    },
  });

  console.log("Updated company:", {
    id: company.id,
    slug: company.slug,
    name: company.name,
    website: company.website,
    phone: company.phone,
    address: company.address,
    logoUrl: company.logoUrl,
  });
  console.log(
    "Services (site): concrete formwork · crane operations · rigging · rebar installation · project management · property development · equipment rental",
  );
  console.log(
    "Social: LinkedIn https://www.linkedin.com/company/ridgetechone-construction-and-development/",
  );
  console.log("Social: Instagram https://www.instagram.com/ridgetechoneconstruction/");
  console.log("Owner/CEO (site): Chris · chris@ridgetechone.com · (604) 335-9216");
  console.log("Safety (site): safety@ridgetechone.com · (604) 335-9216");
  console.log(
    "Primary contacts in Proven: chris@ / andrew@ / tyler@ / britt@ / leigh@ ridgetechone.com",
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
