import "server-only";

import { ensurePlatformCorProgram } from "@/services/compliance.service";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";
import { notDeleted } from "@/types";

import { failure, getDatabaseConfigError, success, unavailable } from "./base";

export type CorSampleProjectType =
  | "TOWER_CRANE"
  | "MOBILE_CRANE"
  | "CIVIL"
  | "INDUSTRIAL"
  | "COMMERCIAL"
  | "RESIDENTIAL"
  | "FABRICATION_SHOP"
  | "YARD"
  | "MAINTENANCE"
  | "WAREHOUSE"
  | "OFFICE";

export type CorSampleRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type CorSampleSiteStatus =
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETE"
  | "ON_HOLD"
  | "CANCELLED";
export type CorInterviewType = "WORKER" | "MANAGER";
export type CorInterviewStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED"
  | "INCOMPLETE";
export type CorInterviewAnswer = "PASS" | "FAIL" | "NA" | "NOT_ASKED";
export type CorObservationCategory =
  | "HOUSEKEEPING"
  | "PPE"
  | "RIGGING"
  | "EQUIPMENT"
  | "MOBILE_EQUIPMENT"
  | "TOWER_CRANE"
  | "FALL_PROTECTION"
  | "TRAFFIC_CONTROL"
  | "EXCAVATION"
  | "CONFINED_SPACE"
  | "ELECTRICAL"
  | "LADDERS"
  | "SCAFFOLDING"
  | "MATERIAL_STORAGE"
  | "ENVIRONMENTAL";
export type CorObservationResult = "PASS" | "FAIL" | "NA";

export type SampleSiteView = {
  id: string;
  planId: string;
  siteName: string;
  projectNumber: string | null;
  address: string | null;
  supervisorName: string | null;
  projectType: CorSampleProjectType;
  workerCount: number;
  riskLevel: CorSampleRiskLevel;
  status: CorSampleSiteStatus;
  selectedForAudit: boolean;
  recommended: boolean;
  recommendationReason: string | null;
};

export type SamplingPlanView = {
  id: string;
  companyId: string;
  sessionId: string | null;
  companyName: string;
  auditYear: number;
  employeeCount: number;
  activeSiteCount: number;
  notes: string | null;
  sites: SampleSiteView[];
};

export type InterviewListItem = {
  id: string;
  sessionId: string;
  type: CorInterviewType;
  status: CorInterviewStatus;
  subjectName: string | null;
  siteLabel: string | null;
  trade: string | null;
  conductedAt: Date | null;
  compliancePct: number | null;
  passCount: number;
  failCount: number;
  questionsAsked: number;
};

export type InterviewResponseView = {
  id: string;
  bankQuestionId: string | null;
  corQuestionId: string | null;
  elementCode: string;
  elementTitle: string;
  prompt: string;
  answer: CorInterviewAnswer;
  comments: string | null;
  isRedFlag: boolean;
  sortOrder: number;
};

export type InterviewDetailView = InterviewListItem & {
  sampleSiteId: string | null;
  supervisorName: string | null;
  companyName: string | null;
  department: string | null;
  position: string | null;
  yearsInRole: number | null;
  directReports: number | null;
  summary: string | null;
  signatureDataUrl: string | null;
  naCount: number;
  responses: InterviewResponseView[];
};

export type InterviewDashboardView = {
  worker: { required: number; completed: number; remaining: number };
  manager: { required: number; completed: number; remaining: number };
  interviews: InterviewListItem[];
  sessions: { id: string; title: string; status: string }[];
};

export type ObservationListItem = {
  id: string;
  sessionId: string;
  category: CorObservationCategory;
  result: CorObservationResult;
  riskLevel: CorSampleRiskLevel | null;
  notes: string;
  locationLabel: string | null;
  observedAt: Date | null;
  sampleSiteId: string | null;
};

export type FieldAuditDashboard = {
  samplingPlans: number;
  selectedSites: number;
  recommendedSites: number;
  interviewsTotal: number;
  interviewsCompleted: number;
  interviewsWorker: number;
  interviewsManager: number;
  observationsTotal: number;
  observationsFail: number;
};

const RISK_WEIGHT: Record<CorSampleRiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 4,
  CRITICAL: 6,
};

