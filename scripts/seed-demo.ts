/**
 * Seed a realistic demo company for Proven CMS.
 *
 * Usage: npm run db:seed
 *
 * Idempotent on company slug `pacific-hoisting`. Demo users share password
 * printed at the end of a successful run.
 */
import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_SLUG = "pacific-hoisting";
const DEMO_PASSWORD = "DemoPass123!";
const DEMO_EMAIL_DOMAIN = "pacific-hoisting.demo";

type SeedPerson = {
  key: string;
  email: string;
  firstName: string;
  lastName: string;
  role:
    | "COMPANY_ADMIN"
    | "INSTRUCTOR"
    | "SUPERVISOR"
    | "ASSESSOR"
    | "APPRENTICE";
  title: string;
  trade?: string;
  level?: number;
  employeeNumber: string;
  supervisorKey?: string;
};

const PEOPLE: SeedPerson[] = [
  {
    key: "admin",
    email: `maya@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Maya",
    lastName: "Chen",
    role: "COMPANY_ADMIN",
    title: "Training Director",
    employeeNumber: "PH-001",
  },
  {
    key: "instructor",
    email: `jordan@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Jordan",
    lastName: "Blake",
    role: "INSTRUCTOR",
    title: "Senior Instructor",
    trade: "Tower Crane",
    employeeNumber: "PH-010",
  },
  {
    key: "supervisor",
    email: `sam@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Sam",
    lastName: "Rivera",
    role: "SUPERVISOR",
    title: "Site Supervisor",
    trade: "Rigging",
    employeeNumber: "PH-020",
  },
  {
    key: "casey",
    email: `casey@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Casey",
    lastName: "Nguyen",
    role: "APPRENTICE",
    title: "Rigger Apprentice",
    trade: "Rigging",
    level: 1,
    employeeNumber: "PH-101",
    supervisorKey: "supervisor",
  },
  {
    key: "riley",
    email: `riley@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Riley",
    lastName: "Patel",
    role: "APPRENTICE",
    title: "Rigger Apprentice",
    trade: "Rigging",
    level: 2,
    employeeNumber: "PH-102",
    supervisorKey: "supervisor",
  },
  {
    key: "morgan",
    email: `morgan@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Morgan",
    lastName: "Ellis",
    role: "APPRENTICE",
    title: "Tower Crane Apprentice",
    trade: "Tower Crane",
    level: 1,
    employeeNumber: "PH-103",
    supervisorKey: "supervisor",
  },
  {
    key: "jamie",
    email: `jamie@${DEMO_EMAIL_DOMAIN}`,
    firstName: "Jamie",
    lastName: "Okoye",
    role: "APPRENTICE",
    title: "Tower Crane Apprentice",
    trade: "Tower Crane",
    level: 2,
    employeeNumber: "PH-104",
    supervisorKey: "supervisor",
  },
];

const CATEGORIES = [
  {
    code: "TOWER_CRANE",
    name: "Tower Crane",
    description: "Tower crane operation, setup, and lift planning competencies.",
    sortOrder: 10,
  },
  {
    code: "MOBILE_CRANE",
    name: "Mobile Crane",
    description: "Mobile crane operation, mobility, and site setup competencies.",
    sortOrder: 20,
  },
  {
    code: "RIGGING",
    name: "Rigging",
    description: "Rigging hardware, load control, and signaling competencies.",
    sortOrder: 30,
  },
  {
    code: "CONCRETE",
    name: "Concrete",
    description: "Concrete placement, finishing, and curing competencies.",
    sortOrder: 40,
  },
  {
    code: "FORMWORK",
    name: "Formwork",
    description: "Formwork assembly, inspection, and stripping competencies.",
    sortOrder: 50,
  },
  {
    code: "MATERIAL_HANDLING",
    name: "Material Handling",
    description: "Material movement, storage, and equipment handling competencies.",
    sortOrder: 60,
  },
  {
    code: "SAFETY",
    name: "Safety",
    description: "Site safety, hazard control, and regulatory compliance competencies.",
    sortOrder: 70,
  },
] as const;

