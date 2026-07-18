import "server-only";

import {
  AssessmentStatus,
  CertificateStatus,
  CompetencyStatus,
  ExamStatus,
  ProjectStatus,
  type Assessment,
  type AuditLog,
  type Certificate,
  type Notification,
  type Observation,
  type TrainingMatrixCellStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DashboardMetrics, ServiceResult } from "@/types";
import { notDeleted } from "@/types";
import { fullName } from "@/utils/format";

import { failure, getDatabaseConfigError, success, unavailable } from "./base";

export type DashboardEmployeeDue = {
  employeeId: string;
  name: string;
  title: string | null;
  competencyTitle: string;
  status: TrainingMatrixCellStatus;
  dueDate: Date | null;
};

export type DashboardCertificateItem = {
  id: string;
  name: string;
  employeeName: string;
  expiresAt: Date | null;
  status: CertificateStatus;
};

export type DashboardObservationItem = {
  id: string;
  context: string;
  rating: string;
  employeeName: string;
  observedAt: Date;
};

export type DashboardEvaluationItem = {
  id: string;
  title: string;
  type: string;
  status: AssessmentStatus;
  scheduledAt: Date | null;
};

export type DashboardActivityItem = {
  id: string;
  action: string;
  entityType: string;
  summary: string | null;
  createdAt: Date;
};

export type DashboardNotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  linkUrl: string | null;
};

export type DashboardChartPoint = {
  label: string;
  value: number;
};

export type DashboardData = {
  metrics: DashboardMetrics;
  upcomingEvaluations: DashboardEvaluationItem[];
  recentActivity: DashboardActivityItem[];
  employeesDue: DashboardEmployeeDue[];
  expiringCertificates: DashboardCertificateItem[];
  recentObservations: DashboardObservationItem[];
  notifications: DashboardNotificationItem[];
  assessmentsByStatus: DashboardChartPoint[];
  competencyLevels: DashboardChartPoint[];
  observationsByRating: DashboardChartPoint[];
};

function emptyMetrics(): DashboardMetrics {
  return {
    activeCompetencies: 0,
    openAssessments: 0,
    activeProjects: 0,
    expiringCertificates: 0,
    recentObservations: 0,
    publishedExams: 0,
  };
}

function emptyDashboard(): DashboardData {
  return {
    metrics: emptyMetrics(),
    upcomingEvaluations: [],
    recentActivity: [],
    employeesDue: [],
    expiringCertificates: [],
    recentObservations: [],
    notifications: [],
    assessmentsByStatus: [],
    competencyLevels: [],
    observationsByRating: [],
  };
}

export async function getDashboardMetrics(
  companyId: string,
): Promise<ServiceResult<DashboardMetrics>> {
  const result = await getDashboardData(companyId);
  if (result.error || !result.data) {
    return { data: null, error: result.error };
  }
  return success(result.data.metrics);
}

