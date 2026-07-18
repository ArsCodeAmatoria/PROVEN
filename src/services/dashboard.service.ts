import "server-only";

import {
  AssessmentStatus,
  CertificateStatus,
  CompetencyStatus,
  ExamStatus,
  ProjectStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DashboardMetrics, ServiceResult } from "@/types";
import { notDeleted } from "@/types";

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
      activeProjects,
      expiringCertificates,
      recentObservations,
      publishedExams,
    ] = await Promise.all([
      prisma.competency.count({
        where: { companyId, status: CompetencyStatus.ACTIVE, ...notDeleted },
      }),
      prisma.assessment.count({
        where: {
          companyId,
          status: {
            in: [AssessmentStatus.SCHEDULED, AssessmentStatus.IN_PROGRESS],
          },
          ...notDeleted,
        },
      }),
      prisma.project.count({
        where: { companyId, status: ProjectStatus.ACTIVE, ...notDeleted },
      }),
      prisma.certificate.count({
        where: {
          companyId,
          status: CertificateStatus.ACTIVE,
          expiresAt: { lte: thirtyDaysFromNow, gte: new Date() },
          ...notDeleted,
        },
      }),
      prisma.observation.count({
        where: {
          companyId,
          observedAt: { gte: sevenDaysAgo },
          ...notDeleted,
        },
      }),
      prisma.writtenExam.count({
        where: { companyId, status: ExamStatus.PUBLISHED, ...notDeleted },
      }),
    ]);

    return success({
      activeCompetencies,
      openAssessments,
      activeProjects,
      expiringCertificates,
      recentObservations,
      publishedExams,
    });
  } catch (error) {
    return failure(error);
  }
}
