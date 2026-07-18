import "server-only";

import { ASSESSMENT_RATING_SCORES } from "@/features/assessments/constants";
import {
  mapStoredStatusToDisplay,
} from "@/lib/training-matrix-status";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";
import { notDeleted } from "@/types";
import { fullName } from "@/utils/format";

import {
  failure,
  getDatabaseConfigError,
  success,
  unavailable,
} from "./base";

export type AnalyticsChartPoint = {
  label: string;
  value: number;
};

export type AnalyticsWorkerReassessment = {
  employeeId: string;
  name: string;
  trade: string | null;
  competencyCount: number;
  reason: string;
};

export type AnalyticsCompetencyStat = {
  competencyId: string;
  code: string;
  title: string;
  trade: string | null;
  assessmentCount: number;
  passCount: number;
  passRate: number;
  averageScore: number;
};

export type AnalyticsInstructorStat = {
  employeeId: string;
  name: string;
  assessmentCount: number;
  observationCount: number;
  demonstrationCount: number;
  totalActivity: number;
};

export type AnalyticsProjectCompletion = {
  projectId: string;
  code: string;
  name: string;
  completed: number;
  total: number;
  percentComplete: number;
};

export type AnalyticsRecentItem = {
  id: string;
  title: string;
  subtitle: string;
  occurredAt: Date;
  href: string;
};

export type AnalyticsUpcomingReassessment = {
  id: string;
  workerName: string;
  competencyTitle: string;
  dueAt: Date;
  source: "Assessment" | "Matrix";
};

export type AnalyticsDashboardData = {
  companyName: string;
  companyCompetencyPercent: number;
  workersRequiringReassessment: AnalyticsWorkerReassessment[];
  mostAssessedCompetencies: AnalyticsChartPoint[];
  lowestPassRateCompetencies: AnalyticsChartPoint[];
  averageScoreByTrade: AnalyticsChartPoint[];
  instructorActivity: AnalyticsChartPoint[];
  projectCompletion: AnalyticsChartPoint[];
  projectCompletionDetails: AnalyticsProjectCompletion[];
  recentObservations: AnalyticsRecentItem[];
  recentDemonstrations: AnalyticsRecentItem[];
  upcomingReassessments: AnalyticsUpcomingReassessment[];
  competencyStats: AnalyticsCompetencyStat[];
  instructorStats: AnalyticsInstructorStat[];
};

const COMPETENT_RATINGS = new Set([
  "COMPETENT",
  "EXCEEDS_STANDARD",
  "PASS",
]);

function scoreForRating(rating: string | null | undefined) {
  if (!rating) return null;
  return (
    ASSESSMENT_RATING_SCORES[
      rating as keyof typeof ASSESSMENT_RATING_SCORES
    ] ?? null
  );
}

function isPass(rating: string | null | undefined) {
  return rating != null && COMPETENT_RATINGS.has(rating);
}