export async function getDashboardData(
  companyId: string,
  employeeId?: string | null,
): Promise<ServiceResult<DashboardData>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(now.getDate() + 14);

    const [
      activeCompetencies,
      openAssessments,
      activeProjects,
      expiringCertCount,
      recentObservationCount,
      publishedExams,
      upcomingAssessments,
      activityLogs,
      dueEntries,
      expiringCerts,
      observations,
      notifications,
      assessmentGroups,
      competencyGroups,
      observationGroups,
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
          expiresAt: { lte: thirtyDaysFromNow, gte: now },
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
      prisma.assessment.findMany({
        where: {
          companyId,
          status: {
            in: [AssessmentStatus.SCHEDULED, AssessmentStatus.IN_PROGRESS],
          },
          OR: [
            { scheduledAt: { lte: fourteenDaysFromNow, gte: now } },
            { scheduledAt: null, status: AssessmentStatus.IN_PROGRESS },
          ],
          ...notDeleted,
        },
        orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
        take: 6,
      }),
      prisma.auditLog.findMany({
        where: { companyId, ...notDeleted },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.trainingMatrixEntry.findMany({
        where: {
          ...notDeleted,
          status: { in: ["NOT_STARTED", "IN_PROGRESS", "EXPIRED"] },
          OR: [
            { dueDate: { lte: fourteenDaysFromNow } },
            { dueDate: null, status: { in: ["NOT_STARTED", "EXPIRED"] } },
          ],
          employee: { companyId, ...notDeleted },
          competency: { companyId, ...notDeleted },
        },
        include: {
          employee: { include: { user: true } },
          competency: true,
        },
        orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
        take: 6,
      }),
      prisma.certificate.findMany({
        where: {
          companyId,
          status: { in: [CertificateStatus.ACTIVE, CertificateStatus.PENDING] },
          expiresAt: { lte: thirtyDaysFromNow, gte: now },
          ...notDeleted,
        },
        include: {
          employee: { include: { user: true } },
        },
        orderBy: { expiresAt: "asc" },
        take: 6,
      }),
      prisma.observation.findMany({
        where: { companyId, ...notDeleted },
        include: {
          employee: { include: { user: true } },
        },
        orderBy: { observedAt: "desc" },
        take: 6,
      }),
      employeeId
        ? prisma.notification.findMany({
            where: { employeeId, ...notDeleted },
            orderBy: { createdAt: "desc" },
            take: 8,
          })
        : Promise.resolve([] as Notification[]),
      prisma.assessment.groupBy({
        by: ["status"],
        where: { companyId, ...notDeleted },
        _count: { _all: true },
      }),
      prisma.competency.groupBy({
        by: ["level"],
        where: { companyId, status: CompetencyStatus.ACTIVE, ...notDeleted },
        _count: { _all: true },
        orderBy: { level: "asc" },
      }),
      prisma.observation.groupBy({
        by: ["rating"],
        where: { companyId, ...notDeleted },
        _count: { _all: true },
      }),
    ]);

    const data: DashboardData = {
      metrics: {
        activeCompetencies,
        openAssessments,
        activeProjects,
        expiringCertificates: expiringCertCount,
        recentObservations: recentObservationCount,
        publishedExams,
      },
      upcomingEvaluations: upcomingAssessments.map((item: Assessment) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        scheduledAt: item.scheduledAt,
      })),
      recentActivity: activityLogs.map((item: AuditLog) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        summary: item.summary,
        createdAt: item.createdAt,
      })),
      employeesDue: dueEntries.map((item) => ({
        employeeId: item.employeeId,
        name: fullName(item.employee.user.firstName, item.employee.user.lastName),
        title: item.employee.title,
        competencyTitle: item.competency.title,
        status: item.status,
        dueDate: item.dueDate,
      })),
      expiringCertificates: expiringCerts.map((item: Certificate & {
        employee: { user: { firstName: string; lastName: string } };
      }) => ({
        id: item.id,
        name: item.name,
        employeeName: fullName(
          item.employee.user.firstName,
          item.employee.user.lastName,
        ),
        expiresAt: item.expiresAt,
        status: item.status,
      })),
      recentObservations: observations.map(
        (
          item: Observation & {
            employee: { user: { firstName: string; lastName: string } };
          },
        ) => ({
          id: item.id,
          context: item.context,
          rating: item.rating,
          employeeName: fullName(
            item.employee.user.firstName,
            item.employee.user.lastName,
          ),
          observedAt: item.observedAt,
        }),
      ),
      notifications: notifications.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type,
        isRead: item.isRead,
        createdAt: item.createdAt,
        linkUrl: item.linkUrl,
      })),
      assessmentsByStatus: assessmentGroups.map((group) => ({
        label: group.status,
        value: group._count._all,
      })),
      competencyLevels: competencyGroups.map((group) => ({
        label: `Level ${group.level}`,
        value: group._count._all,
      })),
      observationsByRating: observationGroups.map((group) => ({
        label: group.rating,
        value: group._count._all,
      })),
    };

    return success(data);
  } catch (error) {
    // When tables are empty/unmigrated, still render an empty dashboard shell.
    if (error instanceof Error && /does not exist|P2021/i.test(error.message)) {
      return success(emptyDashboard());
    }
    return failure(error);
  }
}
