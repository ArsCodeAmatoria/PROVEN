import "server-only";

import {
  AssessmentOutcome,
  ApprenticeshipStatus,
  CertificationStatus,
  CompetencyStatus,
  ExamStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DashboardMetrics, ServiceResult } from "@/types";

import { failure, getDatabaseConfigError, success, unavailable } from "./base";

export async function getDashboardMetrics(
  companyId: string,
): Promise<ServiceResult<DashboardMetrics>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      activeCompetencies,
      openAssessments,
      activeApprenticeships,
      expiringCertifications,
      recentObservations,
      publishedExams,
    ] = await Promise.all([
      prisma.competency.count({
        where: { companyId, status: CompetencyStatus.ACTIVE },
      }),
      prisma.competencyAssessment.count({
        where: {
          competency: { companyId },
          outcome: {
            in: [AssessmentOutcome.NOT_STARTED, AssessmentOutcome.IN_PROGRESS],
          },
        },
      }),
      prisma.apprenticeship.count({
        where: { companyId, status: ApprenticeshipStatus.ACTIVE },
      }),
      prisma.certification.count({
        where: {
          companyId,
          status: CertificationStatus.ACTIVE,
          expiresAt: { lte: thirtyDaysFromNow, gte: new Date() },
        },
      }),
      prisma.instructorObservation.count({
        where: {
          observed: { companyId },
          observedAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.writtenExam.count({
        where: { companyId, status: ExamStatus.PUBLISHED },
      }),
    ]);

    return success({
      activeCompetencies,
      openAssessments,
      activeApprenticeships,
      expiringCertifications,
      recentObservations,
      publishedExams,
    });
  } catch (error) {
    return failure(error);
  }
}