function mapSite(row: Record<string, unknown>): SampleSiteView {
  return {
    id: row.id as string,
    planId: row.planId as string,
    siteName: row.siteName as string,
    projectNumber: (row.projectNumber as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    supervisorName: (row.supervisorName as string | null) ?? null,
    projectType: row.projectType as CorSampleProjectType,
    workerCount: Number(row.workerCount ?? 0),
    riskLevel: row.riskLevel as CorSampleRiskLevel,
    status: row.status as CorSampleSiteStatus,
    selectedForAudit: Boolean(row.selectedForAudit),
    recommended: Boolean(row.recommended),
    recommendationReason: (row.recommendationReason as string | null) ?? null,
  };
}

function mapPlan(row: Record<string, unknown>): SamplingPlanView {
  const sites = Array.isArray(row.sites)
    ? (row.sites as Record<string, unknown>[]).map(mapSite)
    : [];
  return {
    id: row.id as string,
    companyId: row.companyId as string,
    sessionId: (row.sessionId as string | null) ?? null,
    companyName: row.companyName as string,
    auditYear: Number(row.auditYear),
    employeeCount: Number(row.employeeCount ?? 0),
    activeSiteCount: Number(row.activeSiteCount ?? 0),
    notes: (row.notes as string | null) ?? null,
    sites,
  };
}

function mapInterviewList(row: Record<string, unknown>): InterviewListItem {
  return {
    id: row.id as string,
    sessionId: row.sessionId as string,
    type: row.type as CorInterviewType,
    status: row.status as CorInterviewStatus,
    subjectName: (row.subjectName as string | null) ?? null,
    siteLabel: (row.siteLabel as string | null) ?? null,
    trade: (row.trade as string | null) ?? null,
    conductedAt: (row.conductedAt as Date | null) ?? null,
    compliancePct:
      row.compliancePct == null ? null : Number(row.compliancePct),
    passCount: Number(row.passCount ?? 0),
    failCount: Number(row.failCount ?? 0),
    questionsAsked: Number(row.questionsAsked ?? 0),
  };
}

function interviewRequiredCounts(employeeCount: number, siteCount: number) {
  const n = Math.max(employeeCount, siteCount, 1);
  const worker = Math.max(2, Math.min(n, Math.ceil(Math.sqrt(n)) + 1));
  const manager = Math.max(1, Math.ceil(worker / 3));
  return { worker, manager };
}

async function assertPlanOwned(companyId: string, planId: string) {
  const plan = await prisma.corSiteSamplingPlan.findFirst({
    where: { id: planId, companyId, ...notDeleted },
  });
  return plan as Record<string, unknown> | null;
}

async function assertInterviewOwned(companyId: string, interviewId: string) {
  const interview = await prisma.corInterview.findFirst({
    where: { id: interviewId, ...notDeleted, session: { companyId } },
    include: { responses: { where: notDeleted, orderBy: { sortOrder: "asc" } } },
  });
  return interview as Record<string, unknown> | null;
}

async function resolveActiveSessionId(
  companyId: string,
  sessionId?: string | null,
): Promise<string | null> {
  if (sessionId) {
    const session = await prisma.corAuditSession.findFirst({
      where: { id: sessionId, companyId, ...notDeleted },
      select: { id: true },
    });
    return session?.id ?? null;
  }
  const latest = await prisma.corAuditSession.findFirst({
    where: {
      companyId,
      ...notDeleted,
      status: { in: ["DRAFT", "IN_PROGRESS", "SUBMITTED"] },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return latest?.id ?? null;
}

export function computeSampleTargetSize(
  sites: { riskLevel: CorSampleRiskLevel }[],
): number {
  const n = sites.length;
  if (n === 0) return 0;
  const highCritical = sites.filter(
    (s) => s.riskLevel === "HIGH" || s.riskLevel === "CRITICAL",
  ).length;
  return Math.max(2, Math.min(n, Math.ceil(Math.sqrt(n)) + highCritical));
}

export function recommendSampleSites<
  T extends {
    id: string;
    riskLevel: CorSampleRiskLevel;
    projectType: string;
    supervisorName: string | null;
    workerCount: number;
  },
>(sites: T[], targetSize?: number): { ids: string[]; reasons: Map<string, string> } {
  const target = targetSize ?? computeSampleTargetSize(sites);
  const reasons = new Map<string, string>();
  if (sites.length === 0 || target <= 0) return { ids: [], reasons };

  const remaining = [...sites].sort((a, b) => {
    const riskDiff = RISK_WEIGHT[b.riskLevel] - RISK_WEIGHT[a.riskLevel];
    if (riskDiff !== 0) return riskDiff;
    return b.workerCount - a.workerCount;
  });

  const selected: T[] = [];
  const usedTypes = new Set<string>();
  const usedSupervisors = new Set<string>();

  while (selected.length < target && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const site = remaining[i]!;
      let score =
        RISK_WEIGHT[site.riskLevel] * 10 + Math.min(site.workerCount, 50);
      if (!usedTypes.has(site.projectType)) score += 25;
      const supervisorKey = (site.supervisorName ?? "").trim().toLowerCase();
      if (supervisorKey && !usedSupervisors.has(supervisorKey)) score += 20;
      if (site.riskLevel === "HIGH" || site.riskLevel === "CRITICAL") score += 15;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    const pick = remaining.splice(bestIdx, 1)[0]!;
    selected.push(pick);
    usedTypes.add(pick.projectType);
    const supervisorKey = (pick.supervisorName ?? "").trim().toLowerCase();
    if (supervisorKey) usedSupervisors.add(supervisorKey);

    const bits: string[] = [];
    if (pick.riskLevel === "HIGH" || pick.riskLevel === "CRITICAL") {
      bits.push(`${pick.riskLevel} risk`);
    }
    bits.push(pick.projectType.replaceAll("_", " ").toLowerCase());
    if (pick.supervisorName) bits.push(`supervisor ${pick.supervisorName}`);
    if (pick.workerCount > 0) bits.push(`${pick.workerCount} workers`);
    reasons.set(pick.id, bits.join(" · "));
  }

  return { ids: selected.map((s) => s.id), reasons };
}

export async function getOrCreateSamplingPlan(
  companyId: string,
  input: {
    companyName?: string;
    auditYear?: number;
    employeeCount?: number;
    activeSiteCount?: number;
    notes?: string | null;
    sessionId?: string | null;
    createdById?: string | null;
  } = {},
): Promise<ServiceResult<SamplingPlanView>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const year = input.auditYear ?? new Date().getFullYear();
    const company = await prisma.company.findFirst({
      where: { id: companyId, ...notDeleted },
      select: { id: true, name: true },
    });
    if (!company) return unavailable("Company not found");

    let plan = await prisma.corSiteSamplingPlan.findFirst({
      where: { companyId, auditYear: year, ...notDeleted },
      include: { sites: { where: notDeleted, orderBy: { siteName: "asc" } } },
    });

    if (!plan) {
      plan = await prisma.corSiteSamplingPlan.create({
        data: {
          companyId,
          sessionId: input.sessionId ?? null,
          companyName: input.companyName?.trim() || company.name,
          auditYear: year,
          employeeCount: input.employeeCount ?? 0,
          activeSiteCount: input.activeSiteCount ?? 0,
          notes: input.notes ?? null,
          createdById: input.createdById ?? null,
        },
        include: { sites: { where: notDeleted, orderBy: { siteName: "asc" } } },
      });
    } else if (
      input.companyName != null ||
      input.employeeCount != null ||
      input.activeSiteCount != null ||
      input.notes !== undefined ||
      input.sessionId !== undefined
    ) {
      plan = await prisma.corSiteSamplingPlan.update({
        where: { id: plan.id },
        data: {
          ...(input.companyName != null
            ? { companyName: input.companyName.trim() || company.name }
            : {}),
          ...(input.employeeCount != null
            ? { employeeCount: input.employeeCount }
            : {}),
          ...(input.activeSiteCount != null
            ? { activeSiteCount: input.activeSiteCount }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.sessionId !== undefined
            ? { sessionId: input.sessionId }
            : {}),
        },
        include: { sites: { where: notDeleted, orderBy: { siteName: "asc" } } },
      });
    }

    return success(mapPlan(plan as Record<string, unknown>));
  } catch (error) {
    return failure(error);
  }
}

export async function listSamplingPlan(
  companyId: string,
  planId?: string,
): Promise<ServiceResult<SamplingPlanView | null>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const plan = planId
      ? await prisma.corSiteSamplingPlan.findFirst({
          where: { id: planId, companyId, ...notDeleted },
          include: {
            sites: { where: notDeleted, orderBy: { siteName: "asc" } },
          },
        })
      : await prisma.corSiteSamplingPlan.findFirst({
          where: { companyId, ...notDeleted },
          orderBy: [{ auditYear: "desc" }, { updatedAt: "desc" }],
          include: {
            sites: { where: notDeleted, orderBy: { siteName: "asc" } },
          },
        });

    if (!plan) return success(null);
    return success(mapPlan(plan as Record<string, unknown>));
  } catch (error) {
    return failure(error);
  }
}

