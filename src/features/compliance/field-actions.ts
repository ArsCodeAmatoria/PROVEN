"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import {
  completeInterview,
  createInterview,
  createObservation,
  ensureInterviewBankFromCorProgram,
  getOrCreateSamplingPlan,
  runSamplingRecommendations,
  saveInterviewResponses,
  toggleSiteSelected,
  upsertSampleSite,
  type CorInterviewAnswer,
  type CorInterviewType,
  type CorObservationCategory,
  type CorObservationResult,
  type CorSampleProjectType,
  type CorSampleRiskLevel,
} from "@/services/cor-field.service";

async function requireComplianceWrite() {
  await requirePermission("compliance");
  const profile = await requireAuth();
  if (!canWrite(profile.role)) {
    return {
      profile: null,
      companyId: null,
      error: "You do not have permission to edit compliance audits.",
    };
  }
  const { companyId } = await requireCompanyId();
  return { profile, companyId, error: null };
}

function revalidateFieldPaths(extra?: string[]) {
  revalidatePath("/compliance");
  revalidatePath("/compliance/site-sampling");
  revalidatePath("/compliance/interviews");
  revalidatePath("/compliance/observations");
  revalidatePath("/compliance/corrective-actions");
  for (const path of extra ?? []) {
    revalidatePath(path);
  }
}

export async function saveSamplingPlanAction(input: {
  companyName?: string;
  auditYear?: number;
  employeeCount?: number;
  activeSiteCount?: number;
  notes?: string | null;
  sessionId?: string | null;
}) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const result = await getOrCreateSamplingPlan(gate.companyId, {
    ...input,
    createdById: gate.profile.id,
  });
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to save sampling plan." };
  }

  revalidateFieldPaths();
  return { ok: true as const, planId: result.data.id };
}

export async function upsertSampleSiteAction(input: {
  planId: string;
  siteId?: string;
  siteName: string;
  projectNumber?: string | null;
  address?: string | null;
  supervisorName?: string | null;
  projectType: string;
  workerCount?: number;
  riskLevel?: string;
  selectedForAudit?: boolean;
}) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const result = await upsertSampleSite(gate.companyId, {
    planId: input.planId,
    siteId: input.siteId,
    siteName: input.siteName,
    projectNumber: input.projectNumber,
    address: input.address,
    supervisorName: input.supervisorName,
    projectType: input.projectType as CorSampleProjectType,
    workerCount: input.workerCount,
    riskLevel: input.riskLevel as CorSampleRiskLevel | undefined,
    selectedForAudit: input.selectedForAudit,
    createdById: gate.profile.id,
  });
  if (result.error) return { error: result.error };

  revalidateFieldPaths();
  return { ok: true as const };
}

export async function toggleSiteSelectedAction(input: {
  siteId: string;
  selected: boolean;
}) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const result = await toggleSiteSelected(gate.companyId, input);
  if (result.error) return { error: result.error };

  revalidateFieldPaths();
  return { ok: true as const };
}

export async function runSamplingRecommendationsAction(planId: string) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const result = await runSamplingRecommendations(planId, gate.companyId);
  if (result.error) return { error: result.error };

  revalidateFieldPaths();
  return { ok: true as const };
}

export async function ensureInterviewBankAction() {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const result = await ensureInterviewBankFromCorProgram(gate.companyId);
  if (result.error) return { error: result.error };

  revalidateFieldPaths();
  return { ok: true as const, ...result.data };
}

export async function createInterviewAction(input: {
  type: string;
  sessionId?: string | null;
  subjectName?: string | null;
  trade?: string | null;
  siteLabel?: string | null;
  supervisorName?: string | null;
}) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  if (input.type !== "WORKER" && input.type !== "MANAGER") {
    return { error: "Invalid interview type." };
  }

  const result = await createInterview(gate.companyId, {
    type: input.type as CorInterviewType,
    sessionId: input.sessionId,
    subjectName: input.subjectName,
    trade: input.trade,
    siteLabel: input.siteLabel,
    supervisorName: input.supervisorName,
    interviewerEmployeeId: gate.profile.employeeId ?? null,
    createdById: gate.profile.id,
  });
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create interview." };
  }

  revalidateFieldPaths([`/compliance/interviews/${result.data.id}`]);
  redirect(`/compliance/interviews/${result.data.id}`);
}

export async function createInterviewFormAction(formData: FormData) {
  const type = String(formData.get("type") ?? "WORKER");
  const sessionId = formData.get("sessionId");
  await createInterviewAction({
    type,
    sessionId: typeof sessionId === "string" && sessionId ? sessionId : null,
    subjectName: String(formData.get("subjectName") ?? "") || null,
    trade: String(formData.get("trade") ?? "") || null,
    siteLabel: String(formData.get("siteLabel") ?? "") || null,
    supervisorName: String(formData.get("supervisorName") ?? "") || null,
  });
}

export async function saveInterviewResponsesAction(input: {
  interviewId: string;
  responses: {
    id: string;
    answer: string;
    comments?: string | null;
    isRedFlag?: boolean;
  }[];
  summary?: string | null;
  signatureDataUrl?: string | null;
  subjectName?: string | null;
}) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const allowed: CorInterviewAnswer[] = ["PASS", "FAIL", "NA", "NOT_ASKED"];
  for (const response of input.responses) {
    if (!allowed.includes(response.answer as CorInterviewAnswer)) {
      return { error: "Invalid interview answer." };
    }
  }

  const result = await saveInterviewResponses(gate.companyId, {
    interviewId: input.interviewId,
    responses: input.responses.map((r) => ({
      id: r.id,
      answer: r.answer as CorInterviewAnswer,
      comments: r.comments,
      isRedFlag: r.isRedFlag,
    })),
    summary: input.summary,
    signatureDataUrl: input.signatureDataUrl,
    subjectName: input.subjectName,
  });
  if (result.error) return { error: result.error };

  revalidateFieldPaths([`/compliance/interviews/${input.interviewId}`]);
  return { ok: true as const };
}

export async function completeInterviewAction(input: {
  interviewId: string;
  summary?: string | null;
  signatureDataUrl?: string | null;
}) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const result = await completeInterview(gate.companyId, {
    interviewId: input.interviewId,
    summary: input.summary,
    signatureDataUrl: input.signatureDataUrl,
    createdById: gate.profile.id,
  });
  if (result.error) return { error: result.error };

  revalidateFieldPaths([`/compliance/interviews/${input.interviewId}`]);
  return { ok: true as const, capaCreated: result.data?.capaCreated ?? 0 };
}

export async function createObservationAction(input: {
  sessionId?: string | null;
  category: string;
  result: string;
  notes: string;
  riskLevel?: string | null;
  locationLabel?: string | null;
}) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const result = await createObservation(gate.companyId, {
    sessionId: input.sessionId,
    category: input.category as CorObservationCategory,
    result: input.result as CorObservationResult,
    notes: input.notes,
    riskLevel: (input.riskLevel as CorSampleRiskLevel | null) ?? null,
    locationLabel: input.locationLabel,
    observerEmployeeId: gate.profile.employeeId ?? null,
    createdById: gate.profile.id,
  });
  if (result.error) return { error: result.error };

  revalidateFieldPaths();
  return { ok: true as const, id: result.data?.id };
}