export async function getAnalyticsDashboard(
  companyId: string,
): Promise<ServiceResult<AnalyticsDashboardData>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const now = new Date();
    const upcomingHorizon = new Date();
    upcomingHorizon.setDate(upcomingHorizon.getDate() + 60);

    const [
      company,
      results,
      matrixEntries,
      assessmentsByAssessor,
      observationsByObserver,
      demosByAssessor,
      recentObservations,
      recentDemos,
      projects,
      projectAssignments,
    ] = await Promise.all([
      prisma.company.findFirst({
        where: { id: companyId, ...notDeleted },
        select: { name: true },
      }),
      prisma.assessmentResult.findMany({
        where: {
          ...notDeleted,
          lockedAt: { not: null },
          assessment: { companyId, ...notDeleted },
        },
        include: {
          employee: { include: { user: true } },
          assessment: {
            include: {
              competency: {
                select: { id: true, code: true, title: true, trade: true },
              },
              assessor: { include: { user: true } },
              project: { select: { id: true, code: true, name: true } },
            },
          },
        },
        orderBy: { assessedAt: "desc" },
        take: 5000,
      }),
      prisma.trainingMatrixEntry.findMany({
        where: {
          ...notDeleted,
          employee: { companyId, ...notDeleted },
          competency: { companyId, ...notDeleted },
        },
        include: {
          employee: { include: { user: true } },
          competency: {
            select: { id: true, code: true, title: true, trade: true },
          },
        },
        take: 10000,
      }),
      prisma.assessment.groupBy({
        by: ["assessorId"],
        where: {
          companyId,
          ...notDeleted,
          assessorId: { not: null },
          type: { not: "PRACTICAL" },
        },
        _count: { _all: true },
      }),
      prisma.observation.groupBy({
        by: ["observerId"],
        where: { companyId, ...notDeleted },
        _count: { _all: true },
      }),
      prisma.assessment.groupBy({
        by: ["assessorId"],
        where: {
          companyId,
          ...notDeleted,
          assessorId: { not: null },
          type: "PRACTICAL",
        },
        _count: { _all: true },
      }),
      prisma.observation.findMany({
        where: { companyId, ...notDeleted },
        include: {
          employee: { include: { user: true } },
          observer: { include: { user: true } },
        },
        orderBy: { observedAt: "desc" },
        take: 8,
      }),
      prisma.assessment.findMany({
        where: {
          companyId,
          ...notDeleted,
          type: "PRACTICAL",
          status: "COMPLETED",
        },
        include: {
          results: {
            where: notDeleted,
            include: { employee: { include: { user: true } } },
            take: 1,
          },
          competency: { select: { code: true, title: true } },
        },
        orderBy: { completedAt: "desc" },
        take: 8,
      }),
      prisma.project.findMany({
        where: { companyId, ...notDeleted },
        select: { id: true, code: true, name: true },
        take: 100,
      }),
      prisma.projectAssignment.findMany({
        where: {
          ...notDeleted,
          project: { companyId, ...notDeleted },
        },
        select: { projectId: true, employeeId: true },
      }),
    ]);

    if (!company) return failure(new Error("Company not found."));

    // Competency stats from locked results
    const competencyMap = new Map<
      string,
      {
        code: string;
        title: string;
        trade: string | null;
        assessmentCount: number;
        passCount: number;
        scoreSum: number;
        scoreCount: number;
      }
    >();

    const tradeScoreMap = new Map<
      string,
      { scoreSum: number; scoreCount: number }
    >();

    for (const result of results) {
      const competency = result.assessment.competency;
      if (!competency) continue;

      const existing = competencyMap.get(competency.id) ?? {
        code: competency.code,
        title: competency.title,
        trade: competency.trade,
        assessmentCount: 0,
        passCount: 0,
        scoreSum: 0,
        scoreCount: 0,
      };
      existing.assessmentCount += 1;
      if (isPass(result.rating)) existing.passCount += 1;
      const score = scoreForRating(result.rating);
      if (score != null) {
        existing.scoreSum += score;
        existing.scoreCount += 1;
      }
      competencyMap.set(competency.id, existing);

      const trade =
        competency.trade?.trim() ||
        result.employee.trade?.trim() ||
        "Unspecified";
      if (score != null) {
        const tradeStat = tradeScoreMap.get(trade) ?? {
          scoreSum: 0,
          scoreCount: 0,
        };
        tradeStat.scoreSum += score;
        tradeStat.scoreCount += 1;
        tradeScoreMap.set(trade, tradeStat);
      }
    }

    const competencyStats: AnalyticsCompetencyStat[] = [
      ...competencyMap.entries(),
    ].map(([competencyId, stat]) => ({
      competencyId,
      code: stat.code,
      title: stat.title,
      trade: stat.trade,
      assessmentCount: stat.assessmentCount,
      passCount: stat.passCount,
      passRate:
        stat.assessmentCount > 0
          ? Math.round((stat.passCount / stat.assessmentCount) * 100)
          : 0,
      averageScore:
        stat.scoreCount > 0
          ? Number((stat.scoreSum / stat.scoreCount).toFixed(2))
          : 0,
    }));

    const mostAssessedCompetencies = [...competencyStats]
      .sort((a, b) => b.assessmentCount - a.assessmentCount)
      .slice(0, 8)
      .map((item) => ({
        label: item.code,
        value: item.assessmentCount,
      }));

    const lowestPassRateCompetencies = [...competencyStats]
      .filter((item) => item.assessmentCount >= 1)
      .sort((a, b) => a.passRate - b.passRate || b.assessmentCount - a.assessmentCount)
      .slice(0, 8)
      .map((item) => ({
        label: item.code,
        value: item.passRate,
      }));

    const averageScoreByTrade = [...tradeScoreMap.entries()]
      .map(([label, stat]) => ({
        label,
        value: Number((stat.scoreSum / stat.scoreCount).toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Workers requiring reassessment
    const reassessmentWorkers = new Map<
      string,
      { name: string; trade: string | null; competencies: Set<string> }
    >();

    for (const entry of matrixEntries) {
      const status = mapStoredStatusToDisplay(entry.status);
      if (status !== "NEEDS_REASSESSMENT") continue;
      const existing = reassessmentWorkers.get(entry.employeeId) ?? {
        name: fullName(entry.employee.user.firstName, entry.employee.user.lastName),
        trade: entry.employee.trade,
        competencies: new Set<string>(),
      };
      existing.competencies.add(entry.competencyId);
      reassessmentWorkers.set(entry.employeeId, existing);
    }

    for (const result of results) {
      if (result.validUntil && result.validUntil < now) {
        const existing = reassessmentWorkers.get(result.employeeId) ?? {
          name: fullName(
            result.employee.user.firstName,
            result.employee.user.lastName,
          ),
          trade: result.employee.trade,
          competencies: new Set<string>(),
        };
        if (result.assessment.competencyId) {
          existing.competencies.add(result.assessment.competencyId);
        }
        reassessmentWorkers.set(result.employeeId, existing);
      }
    }

    const workersRequiringReassessment: AnalyticsWorkerReassessment[] = [
      ...reassessmentWorkers.entries(),
    ]
      .map(([employeeId, value]) => ({
        employeeId,
        name: value.name,
        trade: value.trade,
        competencyCount: value.competencies.size,
        reason: "Needs reassessment",
      }))
      .sort((a, b) => b.competencyCount - a.competencyCount)
      .slice(0, 20);

    // Instructor activity
    const instructorIds = new Set<string>();
    for (const row of assessmentsByAssessor) {
      if (row.assessorId) instructorIds.add(row.assessorId);
    }
    for (const row of observationsByObserver) {
      instructorIds.add(row.observerId);
    }
    for (const row of demosByAssessor) {
      if (row.assessorId) instructorIds.add(row.assessorId);
    }

    const instructors = instructorIds.size
      ? await prisma.employee.findMany({
          where: {
            companyId,
            id: { in: [...instructorIds] },
            ...notDeleted,
          },
          include: { user: true },
        })
      : [];

    const assessmentCountMap = new Map(
      assessmentsByAssessor.map((row) => [
        row.assessorId!,
        row._count._all,
      ]),
    );
    const observationCountMap = new Map(
      observationsByObserver.map((row) => [
        row.observerId,
        row._count._all,
      ]),
    );
    const demoCountMap = new Map(
      demosByAssessor.map((row) => [row.assessorId!, row._count._all]),
    );

    const instructorStats: AnalyticsInstructorStat[] = instructors
      .map((instructor) => {
        const assessmentCount = assessmentCountMap.get(instructor.id) ?? 0;
        const observationCount = observationCountMap.get(instructor.id) ?? 0;
        const demonstrationCount = demoCountMap.get(instructor.id) ?? 0;
        return {
          employeeId: instructor.id,
          name: fullName(instructor.user.firstName, instructor.user.lastName),
          assessmentCount,
          observationCount,
          demonstrationCount,
          totalActivity:
            assessmentCount + observationCount + demonstrationCount,
        };
      })
      .sort((a, b) => b.totalActivity - a.totalActivity);

    const instructorActivity = instructorStats.slice(0, 8).map((item) => ({
      label: item.name.split(" ")[0] ?? item.name,
      value: item.totalActivity,
    }));

    // Company competency % and project completion from matrix
    let completedCells = 0;
    let totalCells = matrixEntries.length;
    for (const entry of matrixEntries) {
      const status = mapStoredStatusToDisplay(entry.status);
      if (status === "COMPETENT" || status === "VERIFIED") {
        completedCells += 1;
      }
    }

    // If no matrix entries, fall back to unique worker-competency results that passed
    if (totalCells === 0) {
      const passedPairs = new Set<string>();
      const allPairs = new Set<string>();
      for (const result of results) {
        if (!result.assessment.competencyId) continue;
        const key = `${result.employeeId}:${result.assessment.competencyId}`;
        allPairs.add(key);
        if (isPass(result.rating)) passedPairs.add(key);
      }
      totalCells = allPairs.size;
      completedCells = passedPairs.size;
    }

    const companyCompetencyPercent =
      totalCells > 0
        ? Math.round((completedCells / totalCells) * 100)
        : 0;

    const employeesByProject = new Map<string, Set<string>>();
    for (const assignment of projectAssignments) {
      const set = employeesByProject.get(assignment.projectId) ?? new Set();
      set.add(assignment.employeeId);
      employeesByProject.set(assignment.projectId, set);
    }

    const matrixByEmployee = new Map<string, typeof matrixEntries>();
    for (const entry of matrixEntries) {
      const list = matrixByEmployee.get(entry.employeeId) ?? [];
      list.push(entry);
      matrixByEmployee.set(entry.employeeId, list);
    }

    const projectCompletionDetails: AnalyticsProjectCompletion[] = projects
      .map((project) => {
        const workerIds = employeesByProject.get(project.id) ?? new Set();
        let completed = 0;
        let total = 0;
        for (const workerId of workerIds) {
          const entries = matrixByEmployee.get(workerId) ?? [];
          for (const entry of entries) {
            total += 1;
            const status = mapStoredStatusToDisplay(entry.status);
            if (status === "COMPETENT" || status === "VERIFIED") {
              completed += 1;
            }
          }
        }

        // Fallback: assessments on this project
        if (total === 0) {
          const projectResults = results.filter(
            (item) => item.assessment.projectId === project.id,
          );
          const pairs = new Map<string, boolean>();
          for (const result of projectResults) {
            if (!result.assessment.competencyId) continue;
            const key = `${result.employeeId}:${result.assessment.competencyId}`;
            pairs.set(key, isPass(result.rating) || pairs.get(key) === true);
          }
          total = pairs.size;
          completed = [...pairs.values()].filter(Boolean).length;
        }

        return {
          projectId: project.id,
          code: project.code,
          name: project.name,
          completed,
          total,
          percentComplete:
            total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.percentComplete - a.percentComplete);

    const projectCompletion = projectCompletionDetails
      .slice(0, 8)
      .map((item) => ({
        label: item.code,
        value: item.percentComplete,
      }));

    const upcomingReassessments: AnalyticsUpcomingReassessment[] = [];

    for (const result of results) {
      if (
        result.validUntil &&
        result.validUntil >= now &&
        result.validUntil <= upcomingHorizon &&
        result.assessment.competency
      ) {
        upcomingReassessments.push({
          id: result.id,
          workerName: fullName(
            result.employee.user.firstName,
            result.employee.user.lastName,
          ),
          competencyTitle: `${result.assessment.competency.code} · ${result.assessment.competency.title}`,
          dueAt: result.validUntil,
          source: "Assessment",
        });
      }
    }

    for (const entry of matrixEntries) {
      if (
        entry.dueDate &&
        entry.dueDate >= now &&
        entry.dueDate <= upcomingHorizon
      ) {
        const status = mapStoredStatusToDisplay(entry.status);
        if (
          status === "NEEDS_REASSESSMENT" ||
          status === "COMPETENT" ||
          status === "VERIFIED" ||
          status === "IN_PROGRESS"
        ) {
          upcomingReassessments.push({
            id: entry.id,
            workerName: fullName(
              entry.employee.user.firstName,
              entry.employee.user.lastName,
            ),
            competencyTitle: `${entry.competency.code} · ${entry.competency.title}`,
            dueAt: entry.dueDate,
            source: "Matrix",
          });
        }
      }
    }

    upcomingReassessments.sort(
      (a, b) => a.dueAt.getTime() - b.dueAt.getTime(),
    );

    const data: AnalyticsDashboardData = {
      companyName: company.name,
      companyCompetencyPercent,
      workersRequiringReassessment,
      mostAssessedCompetencies,
      lowestPassRateCompetencies,
      averageScoreByTrade,
      instructorActivity,
      projectCompletion,
      projectCompletionDetails,
      recentObservations: recentObservations.map((item) => ({
        id: item.id,
        title: fullName(item.employee.user.firstName, item.employee.user.lastName),
        subtitle: `${item.observationType.replaceAll("_", " ")} · ${fullName(item.observer.user.firstName, item.observer.user.lastName)}`,
        occurredAt: item.observedAt,
        href: `/observations/${item.id}`,
      })),
      recentDemonstrations: recentDemos.map((item) => {
        const worker = item.results[0]?.employee;
        return {
          id: item.id,
          title: worker
            ? fullName(worker.user.firstName, worker.user.lastName)
            : item.title,
          subtitle: item.competency
            ? `${item.competency.code} · ${item.competency.title}`
            : item.title,
          occurredAt: item.completedAt ?? item.createdAt,
          href: `/demonstrations/${item.id}`,
        };
      }),
      upcomingReassessments: upcomingReassessments.slice(0, 15),
      competencyStats,
      instructorStats,
    };

    return success(data);
  } catch (error) {
    return failure(error);
  }
}