export async function upsertSampleSite(
  companyId: string,
  input: {
    planId: string;
    siteId?: string;
    siteName: string;
    projectNumber?: string | null;
    address?: string | null;
    supervisorName?: string | null;
    projectType: CorSampleProjectType;
    workerCount?: number;
    riskLevel?: CorSampleRiskLevel;
    status?: CorSampleSiteStatus;
    selectedForAudit?: boolean;
    createdById?: string | null;
  },
): Promise<ServiceResult<SampleSiteView>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const plan = await assertPlanOwned(companyId, input.planId);
    if (!plan) return unavailable("Sampling plan not found");

    const siteName = input.siteName.trim();
    if (!siteName) return unavailable("Site name is required");

    const data = {
      siteName,
      projectNumber: input.projectNumber?.trim() || null,
      address: input.address?.trim() || null,
      supervisorName: input.supervisorName?.trim() || null,
      projectType: input.projectType,
      workerCount: input.workerCount ?? 0,
      riskLevel: input.riskLevel ?? "MEDIUM",
      status: input.status ?? "ACTIVE",
      ...(input.selectedForAudit != null
        ? { selectedForAudit: input.selectedForAudit }
        : {}),
    };

    let row: Record<string, unknown>;
    if (input.siteId) {
      const existing = await prisma.corSampleSite.findFirst({
        where: { id: input.siteId, planId: input.planId, ...notDeleted },
      });
      if (!existing) return unavailable("Sample site not found");
      row = await prisma.corSampleSite.update({
        where: { id: input.siteId },
        data,
      });
    } else {
      row = await prisma.corSampleSite.create({
        data: {
          planId: input.planId,
          ...data,
          createdById: input.createdById ?? null,
        },
      });
    }

    const siteCount = await prisma.corSampleSite.count({
      where: { planId: input.planId, ...notDeleted },
    });
    await prisma.corSiteSamplingPlan.update({
      where: { id: input.planId },
      data: { activeSiteCount: siteCount },
    });

    return success(mapSite(row));
  } catch (error) {
    return failure(error);
  }
}

