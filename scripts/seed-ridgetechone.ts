/**
 * Seed RidgeTech One company + staff accounts.
 *
 * Usage: npx tsx scripts/seed-ridgetechone.ts
 *
 * Idempotent on company slug `ridgetechone`. Prints unique passwords at the end.
 */
import "dotenv/config";
import { randomBytes } from "crypto";

import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../src/generated/prisma/client";

const COMPANY_SLUG = "ridgetechone";
const COMPANY_NAME = "Ridgetechone Construction and Development Corp.";
const COMPANY_WEBSITE = "https://www.ridgetechone.com/";
const COMPANY_LOGO =
  "https://images.squarespace-cdn.com/content/v1/6535b51c32a9774c3dd908d2/3213c3f6-858e-4848-bfaa-26ad20e1a756/white+logo.png?format=1500w";

type SeedPerson = {
  key: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "COMPANY_ADMIN" | "SUPERVISOR";
  title: string;
  employeeNumber: string;
  department: string;
};

const PEOPLE: SeedPerson[] = [
  {
    key: "chris",
    email: "chris@ridgetechone.com",
    firstName: "Chris",
    lastName: "Ridge",
    role: "COMPANY_ADMIN",
    title: "CEO",
    employeeNumber: "RT-001",
    department: "Executive",
  },
  {
    key: "andrew",
    email: "andrew@ridgetechone.com",
    firstName: "Andrew",
    lastName: "Ridge",
    role: "SUPERVISOR",
    title: "Construction Manager",
    employeeNumber: "RT-010",
    department: "Construction",
  },
  {
    key: "tyler",
    email: "tyler@ridgetechone.com",
    firstName: "Tyler",
    lastName: "Ridge",
    role: "SUPERVISOR",
    title: "Crane Manager",
    employeeNumber: "RT-020",
    department: "Crane Operations",
  },
  {
    key: "britt",
    email: "britt@ridgetechone.com",
    firstName: "Britt",
    lastName: "Ridge",
    role: "COMPANY_ADMIN",
    title: "Safety Manager",
    employeeNumber: "RT-030",
    department: "Safety",
  },
  {
    key: "leigh",
    email: "leigh@ridgetechone.com",
    firstName: "Leigh",
    lastName: "Ridge",
    role: "SUPERVISOR",
    title: "Safety Coordinator",
    employeeNumber: "RT-040",
    department: "Safety",
  },
];

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

/** Readable unique password: Prefix + 10 url-safe chars + ! */
function makePassword(prefix: string) {
  const token = randomBytes(8)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 10);
  return `${prefix}${token}!`;
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    ssl: databaseUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const admin = createClient(supabaseUrl, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  console.log(`Seeding ${COMPANY_NAME}…`);

  const company = await prisma.company.upsert({
    where: { slug: COMPANY_SLUG },
    create: {
      name: COMPANY_NAME,
      slug: COMPANY_SLUG,
      website: COMPANY_WEBSITE,
      logoUrl: COMPANY_LOGO,
      isActive: true,
    },
    update: {
      name: COMPANY_NAME,
      website: COMPANY_WEBSITE,
      logoUrl: COMPANY_LOGO,
      isActive: true,
      deletedAt: null,
    },
  });

  const existingAuthUsers = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (existingAuthUsers.error) {
    throw new Error(
      `Unable to list auth users: ${existingAuthUsers.error.message}`,
    );
  }
  const authByEmail = new Map(
    existingAuthUsers.data.users
      .filter((user) => user.email)
      .map((user) => [user.email!.toLowerCase(), user]),
  );

  const credentials: { email: string; title: string; role: string; password: string }[] =
    [];

  for (const person of PEOPLE) {
    const password = makePassword(
      person.firstName.slice(0, 1).toUpperCase() +
        person.firstName.slice(1).toLowerCase() +
        "Rt",
    );

    const authMatch = authByEmail.get(person.email.toLowerCase());
    let authUserId = authMatch?.id;

    if (!authUserId) {
      const created = await admin.auth.admin.createUser({
        email: person.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: person.firstName,
          last_name: person.lastName,
          role: person.role,
          company_id: company.id,
        },
        app_metadata: {
          role: person.role,
          company_id: company.id,
        },
      });
      if (created.error || !created.data.user) {
        throw new Error(
          `Failed to create auth user ${person.email}: ${created.error?.message}`,
        );
      }
      authUserId = created.data.user.id;
      authByEmail.set(person.email.toLowerCase(), created.data.user);
    } else {
      await admin.auth.admin.updateUserById(authUserId, {
        password,
        email_confirm: true,
        user_metadata: {
          first_name: person.firstName,
          last_name: person.lastName,
          role: person.role,
          company_id: company.id,
        },
        app_metadata: {
          role: person.role,
          company_id: company.id,
        },
      });
    }

    const user = await prisma.user.upsert({
      where: { authUserId },
      create: {
        authUserId,
        email: person.email,
        firstName: person.firstName,
        lastName: person.lastName,
        isActive: true,
        settings: {
          create: { timezone: "America/Vancouver", locale: "en-CA" },
        },
      },
      update: {
        email: person.email,
        firstName: person.firstName,
        lastName: person.lastName,
        isActive: true,
        deletedAt: null,
      },
    });

    const existingEmployee = await prisma.employee.findFirst({
      where: { userId: user.id, companyId: company.id, deletedAt: null },
    });

    if (!existingEmployee) {
      await prisma.employee.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: person.role,
          status: "ACTIVE",
          title: person.title,
          employeeNumber: person.employeeNumber,
          department: person.department,
          level: 1,
          hireDate: new Date(),
        },
      });
    } else {
      await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          role: person.role,
          status: "ACTIVE",
          title: person.title,
          employeeNumber: person.employeeNumber,
          department: person.department,
          deletedAt: null,
        },
      });
    }

    credentials.push({
      email: person.email,
      title: person.title,
      role: person.role,
      password,
    });
    console.log(`  ✓ ${person.email} (${person.title})`);
  }

  console.log("\n── RidgeTech One login credentials ──");
  for (const row of credentials) {
    console.log(`${row.email}\t${row.password}\t${row.title}\t${row.role}`);
  }
  console.log("─────────────────────────────────────\n");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