const COMPETENCIES = [
  {
    code: "RIG-101",
    title: "Sling Inspection & Rejection",
    description:
      "Identify wear, damage, and manufacturer rejection criteria for wire rope and synthetic slings before use.",
    categoryCode: "RIGGING",
    difficulty: "BEGINNER" as const,
    trade: "Rigging",
    level: 1,
    reference: "ASME B30.9",
    workSafeBcReference: "OHSR Part 15",
    criteria: [
      "Select the correct sling type for the load and hitch.",
      "Identify damage that requires removal from service.",
      "Document inspection results before the lift.",
    ],
  },
  {
    code: "RIG-201",
    title: "Load Weight Estimation",
    description:
      "Estimate load weight using material charts, drawings, and measured dimensions within safe working limits.",
    categoryCode: "RIGGING",
    difficulty: "INTERMEDIATE" as const,
    trade: "Rigging",
    level: 2,
    reference: "CSA Z150",
    criteria: [
      "Calculate weight from dimensions and unit density.",
      "Include attachments and below-the-hook devices.",
      "Compare calculated weight to WLL with required margin.",
    ],
  },
  {
    code: "RIG-220",
    title: "Multi-leg Bridle Setup",
    description:
      "Configure multi-leg bridles with correct angles, hitch type, and hardware rating for balanced lifts.",
    categoryCode: "RIGGING",
    difficulty: "INTERMEDIATE" as const,
    trade: "Rigging",
    level: 2,
    asmeReference: "ASME B30.9",
    criteria: [
      "Determine required sling angle and adjusted capacity.",
      "Protect edges and maintain balanced load control.",
      "Verify master link and hardware ratings.",
    ],
  },
  {
    code: "TC-110",
    title: "Tower Crane Hand Signals",
    description:
      "Demonstrate standard crane hand signals and radio confirmation protocols for critical lifts.",
    categoryCode: "TOWER_CRANE",
    difficulty: "BEGINNER" as const,
    trade: "Tower Crane",
    level: 1,
    workSafeBcReference: "OHSR Part 14",
    criteria: [
      "Use correct signals for hoist, lower, swing, and stop.",
      "Maintain line-of-sight or confirmed radio contact.",
      "Stop the lift when communication is unclear.",
    ],
  },
  {
    code: "TC-205",
    title: "Lift Planning Basics",
    description:
      "Prepare a basic lift plan including radius, capacity, exclusion zones, and tag-line requirements.",
    categoryCode: "TOWER_CRANE",
    difficulty: "INTERMEDIATE" as const,
    trade: "Tower Crane",
    level: 2,
    reference: "CSA Z150",
    criteria: [
      "Confirm load chart capacity at planned radius.",
      "Identify ground conditions and exclusion zones.",
      "Assign roles for rigger, signaler, and operator.",
    ],
  },
  {
    code: "SAF-100",
    title: "Site Hazard Assessment",
    description:
      "Complete a daily hazard assessment for crane and rigging activities, including wind and power-line risks.",
    categoryCode: "SAFETY",
    difficulty: "BEGINNER" as const,
    trade: "Safety",
    level: 1,
    workSafeBcReference: "OHSR Part 14 & 15",
    criteria: [
      "Identify overhead and underground hazards.",
      "Document controls before work starts.",
      "Escalate unsafe conditions to the supervisor.",
    ],
  },
  {
    code: "SAF-210",
    title: "Exclusion Zone Control",
    description:
      "Establish and maintain exclusion zones during tower crane lifts with correct barriers and communication.",
    categoryCode: "SAFETY",
    difficulty: "INTERMEDIATE" as const,
    trade: "Safety",
    level: 2,
    criteria: [
      "Mark exclusion zones before the lift.",
      "Control access during swing and hoist paths.",
      "Coordinate with adjacent trades before lifting.",
    ],
  },
  {
    code: "MH-120",
    title: "Tag Line Load Control",
    description:
      "Use tag lines safely to control load spin and landing without entering under the suspended load.",
    categoryCode: "MATERIAL_HANDLING",
    difficulty: "BEGINNER" as const,
    trade: "Rigging",
    level: 1,
    criteria: [
      "Position outside the fall zone.",
      "Maintain control through landing without load riding.",
      "Communicate status to the signaler continuously.",
    ],
  },
];

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function daysAgo(days: number) {
  return daysFromNow(-days);
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

  console.log("Seeding Proven demo company…");

  const company = await prisma.company.upsert({
    where: { slug: DEMO_SLUG },
    create: {
      name: "Pacific Hoisting Ltd.",
      slug: DEMO_SLUG,
      website: "https://pacific-hoisting.demo",
      phone: "+1-604-555-0142",
      address: "1840 Terminal Avenue, Vancouver, BC",
      isActive: true,
    },
    update: {
      name: "Pacific Hoisting Ltd.",
      website: "https://pacific-hoisting.demo",
      phone: "+1-604-555-0142",
      address: "1840 Terminal Avenue, Vancouver, BC",
      isActive: true,
      deletedAt: null,
    },
  });

  const peopleByKey = new Map<
    string,
    { userId: string; employeeId: string; authUserId: string }
  >();

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

  for (const person of PEOPLE) {
    const authMatch = authByEmail.get(person.email.toLowerCase());

    let authUserId = authMatch?.id;
    if (!authUserId) {
      const created = await admin.auth.admin.createUser({
        email: person.email,
        password: DEMO_PASSWORD,
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
        password: DEMO_PASSWORD,
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
        settings: { create: { timezone: "America/Vancouver", locale: "en-CA" } },
      },
      update: {
        email: person.email,
        firstName: person.firstName,
        lastName: person.lastName,
        isActive: true,
        deletedAt: null,
      },
    });

    let employee = await prisma.employee.findFirst({
      where: { userId: user.id, companyId: company.id, deletedAt: null },
    });

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: person.role,
          status: "ACTIVE",
          title: person.title,
          trade: person.trade,
          level: person.level ?? 1,
          employeeNumber: person.employeeNumber,
          department: person.role === "APPRENTICE" ? "Field" : "Operations",
          hireDate: daysAgo(180),
        },
      });
    } else {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          role: person.role,
          status: "ACTIVE",
          title: person.title,
          trade: person.trade,
          level: person.level ?? 1,
          employeeNumber: person.employeeNumber,
          deletedAt: null,
        },
      });
    }

    peopleByKey.set(person.key, {
      userId: user.id,
      employeeId: employee.id,
      authUserId,
    });
  }

  // Wire supervisor links after all employees exist.
  for (const person of PEOPLE) {
    if (!person.supervisorKey) continue;
    const employee = peopleByKey.get(person.key);
    const supervisor = peopleByKey.get(person.supervisorKey);
    if (!employee || !supervisor) continue;
    await prisma.employee.update({
      where: { id: employee.employeeId },
      data: { supervisorId: supervisor.employeeId },
    });
  }

  const adminUser = peopleByKey.get("admin")!;
  const instructor = peopleByKey.get("instructor")!;
  const apprentices = ["casey", "riley", "morgan", "jamie"].map(
    (key) => peopleByKey.get(key)!,
  );

  for (const category of CATEGORIES) {
    await prisma.competencyCategory.upsert({
      where: {
        companyId_code: { companyId: company.id, code: category.code },
      },
      create: {
        companyId: company.id,
        code: category.code,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        createdById: adminUser.userId,
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        deletedAt: null,
      },
    });
  }

  const categories = await prisma.competencyCategory.findMany({
    where: { companyId: company.id, deletedAt: null },
  });
  const categoryByCode = new Map(categories.map((c) => [c.code, c.id]));

  const competencyIds: string[] = [];
  for (const item of COMPETENCIES) {
    const existing = await prisma.competency.findFirst({
      where: {
        companyId: company.id,
        code: item.code,
        version: 1,
        deletedAt: null,
      },
    });

    const data = {
      companyId: company.id,
      categoryId: categoryByCode.get(item.categoryCode) ?? null,
      code: item.code,
      title: item.title,
      description: item.description,
      reference: item.reference ?? null,
      asmeReference: item.asmeReference ?? null,
      workSafeBcReference: item.workSafeBcReference ?? null,
      difficulty: item.difficulty,
      estimatedTimeMinutes: 45,
      trade: item.trade,
      level: item.level,
      status: "ACTIVE" as const,
      version: 1,
      requiredDemonstrationCount: 2,
      createdById: adminUser.userId,
    };

    const competency = existing
      ? await prisma.competency.update({
          where: { id: existing.id },
          data: { ...data, deletedAt: null },
        })
      : await prisma.competency.create({ data });

    await prisma.competencyCriterion.deleteMany({
      where: { competencyId: competency.id },
    });
    await prisma.competencyCriterion.createMany({
      data: item.criteria.map((description, index) => ({
        competencyId: competency.id,
        description,
        sortOrder: index + 1,
        isCritical: index === 0,
        createdById: adminUser.userId,
      })),
    });

    competencyIds.push(competency.id);
  }

  let project = await prisma.project.findFirst({
    where: { companyId: company.id, code: "BCR-26", deletedAt: null },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        companyId: company.id,
        code: "BCR-26",
        name: "Broadway Corridor Tower Crane",
        description:
          "High-rise concrete and steel package using a self-erecting tower crane.",
        status: "ACTIVE",
        location: "Broadway & Cambie, Vancouver, BC",
        startDate: daysAgo(45),
        endDate: daysFromNow(120),
        createdById: adminUser.userId,
      },
    });
  } else {
    project = await prisma.project.update({
      where: { id: project.id },
      data: {
        name: "Broadway Corridor Tower Crane",
        status: "ACTIVE",
        deletedAt: null,
      },
    });
  }

  for (const [index, apprentice] of apprentices.entries()) {
    await prisma.projectAssignment.upsert({
      where: {
        projectId_employeeId: {
          projectId: project.id,
          employeeId: apprentice.employeeId,
        },
      },
      create: {
        projectId: project.id,
        employeeId: apprentice.employeeId,
        roleLabel: "Apprentice Rigger",
        isPrimary: index === 0,
        startsAt: daysAgo(30),
        createdById: adminUser.userId,
      },
      update: {
        roleLabel: "Apprentice Rigger",
        deletedAt: null,
      },
    });
  }

  // Clear previous demo assessments/observations/matrix for a clean reseed.
  const oldAssessments = await prisma.assessment.findMany({
    where: { companyId: company.id, title: { startsWith: "[Demo]" } },
    select: { id: true },
  });
  if (oldAssessments.length > 0) {
    const ids = oldAssessments.map((a) => a.id);
    await prisma.assessmentResult.deleteMany({
      where: { assessmentId: { in: ids } },
    });
    await prisma.assessment.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.observation.deleteMany({
    where: { companyId: company.id, notes: { startsWith: "[Demo]" } },
  });

  const assessmentSpecs = [
    {
      title: "[Demo] Sling Inspection — Casey",
      type: "PRACTICAL" as const,
      status: "COMPLETED" as const,
      competencyIndex: 0,
      apprenticeIndex: 0,
      outcome: "COMPETENT" as const,
      rating: "COMPETENT" as const,
      score: 92,
    },
    {
      title: "[Demo] Load Estimation — Riley",
      type: "PRACTICAL" as const,
      status: "COMPLETED" as const,
      competencyIndex: 1,
      apprenticeIndex: 1,
      outcome: "NOT_YET_COMPETENT" as const,
      rating: "NEEDS_IMPROVEMENT" as const,
      score: 58,
    },
    {
      title: "[Demo] Hand Signals — Morgan",
      type: "OBSERVATION" as const,
      status: "IN_PROGRESS" as const,
      competencyIndex: 3,
      apprenticeIndex: 2,
      outcome: "IN_PROGRESS" as const,
      rating: null,
      score: null,
    },
    {
      title: "[Demo] Lift Planning — Jamie",
      type: "PRACTICAL" as const,
      status: "SCHEDULED" as const,
      competencyIndex: 4,
      apprenticeIndex: 3,
      outcome: "NOT_STARTED" as const,
      rating: null,
      score: null,
    },
    {
      title: "[Demo] Hazard Assessment — Casey",
      type: "CONTINUOUS" as const,
      status: "COMPLETED" as const,
      competencyIndex: 5,
      apprenticeIndex: 0,
      outcome: "COMPETENT" as const,
      rating: "EXCEEDS_STANDARD" as const,
      score: 96,
    },
  ];

  for (const spec of assessmentSpecs) {
    const assessment = await prisma.assessment.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        competencyId: competencyIds[spec.competencyIndex],
        assessorId: instructor.employeeId,
        type: spec.type,
        title: spec.title,
        description: "Seeded demo assessment for Pacific Hoisting.",
        status: spec.status,
        scheduledAt:
          spec.status === "SCHEDULED" ? daysFromNow(5) : daysAgo(7),
        completedAt: spec.status === "COMPLETED" ? daysAgo(2) : null,
        createdById: adminUser.userId,
      },
    });

    await prisma.assessmentResult.create({
      data: {
        assessmentId: assessment.id,
        employeeId: apprentices[spec.apprenticeIndex].employeeId,
        assessorId: instructor.employeeId,
        outcome: spec.outcome,
        rating: spec.rating,
        score: spec.score,
        maxScore: 100,
        comments:
          spec.outcome === "COMPETENT"
            ? "Met all critical criteria with safe communication."
            : spec.outcome === "NOT_YET_COMPETENT"
              ? "Needs more practice on chart interpolation."
              : "Assessment in progress.",
        evidenceNotes: "[Demo] Seeded evidence notes.",
        assessedAt: spec.status === "COMPLETED" ? daysAgo(2) : null,
        createdById: adminUser.userId,
      },
    });
  }

  await prisma.observation.createMany({
    data: [
      {
        companyId: company.id,
        projectId: project.id,
        categoryId: categoryByCode.get("RIGGING"),
        competencyId: competencyIds[0],
        employeeId: apprentices[0].employeeId,
        observerId: instructor.employeeId,
        observationType: "COMPETENT_DEMONSTRATION",
        context: "Pre-lift sling check on level-12 outbound loads",
        location: "Hook block staging area",
        rating: "MEETS",
        comments: "Thorough rejection call-out on a chafed synthetic sling.",
        notes: "[Demo] Positive observation.",
        followUpStatus: "NONE",
        observedAt: daysAgo(3),
        createdById: adminUser.userId,
      },
      {
        companyId: company.id,
        projectId: project.id,
        categoryId: categoryByCode.get("SAFETY"),
        competencyId: competencyIds[6],
        employeeId: apprentices[1].employeeId,
        observerId: instructor.employeeId,
        observationType: "COACHING_OPPORTUNITY",
        context: "Exclusion zone during panel lift",
        location: "North pour deck",
        rating: "DEVELOPING",
        comments: "Allowed pedestrian transit too close to swing path.",
        notes: "[Demo] Coaching follow-up required.",
        correctiveActions: "Rebrief team on swing-path barriers before next lift.",
        followUpStatus: "OPEN",
        dueDate: daysFromNow(3),
        observedAt: daysAgo(1),
        createdById: adminUser.userId,
      },
      {
        companyId: company.id,
        projectId: project.id,
        categoryId: categoryByCode.get("TOWER_CRANE"),
        competencyId: competencyIds[3],
        employeeId: apprentices[2].employeeId,
        observerId: instructor.employeeId,
        observationType: "POSITIVE_OBSERVATION",
        context: "Radio confirmation before blind hoist",
        location: "Crane cab channel 2",
        rating: "EXCEEDS",
        comments: "Clear three-way confirmation before every move.",
        notes: "[Demo] Strong communication habits.",
        followUpStatus: "NONE",
        observedAt: daysAgo(4),
        createdById: adminUser.userId,
      },
    ],
  });

  let matrix = await prisma.trainingMatrix.findFirst({
    where: {
      companyId: company.id,
      name: "Pacific Hoisting — Q3 Matrix",
      deletedAt: null,
    },
  });
  if (!matrix) {
    matrix = await prisma.trainingMatrix.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        name: "Pacific Hoisting — Q3 Matrix",
        description: "Demo training matrix for Broadway Corridor apprentices.",
        isActive: true,
        createdById: adminUser.userId,
      },
    });
  }

  await prisma.trainingMatrixEntry.deleteMany({
    where: { matrixId: matrix.id },
  });

  const cellStatuses = [
    "COMPETENT",
    "IN_PROGRESS",
    "NOT_STARTED",
    "NEEDS_REASSESSMENT",
    "VERIFIED",
  ] as const;

  const entries = [];
  for (const [aIndex, apprentice] of apprentices.entries()) {
    for (const [cIndex, competencyId] of competencyIds.entries()) {
      entries.push({
        matrixId: matrix.id,
        employeeId: apprentice.employeeId,
        competencyId,
        requirementLevel: "REQUIRED" as const,
        status: cellStatuses[(aIndex + cIndex) % cellStatuses.length],
        dueDate: daysFromNow(14 + cIndex * 3),
        lastAssessedAt:
          cellStatuses[(aIndex + cIndex) % cellStatuses.length] === "NOT_STARTED"
            ? null
            : daysAgo(aIndex + 1),
        createdById: adminUser.userId,
      });
    }
  }
  await prisma.trainingMatrixEntry.createMany({ data: entries });

  console.log("\nDemo company ready:");
  console.log(`  Company: Pacific Hoisting Ltd. (${DEMO_SLUG})`);
  console.log(`  Password for all demo users: ${DEMO_PASSWORD}`);
  console.log("  Accounts:");
  for (const person of PEOPLE) {
    console.log(`    ${person.role.padEnd(14)} ${person.email}`);
  }
  console.log(
    `\nSign in at Proven as Maya (${PEOPLE[0].email}) to browse the demo workspace.`,
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