export async function toggleSiteSelected(
  companyId: string,
  input: { siteId: string; selected: boolean },
): Promise<ServiceResult<SampleSiteView>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const site = await prisma.corSampleSite.findFirst({
      where: {
        id: input.siteId,
        ...notDeleted,
        plan: { companyId, ...notDeleted },
      },
    });
    if (!site) return unavailable("Sample site not found");

    const updated = await prisma.corSampleSite.update({
      where: { id: input.siteId },
      data: { selectedForAudit: input.selected },
    });
    return success(mapSite(updated as Record<string, unknown>));
  } catch (error) {
    return failure(error);
  }
}

export async function runSamplingRecommendations(
  planId: string,
  companyId?: string,
): Promise<ServiceResult<SamplingPlanView>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const plan = await prisma.corSiteSamplingPlan.findFirst({
      where: {
        id: planId,
        ...notDeleted,
        ...(companyId ? { companyId } : {}),
      },
      include: { sites: { where: notDeleted } },
    });
    if (!plan) return unavailable("Sampling plan not found");

    const sites = (plan.sites as Record<string, unknown>[]).map(mapSite);
    const { ids, reasons } = recommendSampleSites(sites);
    const selected = new Set(ids);

    await Promise.all(
      sites.map((site) =>
        prisma.corSampleSite.update({
          where: { id: site.id },
          data: {
            recommended: selected.has(site.id),
            selectedForAudit: selected.has(site.id),
            recommendationReason: selected.has(site.id)
              ? (reasons.get(site.id) ?? "Recommended for audit sample")
              : null,
          },
        }),
      ),
    );

    const refreshed = await prisma.corSiteSamplingPlan.findFirst({
      where: { id: planId, ...notDeleted },
      include: { sites: { where: notDeleted, orderBy: { siteName: "asc" } } },
    });
    return success(mapPlan(refreshed as Record<string, unknown>));
  } catch (error) {
    return failure(error);
  }
}

