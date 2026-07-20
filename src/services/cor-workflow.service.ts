import "server-only";

import { cache } from "react";

import type {
  CorrectiveActionPriority,
  CorrectiveActionStatus,
  CorQuestionStatus,
  FindingRiskLevel,
  FindingStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";
import { notDeleted } from "@/types";

import { failure, getDatabaseConfigError, success, unavailable } from "./base";

const PLATFORM_COR_CODE = "BCCSA-COR";

function stampDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function riskFromStatus(status: CorQuestionStatus): FindingRiskLevel {
  if (status === "FAIL") return "HIGH";
  if (status === "NEEDS_IMPROVEMENT") return "MEDIUM";
  return "MEDIUM";
}

function priorityFromRisk(risk: FindingRiskLevel): CorrectiveActionPriority {
  switch (risk) {
    case "CRITICAL":
      return "CRITICAL";
    case "HIGH":
      return "HIGH";
    case "LOW":
      return "LOW";
    default:
      return "MEDIUM";
  }
}

/**
 * Phase 1: Freeze Safety Program files into an immutable version and start
 * a new Internal COR audit linked to that freeze.
 */
export async function startInternalAuditWithFreeze(
  companyId: string,
  input: {
    createdById?: string | null;
    leadEmployeeId?: string | null;
    title?: string | null;
  } = {},
): Promise<
  ServiceResult<{ sessionId: string; versionId: string; documentCount: number }>
> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const program = await prisma.corProgram.findFirst({
      where: { companyId: null, code: PLATFORM_COR_CODE, ...notDeleted },
      select: { id: true },
    });
    if (!program) {
      return unavailable(
        "BCCSA COR program is not seeded yet. Open Compliance once to sync the question bank.",
      );
    }

    const docs = await prisma.document.findMany({
      where: {
        companyId,
        entityType: "COMPANY",
        deletedAt: null,
        supersededAt: null,
        OR: [
          { description: { startsWith: "RTO Safety Program 2025:" } },
          {
            folder: {
              OR: [
                { name: "Safety Program" },
                { parent: { name: "Safety Program", deletedAt: null } },
                {
                  parent: {
                    parent: { name: "Safety Program", deletedAt: null },
                    deletedAt: null,
                  },
                },
              ],
              deletedAt: null,
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        storagePath: true,
        url: true,
        mimeType: true,
        description: true,
      },
      orderBy: { title: "asc" },
    });

    const label = `Internal Audit ${stampDate()}`;
    const version = await prisma.safetyProgramVersion.create({
      data: {
        companyId,
        label: `Safety Program freeze — ${label}`,
        notes:
          "Immutable snapshot of Safety Program documents at internal audit start. Later file edits create new document versions and do not change this freeze.",
        documentCount: docs.length,
        frozenById: input.leadEmployeeId ?? null,
        createdById: input.createdById ?? null,
        documents: {
          create: docs.map((doc) => ({
            documentId: doc.id,
            title: doc.title,
            storagePath: doc.storagePath,
            url: doc.url,
            mimeType: doc.mimeType,
            relativePath:
              doc.description?.replace(/^RTO Safety Program 2025:\s*/, "") ??
              null,
          })),
        },
      },
    });

    const session = await prisma.corAuditSession.create({
      data: {
        companyId,
        programId: program.id,
        safetyProgramVersionId: version.id,
        type: "INTERNAL",
        status: "IN_PROGRESS",
        title: input.title?.trim() || label,
        startedAt: new Date(),
        leadEmployeeId: input.leadEmployeeId ?? null,
        createdById: input.createdById ?? null,
        notes: `Linked to frozen Safety Program version (${docs.length} documents).`,
      },
    });

    return success({
      sessionId: session.id,
      versionId: version.id,
      documentCount: docs.length,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function recalculateSessionScores(
  companyId: string,
  sessionId: string,
): Promise<ServiceResult<{ overallScore: number; predictedScore: number }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const session = await prisma.corAuditSession.findFirst({
      where: { id: sessionId, companyId, ...notDeleted },
      include: {
        responses: { where: notDeleted },
        program: {
          include: {
            elements: {
              where: notDeleted,
              include: { questions: { where: notDeleted } },
            },
          },
        },
      },
    });
    if (!session) return unavailable("Audit session not found");

    const byQuestion = new Map(
      session.responses.map((r) => [r.questionId, r] as const),
    );
    let maxPoints = 0;
    let earned = 0;
    let answeredWeight = 0;
    let answeredEarned = 0;

    for (const el of session.program.elements) {
      let elMax = 0;
      let elEarned = 0;
      for (const q of el.questions) {
        maxPoints += q.weight;
        elMax += q.weight;
        const response = byQuestion.get(q.id);
        if (!response || response.status === "NOT_STARTED") continue;
        if (response.status === "NOT_APPLICABLE") {
          maxPoints -= q.weight;
          elMax -= q.weight;
          continue;
        }
        answeredWeight += q.weight;
        let points = 0;
        if (response.status === "ADEQUATE") points = q.weight;
        else if (response.status === "NEEDS_IMPROVEMENT") points = q.weight * 0.5;
        earned += points;
        elEarned += points;
        answeredEarned += points;
      }

      await prisma.corScoreRollup.upsert({
        where: {
          sessionId_elementId: { sessionId, elementId: el.id },
        },
        create: {
          sessionId,
          elementId: el.id,
          maxPoints: elMax,
          earnedPoints: elEarned,
          scorePct: elMax > 0 ? (elEarned / elMax) * 100 : null,
        },
        update: {
          maxPoints: elMax,
          earnedPoints: elEarned,
          scorePct: elMax > 0 ? (elEarned / elMax) * 100 : null,
          deletedAt: null,
        },
      });
    }

    const overallScore = maxPoints > 0 ? (earned / maxPoints) * 100 : 0;
    const predictedScore =
      answeredWeight > 0 ? (answeredEarned / answeredWeight) * 100 : overallScore;

    await prisma.corAuditSession.update({
      where: { id: sessionId },
      data: { overallScore, predictedScore },
    });

    return success({ overallScore, predictedScore });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Phase 3–4: Open/close finding + corrective action when result is inadequate.
 */
export async function syncFindingAndCorrectiveAction(
  companyId: string,
  input: {
    sessionId: string;
    questionId: string;
    status: CorQuestionStatus;
    comments?: string | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<{ findingId: string | null; actionId: string | null }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const question = await prisma.corQuestion.findFirst({
      where: { id: input.questionId, ...notDeleted },
      include: { element: true },
    });
    if (!question) return unavailable("Question not found");

    const shouldOpen =
      input.status === "FAIL" || input.status === "NEEDS_IMPROVEMENT";

    const existing = await prisma.corFinding.findFirst({
      where: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        ...notDeleted,
      },
      include: { correctiveAction: true },
    });

    if (!shouldOpen) {
      if (existing && existing.status !== "CLOSED") {
        await prisma.corFinding.update({
          where: { id: existing.id },
          data: { status: "CLOSED" },
        });
        if (
          existing.correctiveAction &&
          existing.correctiveAction.status !== "VERIFIED" &&
          existing.correctiveAction.status !== "CANCELLED"
        ) {
          await prisma.correctiveAction.update({
            where: { id: existing.correctiveAction.id },
            data: { status: "CANCELLED", completionPct: 100 },
          });
          await prisma.correctiveActionEvent.create({
            data: {
              correctiveActionId: existing.correctiveAction.id,
              message: "Cancelled — audit question marked adequate / N/A.",
              createdById: input.createdById ?? null,
            },
          });
        }
      }
      return success({ findingId: null, actionId: null });
    }

    const risk = riskFromStatus(input.status);
    const description =
      input.comments?.trim() ||
      `Inadequate / needs improvement on ${question.number}: ${question.description}`;

    let finding = existing;
    if (!finding) {
      const count = await prisma.corFinding.count({
        where: { sessionId: input.sessionId },
      });
      finding = await prisma.corFinding.create({
        data: {
          companyId,
          sessionId: input.sessionId,
          questionId: input.questionId,
          findingNumber: `F-${String(count + 1).padStart(3, "0")}`,
          elementCode: question.element.code,
          questionNumber: question.number,
          description,
          riskLevel: risk,
          auditorNotes: input.comments ?? null,
          recommendation:
            "Implement corrective action, attach evidence, and verify before closing.",
          status: "OPEN",
          createdById: input.createdById ?? null,
        },
        include: { correctiveAction: true },
      });
    } else {
      finding = await prisma.corFinding.update({
        where: { id: finding.id },
        data: {
          description,
          riskLevel: risk,
          auditorNotes: input.comments ?? null,
          status: finding.status === "CLOSED" ? "OPEN" : finding.status,
          deletedAt: null,
        },
        include: { correctiveAction: true },
      });
    }

    let action = finding.correctiveAction;
    if (!action || action.deletedAt) {
      action = await prisma.correctiveAction.create({
        data: {
          companyId,
          sessionId: input.sessionId,
          questionId: input.questionId,
          findingId: finding.id,
          title: `CAPA ${finding.findingNumber} — ${question.number}`,
          description,
          priority: priorityFromRisk(risk),
          status: "OPEN",
          evidenceRequired:
            "Upload documents, photos, inspections, meeting minutes, toolbox talks, and/or training records proving the deficiency is corrected.",
          dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdById: input.createdById ?? null,
        },
      });
      await prisma.correctiveActionEvent.create({
        data: {
          correctiveActionId: action.id,
          message: "Corrective action created automatically from audit finding.",
          createdById: input.createdById ?? null,
        },
      });
    } else if (action.status === "CANCELLED") {
      action = await prisma.correctiveAction.update({
        where: { id: action.id },
        data: {
          status: "OPEN",
          description,
          priority: priorityFromRisk(risk),
          completionPct: 0,
          deletedAt: null,
        },
      });
    }

    return success({ findingId: finding.id, actionId: action.id });
  } catch (error) {
    return failure(error);
  }
}

export type AuditProgressView = {
  totalQuestions: number;
  answered: number;
  adequate: number;
  inadequate: number;
  notApplicable: number;
  evidenceCount: number;
  missingEvidence: number;
  openFindings: number;
  overallScore: number | null;
  predictedScore: number | null;
  freezeLabel: string | null;
  freezeDocumentCount: number;
};

export const getAuditProgress = cache(async (
  companyId: string,
  sessionId: string,
): Promise<ServiceResult<AuditProgressView>> => {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const session = await prisma.corAuditSession.findFirst({
      where: { id: sessionId, companyId, ...notDeleted },
      include: {
        safetyProgramVersion: true,
        responses: { where: notDeleted },
        evidenceLinks: { where: notDeleted },
        findings: { where: { ...notDeleted, status: { not: "CLOSED" } } },
        program: {
          include: {
            elements: {
              where: notDeleted,
              include: { questions: { where: notDeleted } },
            },
          },
        },
      },
    });
    if (!session) return unavailable("Audit session not found");

    const questions = session.program.elements.flatMap((e) => e.questions);
    const byQ = new Map(session.responses.map((r) => [r.questionId, r]));
    let answered = 0;
    let adequate = 0;
    let inadequate = 0;
    let notApplicable = 0;
    let missingEvidence = 0;
    const evidenceByQ = new Map<string, number>();
    for (const link of session.evidenceLinks) {
      evidenceByQ.set(
        link.questionId,
        (evidenceByQ.get(link.questionId) ?? 0) + 1,
      );
    }

    for (const q of questions) {
      const r = byQ.get(q.id);
      if (!r || r.status === "NOT_STARTED") {
        missingEvidence += 1;
        continue;
      }
      answered += 1;
      if (r.status === "ADEQUATE") adequate += 1;
      else if (r.status === "NOT_APPLICABLE") notApplicable += 1;
      else if (r.status === "FAIL" || r.status === "NEEDS_IMPROVEMENT") {
        inadequate += 1;
      }
      const needsDoc = q.requiresDocumentation;
      const hasEv = (evidenceByQ.get(q.id) ?? 0) > 0 || !!r.comments;
      if (needsDoc && !hasEv && r.status !== "NOT_APPLICABLE") {
        missingEvidence += 1;
      }
    }

    return success({
      totalQuestions: questions.length,
      answered,
      adequate,
      inadequate,
      notApplicable,
      evidenceCount: session.evidenceLinks.length,
      missingEvidence,
      openFindings: session.findings.length,
      overallScore: session.overallScore,
      predictedScore: session.predictedScore,
      freezeLabel: session.safetyProgramVersion?.label ?? null,
      freezeDocumentCount: session.safetyProgramVersion?.documentCount ?? 0,
    });
  } catch (error) {
    return failure(error);
  }
});

export type CapDashView = {
  openFindings: number;
  overdueActions: number;
  dueThisWeek: number;
  highRiskFindings: number;
  completedActions: number;
  avgClosureDays: number | null;
  auditReadinessPct: number | null;
  corScoreProjection: number | null;
  findingsByElement: { element: string; count: number }[];
  actionsByStatus: { status: string; count: number }[];
};

export async function getCorrectiveActionDashboard(
  companyId: string,
): Promise<ServiceResult<CapDashView>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [findings, actions, sessions] = await Promise.all([
      prisma.corFinding.findMany({
        where: { companyId, ...notDeleted },
        select: {
          elementCode: true,
          riskLevel: true,
          status: true,
        },
      }),
      prisma.correctiveAction.findMany({
        where: { companyId, ...notDeleted },
        select: {
          status: true,
          dueAt: true,
          createdAt: true,
          completedAt: true,
          verifiedAt: true,
        },
      }),
      prisma.corAuditSession.findMany({
        where: {
          companyId,
          type: "INTERNAL",
          status: { in: ["IN_PROGRESS", "COMPLETED", "SUBMITTED"] },
          ...notDeleted,
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { overallScore: true, predictedScore: true, readinessPct: true },
      }),
    ]);

    const openFindings = findings.filter((f) => f.status !== "CLOSED").length;
    const highRiskFindings = findings.filter(
      (f) =>
        f.status !== "CLOSED" &&
        (f.riskLevel === "HIGH" || f.riskLevel === "CRITICAL"),
    ).length;

    const overdueActions = actions.filter(
      (a) =>
        a.dueAt &&
        a.dueAt < now &&
        !["VERIFIED", "CANCELLED", "COMPLETED"].includes(a.status),
    ).length;
    const dueThisWeek = actions.filter(
      (a) =>
        a.dueAt &&
        a.dueAt >= now &&
        a.dueAt <= week &&
        !["VERIFIED", "CANCELLED"].includes(a.status),
    ).length;
    const completedActions = actions.filter((a) =>
      ["COMPLETED", "VERIFIED"].includes(a.status),
    ).length;

    const closures = actions.filter((a) => a.verifiedAt || a.completedAt);
    const avgClosureDays =
      closures.length === 0
        ? null
        : closures.reduce((sum, a) => {
            const end = (a.verifiedAt ?? a.completedAt)!.getTime();
            return sum + (end - a.createdAt.getTime()) / (24 * 60 * 60 * 1000);
          }, 0) / closures.length;

    const byElement = new Map<string, number>();
    for (const f of findings.filter((x) => x.status !== "CLOSED")) {
      byElement.set(f.elementCode, (byElement.get(f.elementCode) ?? 0) + 1);
    }
    const byStatus = new Map<string, number>();
    for (const a of actions) {
      byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
    }

    const latest = sessions[0];
    return success({
      openFindings,
      overdueActions,
      dueThisWeek,
      highRiskFindings,
      completedActions,
      avgClosureDays,
      auditReadinessPct: latest?.readinessPct ?? null,
      corScoreProjection: latest?.predictedScore ?? latest?.overallScore ?? null,
      findingsByElement: [...byElement.entries()]
        .map(([element, count]) => ({ element, count }))
        .sort((a, b) => a.element.localeCompare(b.element)),
      actionsByStatus: [...byStatus.entries()].map(([status, count]) => ({
        status,
        count,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}

export type ReadinessBreakdown = {
  readinessPct: number;
  band: "ready" | "needs_improvement" | "not_ready";
  documentation: number;
  interviews: number;
  training: number;
  inspections: number;
  toolboxTalks: number;
  orientation: number;
  correctiveActions: number;
  safetyMeetings: number;
  equipmentInspections: number;
  incidentManagement: number;
  gate: ExternalAuditGate;
};

export type ExternalAuditGate = {
  ready: boolean;
  noCriticalFindings: boolean;
  highRiskClosed: boolean;
  evidenceComplete: boolean;
  interviewsComplete: boolean;
  correctiveActionsVerified: boolean;
  managementReviewComplete: boolean;
  internalAuditSignedOff: boolean;
  blockers: string[];
};

export const getExternalAuditGate = cache(async (
  companyId: string,
  sessionId?: string | null,
): Promise<ServiceResult<ExternalAuditGate>> => {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const session = sessionId
      ? await prisma.corAuditSession.findFirst({
          where: { id: sessionId, companyId, ...notDeleted },
        })
      : await prisma.corAuditSession.findFirst({
          where: {
            companyId,
            type: "INTERNAL",
            ...notDeleted,
          },
          orderBy: { updatedAt: "desc" },
        });

    if (!session) {
      return success({
        ready: false,
        noCriticalFindings: false,
        highRiskClosed: false,
        evidenceComplete: false,
        interviewsComplete: false,
        correctiveActionsVerified: false,
        managementReviewComplete: false,
        internalAuditSignedOff: false,
        blockers: ["No internal audit session found."],
      });
    }

    const [findings, actions, interviews, progress, review] = await Promise.all([
      prisma.corFinding.findMany({
        where: { sessionId: session.id, ...notDeleted },
      }),
      prisma.correctiveAction.findMany({
        where: { sessionId: session.id, ...notDeleted },
      }),
      prisma.corInterview.count({
        where: { sessionId: session.id, ...notDeleted },
      }),
      getAuditProgress(companyId, session.id),
      prisma.corManagementReview.findFirst({
        where: { sessionId: session.id, ...notDeleted },
      }),
    ]);

    const openCritical = findings.some(
      (f) => f.status !== "CLOSED" && f.riskLevel === "CRITICAL",
    );
    const openHigh = findings.some(
      (f) => f.status !== "CLOSED" && f.riskLevel === "HIGH",
    );
    const unverified = actions.filter(
      (a) => a.status !== "VERIFIED" && a.status !== "CANCELLED",
    );
    const progressData = progress.data;
    const evidenceComplete =
      !!progressData && progressData.missingEvidence === 0;
    const interviewsComplete =
      interviews > 0 ||
      (!!progressData && progressData.answered === progressData.totalQuestions);
    const managementReviewComplete = review?.status === "COMPLETED";
    const internalAuditSignedOff = !!session.signedOffAt;

    const blockers: string[] = [];
    if (openCritical) blockers.push("Critical findings remain open.");
    if (openHigh) blockers.push("High-risk findings remain open.");
    if (!evidenceComplete) blockers.push("Required evidence is incomplete.");
    if (!interviewsComplete) blockers.push("Required interviews are incomplete.");
    if (unverified.length > 0) {
      blockers.push(`${unverified.length} corrective action(s) not verified.`);
    }
    if (!managementReviewComplete) {
      blockers.push("Management review is not completed.");
    }
    if (!internalAuditSignedOff) {
      blockers.push("Internal audit is not signed off.");
    }

    return success({
      ready: blockers.length === 0,
      noCriticalFindings: !openCritical,
      highRiskClosed: !openHigh,
      evidenceComplete,
      interviewsComplete,
      correctiveActionsVerified: unverified.length === 0,
      managementReviewComplete,
      internalAuditSignedOff,
      blockers,
    });
  } catch (error) {
    return failure(error);
  }
});

export const getAuditReadinessBreakdown = cache(async (
  companyId: string,
): Promise<ServiceResult<ReadinessBreakdown>> => {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const gateResult = await getExternalAuditGate(companyId);
    if (!gateResult.data) {
      return unavailable(gateResult.error ?? "Unable to compute readiness");
    }
    const gate = gateResult.data;

    const session = await prisma.corAuditSession.findFirst({
      where: { companyId, type: "INTERNAL", ...notDeleted },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    const progress = session
      ? await getAuditProgress(companyId, session.id)
      : null;
    const dash = await getCorrectiveActionDashboard(companyId);

    const answeredPct =
      progress?.data && progress.data.totalQuestions > 0
        ? (progress.data.answered / progress.data.totalQuestions) * 100
        : 0;
    const evidencePct =
      progress?.data && progress.data.totalQuestions > 0
        ? Math.max(
            0,
            100 -
              (progress.data.missingEvidence / progress.data.totalQuestions) *
                100,
          )
        : 0;
    const capaPct =
      dash.data &&
      dash.data.openFindings + dash.data.completedActions > 0
        ? (dash.data.completedActions /
            (dash.data.openFindings + dash.data.completedActions)) *
          100
        : gate.correctiveActionsVerified
          ? 100
          : 40;

    // HSMS adapters not fully built — use audit-derived proxies for MVP.
    const documentation = evidencePct;
    const interviews = gate.interviewsComplete ? 90 : answeredPct * 0.5;
    const training = Math.min(100, answeredPct);
    const inspections = Math.min(100, evidencePct * 0.8);
    const toolboxTalks = Math.min(100, evidencePct * 0.7);
    const orientation = Math.min(100, answeredPct * 0.85);
    const correctiveActions = capaPct;
    const safetyMeetings = gate.managementReviewComplete ? 100 : 35;
    const equipmentInspections = inspections;
    const incidentManagement = dash.data?.highRiskFindings
      ? Math.max(20, 100 - dash.data.highRiskFindings * 15)
      : 75;

    const parts = [
      documentation,
      interviews,
      training,
      inspections,
      toolboxTalks,
      orientation,
      correctiveActions,
      safetyMeetings,
      equipmentInspections,
      incidentManagement,
    ];
    const readinessPct =
      parts.reduce((a, b) => a + b, 0) / Math.max(parts.length, 1);
    const band =
      readinessPct >= 85
        ? "ready"
        : readinessPct >= 65
          ? "needs_improvement"
          : "not_ready";

    return success({
      readinessPct,
      band,
      documentation,
      interviews,
      training,
      inspections,
      toolboxTalks,
      orientation,
      correctiveActions,
      safetyMeetings,
      equipmentInspections,
      incidentManagement,
      gate,
    });
  } catch (error) {
    return failure(error);
  }
});

export async function markCorrectiveActionComplete(
  companyId: string,
  actionId: string,
  input: { createdById?: string | null; completionPct?: number },
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const action = await prisma.correctiveAction.findFirst({
      where: { id: actionId, companyId, ...notDeleted },
    });
    if (!action) return unavailable("Corrective action not found");

    await prisma.correctiveAction.update({
      where: { id: actionId },
      data: {
        status: "PENDING_VERIFICATION",
        completionPct: input.completionPct ?? 100,
        completedAt: new Date(),
      },
    });
    await prisma.correctiveActionEvent.create({
      data: {
        correctiveActionId: actionId,
        message: "Marked complete — pending verification.",
        createdById: input.createdById ?? null,
      },
    });
    if (action.findingId) {
      await prisma.corFinding.update({
        where: { id: action.findingId },
        data: { status: "PENDING_VERIFICATION" satisfies FindingStatus },
      });
    }
    return success({ id: actionId });
  } catch (error) {
    return failure(error);
  }
}

export async function verifyCorrectiveAction(
  companyId: string,
  actionId: string,
  input: {
    verifiedById?: string | null;
    createdById?: string | null;
    evidenceReviewed: boolean;
    deficiencyCorrected: boolean;
    workersInformed: boolean;
    trainingCompleted: boolean;
    documentsUpdated: boolean;
    siteInspected: boolean;
    notes?: string | null;
    approve: boolean;
  },
): Promise<ServiceResult<{ id: string; status: CorrectiveActionStatus }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const action = await prisma.correctiveAction.findFirst({
      where: { id: actionId, companyId, ...notDeleted },
    });
    if (!action) return unavailable("Corrective action not found");

    if (input.approve) {
      const checklistOk =
        input.evidenceReviewed &&
        input.deficiencyCorrected &&
        input.workersInformed &&
        input.trainingCompleted &&
        input.documentsUpdated;
      if (!checklistOk) {
        return unavailable(
          "All required verification checks must be confirmed before closing.",
        );
      }
      await prisma.correctiveAction.update({
        where: { id: actionId },
        data: {
          status: "VERIFIED",
          evidenceReviewed: true,
          deficiencyCorrected: true,
          workersInformed: true,
          trainingCompleted: true,
          documentsUpdated: true,
          siteInspected: input.siteInspected,
          verificationNotes: input.notes ?? null,
          verifiedAt: new Date(),
          verifiedById: input.verifiedById ?? null,
          completionPct: 100,
        },
      });
      await prisma.correctiveActionEvent.create({
        data: {
          correctiveActionId: actionId,
          message: "Verified and closed.",
          createdById: input.createdById ?? null,
        },
      });
      if (action.findingId) {
        await prisma.corFinding.update({
          where: { id: action.findingId },
          data: { status: "CLOSED" },
        });
      }
      return success({ id: actionId, status: "VERIFIED" });
    }

    await prisma.correctiveAction.update({
      where: { id: actionId },
      data: {
        status: "IN_PROGRESS",
        evidenceReviewed: input.evidenceReviewed,
        deficiencyCorrected: input.deficiencyCorrected,
        workersInformed: input.workersInformed,
        trainingCompleted: input.trainingCompleted,
        documentsUpdated: input.documentsUpdated,
        siteInspected: input.siteInspected,
        verificationNotes: input.notes ?? null,
        completionPct: Math.min(action.completionPct, 90),
      },
    });
    await prisma.correctiveActionEvent.create({
      data: {
        correctiveActionId: actionId,
        message: "Returned to In Progress after verification review.",
        createdById: input.createdById ?? null,
      },
    });
    if (action.findingId) {
      await prisma.corFinding.update({
        where: { id: action.findingId },
        data: { status: "IN_PROGRESS" },
      });
    }
    return success({ id: actionId, status: "IN_PROGRESS" });
  } catch (error) {
    return failure(error);
  }
}

export async function ensureManagementReview(
  companyId: string,
  sessionId: string,
  createdById?: string | null,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const session = await prisma.corAuditSession.findFirst({
      where: { id: sessionId, companyId, ...notDeleted },
    });
    if (!session) return unavailable("Audit session not found");

    const existing = await prisma.corManagementReview.findFirst({
      where: { sessionId, ...notDeleted },
    });
    if (existing) return success({ id: existing.id });

    const scores = await recalculateSessionScores(companyId, sessionId);
    const findings = await prisma.corFinding.findMany({
      where: { sessionId, ...notDeleted, status: { not: "CLOSED" } },
    });

    const review = await prisma.corManagementReview.create({
      data: {
        companyId,
        sessionId,
        status: "DRAFT",
        agendaNotes: [
          "Review audit score",
          "Review findings",
          "Review trends",
          "Review high-risk items",
          "Assign responsibilities",
          "Approve corrective actions",
          "Allocate resources",
          "Set completion dates",
        ].join("\n"),
        scoreSummary: scores.data
          ? `Overall ${Math.round(scores.data.overallScore)}% · Predicted ${Math.round(scores.data.predictedScore)}%`
          : null,
        findingsSummary: `${findings.length} open finding(s)`,
        createdById: createdById ?? null,
      },
    });

    return success({ id: review.id });
  } catch (error) {
    return failure(error);
  }
}

export async function completeManagementReview(
  companyId: string,
  reviewId: string,
  input: {
    decisions?: string | null;
    resourcesNotes?: string | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const review = await prisma.corManagementReview.findFirst({
      where: { id: reviewId, companyId, ...notDeleted },
    });
    if (!review) return unavailable("Management review not found");

    await prisma.corManagementReview.update({
      where: { id: reviewId },
      data: {
        status: "COMPLETED",
        decisions: input.decisions ?? review.decisions,
        resourcesNotes: input.resourcesNotes ?? review.resourcesNotes,
        completedAt: new Date(),
      },
    });

    return success({ id: reviewId });
  } catch (error) {
    return failure(error);
  }
}

export async function signOffInternalAudit(
  companyId: string,
  sessionId: string,
  signedOffById?: string | null,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const session = await prisma.corAuditSession.findFirst({
      where: { id: sessionId, companyId, ...notDeleted },
    });
    if (!session) return unavailable("Audit session not found");

    await recalculateSessionScores(companyId, sessionId);
    await prisma.corAuditSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: session.completedAt ?? new Date(),
        signedOffAt: new Date(),
        signedOffById: signedOffById ?? null,
      },
    });

    return success({ id: sessionId });
  } catch (error) {
    return failure(error);
  }
}

export async function markExternalAuditReady(
  companyId: string,
  sessionId: string,
): Promise<ServiceResult<{ id: string; ready: boolean }>> {
  const gate = await getExternalAuditGate(companyId, sessionId);
  if (!gate.data) return unavailable(gate.error ?? "Unable to evaluate gate");
  if (!gate.data.ready) {
    return unavailable(gate.data.blockers.join(" "));
  }

  await prisma.corAuditSession.update({
    where: { id: sessionId },
    data: { externalReadyAt: new Date(), status: "SUBMITTED" },
  });

  return success({ id: sessionId, ready: true });
}