export async function ensureInterviewBankFromCorProgram(
  companyId: string,
): Promise<ServiceResult<{ created: number; total: number }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const ensured = await ensurePlatformCorProgram();
    if (!ensured.data) {
      return unavailable(ensured.error ?? "COR program unavailable");
    }

    const questions = await prisma.corQuestion.findMany({
      where: {
        requiresInterview: true,
        ...notDeleted,
        element: { programId: ensured.data.programId, ...notDeleted },
      },
      include: { element: true },
      orderBy: [{ sortOrder: "asc" }, { number: "asc" }],
    });

    const existing = await prisma.corInterviewBankQuestion.findMany({
      where: {
        companyId,
        ...notDeleted,
        isActive: true,
      },
      select: { interviewType: true, reference: true, prompt: true },
    });
    const existingKeys = new Set(
      (existing as { interviewType: string; reference: string | null }[]).map(
        (q) => `${q.interviewType}:${q.reference ?? ""}`,
      ),
    );

    let created = 0;
    const types: CorInterviewType[] = ["WORKER", "MANAGER"];
    for (const question of questions) {
      for (const interviewType of types) {
        const key = `${interviewType}:${question.number}`;
        if (existingKeys.has(key)) continue;

        const roleLabel =
          interviewType === "WORKER" ? "worker" : "manager/supervisor";
        await prisma.corInterviewBankQuestion.create({
          data: {
            companyId,
            interviewType,
            elementCode: question.element.code,
            elementTitle: question.element.title,
            prompt: `Ask the ${roleLabel}: ${question.description}`,
            reference: question.number,
            version: "1.0",
            category: question.element.code,
            scoringWeight: question.weight,
            isMandatory: true,
            isActive: true,
            sortOrder: question.sortOrder,
          },
        });
        created += 1;
        existingKeys.add(key);
      }
    }

    const total = await prisma.corInterviewBankQuestion.count({
      where: { companyId, ...notDeleted, isActive: true },
    });

    return success({ created, total });
  } catch (error) {
    return failure(error);
  }
}

export async function listInterviews(
  companyId: string,
  opts: { sessionId?: string; type?: CorInterviewType } = {},
): Promise<ServiceResult<InterviewListItem[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const items = await prisma.corInterview.findMany({
      where: {
        ...notDeleted,
        session: { companyId, ...notDeleted },
        ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
        ...(opts.type ? { type: opts.type } : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
    });
    return success(
      (items as Record<string, unknown>[]).map(mapInterviewList),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function createInterview(
  companyId: string,
  input: {
    type: CorInterviewType;
    sessionId?: string | null;
    sampleSiteId?: string | null;
    subjectName?: string | null;
    trade?: string | null;
    siteLabel?: string | null;
    supervisorName?: string | null;
    companyName?: string | null;
    department?: string | null;
    position?: string | null;
    yearsInRole?: number | null;
    directReports?: number | null;
    interviewerEmployeeId?: string | null;
    subjectEmployeeId?: string | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const sessionId = await resolveActiveSessionId(
      companyId,
      input.sessionId,
    );
    if (!sessionId) {
      return unavailable(
        "Start an internal audit session before creating interviews.",
      );
    }

    await ensureInterviewBankFromCorProgram(companyId);

    const bankQuestions = await prisma.corInterviewBankQuestion.findMany({
      where: {
        companyId,
        interviewType: input.type,
        isActive: true,
        isArchived: false,
        ...notDeleted,
      },
      orderBy: [{ elementCode: "asc" }, { sortOrder: "asc" }],
    });

    if ((bankQuestions as unknown[]).length === 0) {
      return unavailable("No interview bank questions available.");
    }

    const interview = await prisma.corInterview.create({
      data: {
        sessionId,
        sampleSiteId: input.sampleSiteId ?? null,
        type: input.type,
        status: "IN_PROGRESS",
        subjectEmployeeId: input.subjectEmployeeId ?? null,
        interviewerEmployeeId: input.interviewerEmployeeId ?? null,
        subjectName: input.subjectName?.trim() || null,
        trade: input.trade?.trim() || null,
        companyName: input.companyName?.trim() || null,
        supervisorName: input.supervisorName?.trim() || null,
        siteLabel: input.siteLabel?.trim() || null,
        department: input.department?.trim() || null,
        position: input.position?.trim() || null,
        yearsInRole: input.yearsInRole ?? null,
        directReports: input.directReports ?? null,
        scheduledAt: new Date(),
        createdById: input.createdById ?? null,
        responses: {
          create: (
            bankQuestions as {
              id: string;
              elementCode: string;
              elementTitle: string;
              prompt: string;
              reference: string | null;
              sortOrder: number;
            }[]
          ).map((q, index) => ({
            bankQuestionId: q.id,
            elementCode: q.elementCode,
            elementTitle: q.elementTitle,
            prompt: q.prompt,
            answer: "NOT_ASKED" as CorInterviewAnswer,
            sortOrder: q.sortOrder || index + 1,
            createdById: input.createdById ?? null,
          })),
        },
      },
    });

    return success({ id: interview.id as string });
  } catch (error) {
    return failure(error);
  }
}

export async function getInterviewDetail(
  companyId: string,
  interviewId: string,
): Promise<ServiceResult<InterviewDetailView>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const interview = await assertInterviewOwned(companyId, interviewId);
    if (!interview) return unavailable("Interview not found");

    const responses = (
      (interview.responses as Record<string, unknown>[]) ?? []
    ).map(
      (r): InterviewResponseView => ({
        id: r.id as string,
        bankQuestionId: (r.bankQuestionId as string | null) ?? null,
        corQuestionId: (r.corQuestionId as string | null) ?? null,
        elementCode: r.elementCode as string,
        elementTitle: r.elementTitle as string,
        prompt: r.prompt as string,
        answer: r.answer as CorInterviewAnswer,
        comments: (r.comments as string | null) ?? null,
        isRedFlag: Boolean(r.isRedFlag),
        sortOrder: Number(r.sortOrder ?? 0),
      }),
    );

    return success({
      ...mapInterviewList(interview),
      sampleSiteId: (interview.sampleSiteId as string | null) ?? null,
      supervisorName: (interview.supervisorName as string | null) ?? null,
      companyName: (interview.companyName as string | null) ?? null,
      department: (interview.department as string | null) ?? null,
      position: (interview.position as string | null) ?? null,
      yearsInRole:
        interview.yearsInRole == null
          ? null
          : Number(interview.yearsInRole),
      directReports:
        interview.directReports == null
          ? null
          : Number(interview.directReports),
      summary: (interview.summary as string | null) ?? null,
      signatureDataUrl: (interview.signatureDataUrl as string | null) ?? null,
      naCount: Number(interview.naCount ?? 0),
      responses,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function saveInterviewResponses(
  companyId: string,
  input: {
    interviewId: string;
    responses: {
      id: string;
      answer: CorInterviewAnswer;
      comments?: string | null;
      isRedFlag?: boolean;
    }[];
    summary?: string | null;
    signatureDataUrl?: string | null;
    subjectName?: string | null;
  },
): Promise<ServiceResult<{ ok: true }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const interview = await assertInterviewOwned(companyId, input.interviewId);
    if (!interview) return unavailable("Interview not found");

    for (const response of input.responses) {
      await prisma.corInterviewResponse.updateMany({
        where: {
          id: response.id,
          interviewId: input.interviewId,
          ...notDeleted,
        },
        data: {
          answer: response.answer,
          comments: response.comments ?? null,
          isRedFlag: response.isRedFlag ?? response.answer === "FAIL",
        },
      });
    }

    const refreshed = await prisma.corInterviewResponse.findMany({
      where: { interviewId: input.interviewId, ...notDeleted },
    });
    const rows = refreshed as { answer: CorInterviewAnswer }[];
    const passCount = rows.filter((r) => r.answer === "PASS").length;
    const failCount = rows.filter((r) => r.answer === "FAIL").length;
    const naCount = rows.filter((r) => r.answer === "NA").length;
    const asked = rows.filter((r) => r.answer !== "NOT_ASKED").length;
    const scored = passCount + failCount;
    const compliancePct =
      scored > 0 ? Math.round((passCount / scored) * 1000) / 10 : null;

    await prisma.corInterview.update({
      where: { id: input.interviewId },
      data: {
        passCount,
        failCount,
        naCount,
        questionsAsked: asked,
        compliancePct,
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.signatureDataUrl !== undefined
          ? { signatureDataUrl: input.signatureDataUrl }
          : {}),
        ...(input.subjectName !== undefined
          ? { subjectName: input.subjectName?.trim() || null }
          : {}),
        status:
          interview.status === "COMPLETED"
            ? "COMPLETED"
            : ("IN_PROGRESS" as CorInterviewStatus),
      },
    });

    return success({ ok: true });
  } catch (error) {
    return failure(error);
  }
}

export async function completeInterview(
  companyId: string,
  input: {
    interviewId: string;
    summary?: string | null;
    signatureDataUrl?: string | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<{ ok: true; capaCreated: number }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const interview = await assertInterviewOwned(companyId, input.interviewId);
    if (!interview) return unavailable("Interview not found");

    const responses = (interview.responses as Record<string, unknown>[]) ?? [];
    const passCount = responses.filter((r) => r.answer === "PASS").length;
    const failCount = responses.filter((r) => r.answer === "FAIL").length;
    const naCount = responses.filter((r) => r.answer === "NA").length;
    const asked = responses.filter((r) => r.answer !== "NOT_ASKED").length;
    const scored = passCount + failCount;
    const compliancePct =
      scored > 0 ? Math.round((passCount / scored) * 1000) / 10 : null;

    await prisma.corInterview.update({
      where: { id: input.interviewId },
      data: {
        status: "COMPLETED",
        conductedAt: new Date(),
        passCount,
        failCount,
        naCount,
        questionsAsked: asked,
        compliancePct,
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.signatureDataUrl !== undefined
          ? { signatureDataUrl: input.signatureDataUrl }
          : {}),
      },
    });

    let capaCreated = 0;
    const fails = responses.filter((r) => r.answer === "FAIL");
    for (const fail of fails) {
      const title = `Interview CAPA — ${fail.elementCode as string}`;
      const description =
        (fail.comments as string | null)?.trim() ||
        `Failed interview item: ${fail.prompt as string}`;
      await prisma.correctiveAction.create({
        data: {
          companyId,
          sessionId: interview.sessionId as string,
          questionId: (fail.corQuestionId as string | null) ?? null,
          title,
          description,
          priority: fail.isRedFlag ? "HIGH" : "MEDIUM",
          status: "OPEN",
          evidenceRequired:
            "Attach interview follow-up evidence showing the deficiency is corrected.",
          dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdById: input.createdById ?? null,
        },
      });
      capaCreated += 1;
    }

    return success({ ok: true, capaCreated });
  } catch (error) {
    return failure(error);
  }
}

export async function getInterviewDashboard(
  companyId: string,
): Promise<ServiceResult<InterviewDashboardView>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const [plan, interviews, sessions] = await Promise.all([
      listSamplingPlan(companyId),
      listInterviews(companyId),
      prisma.corAuditSession.findMany({
        where: {
          companyId,
          ...notDeleted,
          status: { in: ["DRAFT", "IN_PROGRESS", "SUBMITTED"] },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, status: true },
      }),
    ]);

    const employeeCount = plan.data?.employeeCount ?? 0;
    const siteCount =
      plan.data?.sites.filter((s) => s.selectedForAudit).length ||
      plan.data?.activeSiteCount ||
      0;
    const required = interviewRequiredCounts(employeeCount, siteCount);
    const items = interviews.data ?? [];

    const workerCompleted = items.filter(
      (i) => i.type === "WORKER" && i.status === "COMPLETED",
    ).length;
    const managerCompleted = items.filter(
      (i) => i.type === "MANAGER" && i.status === "COMPLETED",
    ).length;

    return success({
      worker: {
        required: required.worker,
        completed: workerCompleted,
        remaining: Math.max(0, required.worker - workerCompleted),
      },
      manager: {
        required: required.manager,
        completed: managerCompleted,
        remaining: Math.max(0, required.manager - managerCompleted),
      },
      interviews: items,
      sessions,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function listObservations(
  companyId: string,
  opts: { sessionId?: string } = {},
): Promise<ServiceResult<ObservationListItem[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const items = await prisma.corObservationNote.findMany({
      where: {
        ...notDeleted,
        session: { companyId, ...notDeleted },
        ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
      },
      orderBy: [{ observedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    return success(
      (items as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        sessionId: row.sessionId as string,
        category: row.category as CorObservationCategory,
        result: row.result as CorObservationResult,
        riskLevel: (row.riskLevel as CorSampleRiskLevel | null) ?? null,
        notes: row.notes as string,
        locationLabel: (row.locationLabel as string | null) ?? null,
        observedAt: (row.observedAt as Date | null) ?? null,
        sampleSiteId: (row.sampleSiteId as string | null) ?? null,
      })),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function createObservation(
  companyId: string,
  input: {
    sessionId?: string | null;
    sampleSiteId?: string | null;
    category: CorObservationCategory;
    result: CorObservationResult;
    notes: string;
    riskLevel?: CorSampleRiskLevel | null;
    locationLabel?: string | null;
    observerEmployeeId?: string | null;
    observedAt?: Date | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const notes = input.notes.trim();
    if (!notes) return unavailable("Observation notes are required");

    const sessionId = await resolveActiveSessionId(
      companyId,
      input.sessionId,
    );
    if (!sessionId) {
      return unavailable(
        "Start an internal audit session before logging worksite observations.",
      );
    }

    const row = await prisma.corObservationNote.create({
      data: {
        sessionId,
        sampleSiteId: input.sampleSiteId ?? null,
        observerEmployeeId: input.observerEmployeeId ?? null,
        category: input.category,
        result: input.result,
        riskLevel: input.riskLevel ?? null,
        notes,
        locationLabel: input.locationLabel?.trim() || null,
        observedAt: input.observedAt ?? new Date(),
        createdById: input.createdById ?? null,
      },
    });

    if (input.result === "FAIL") {
      await prisma.correctiveAction.create({
        data: {
          companyId,
          sessionId,
          title: `Observation CAPA — ${input.category}`,
          description: notes,
          priority:
            input.riskLevel === "CRITICAL" || input.riskLevel === "HIGH"
              ? "HIGH"
              : "MEDIUM",
          status: "OPEN",
          evidenceRequired:
            "Attach photos or follow-up notes proving the worksite deficiency is corrected.",
          dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdById: input.createdById ?? null,
        },
      });
    }

    return success({ id: row.id as string });
  } catch (error) {
    return failure(error);
  }
}

export async function getFieldAuditDashboard(
  companyId: string,
): Promise<ServiceResult<FieldAuditDashboard>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const [
      samplingPlans,
      selectedSites,
      recommendedSites,
      interviewsTotal,
      interviewsCompleted,
      interviewsWorker,
      interviewsManager,
      observationsTotal,
      observationsFail,
    ] = await Promise.all([
      prisma.corSiteSamplingPlan.count({
        where: { companyId, ...notDeleted },
      }),
      prisma.corSampleSite.count({
        where: {
          selectedForAudit: true,
          ...notDeleted,
          plan: { companyId, ...notDeleted },
        },
      }),
      prisma.corSampleSite.count({
        where: {
          recommended: true,
          ...notDeleted,
          plan: { companyId, ...notDeleted },
        },
      }),
      prisma.corInterview.count({
        where: { ...notDeleted, session: { companyId, ...notDeleted } },
      }),
      prisma.corInterview.count({
        where: {
          status: "COMPLETED",
          ...notDeleted,
          session: { companyId, ...notDeleted },
        },
      }),
      prisma.corInterview.count({
        where: {
          type: "WORKER",
          ...notDeleted,
          session: { companyId, ...notDeleted },
        },
      }),
      prisma.corInterview.count({
        where: {
          type: "MANAGER",
          ...notDeleted,
          session: { companyId, ...notDeleted },
        },
      }),
      prisma.corObservationNote.count({
        where: { ...notDeleted, session: { companyId, ...notDeleted } },
      }),
      prisma.corObservationNote.count({
        where: {
          result: "FAIL",
          ...notDeleted,
          session: { companyId, ...notDeleted },
        },
      }),
    ]);

    return success({
      samplingPlans,
      selectedSites,
      recommendedSites,
      interviewsTotal,
      interviewsCompleted,
      interviewsWorker,
      interviewsManager,
      observationsTotal,
      observationsFail,
    });
  } catch (error) {
    return failure(error);
  }
}
