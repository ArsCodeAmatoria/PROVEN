export type {
  Company,
  User,
  Employee,
  UserSettings,
  CompanyInvite,
  Project,
  ProjectAssignment,
  CompetencyCategory,
  Competency,
  CompetencyCriterion,
  Assessment,
  AssessmentResult,
  AssessmentSignature,
  Observation,
  WrittenExam,
  ExamQuestion,
  ExamResult,
  Certificate,
  EmployeeHour,
  EquipmentType,
  Equipment,
  Photo,
  Video,
  Document,
  TrainingMatrix,
  TrainingMatrixEntry,
  Notification,
  AuditLog,
} from "@/generated/prisma/client";

export type { UserRole } from "@/types/roles";
export { USER_ROLES, isUserRole } from "@/types/roles";

export {
  EmployeeStatus,
  ProjectStatus,
  CompetencyStatus,
  CompetencyDifficulty,
  AssessmentType,
  AssessmentStatus,
  AssessmentOutcome,
  AssessmentRating,
  AssessmentSignerRole,
  ObservationRating,
  ExamStatus,
  ExamResultStatus,
  CertificateStatus,
  EquipmentStatus,
  MediaEntityType,
  TrainingRequirementLevel,
  TrainingMatrixCellStatus,
  NotificationType,
  AuditAction,
  InviteStatus,
  HourEntryType,
} from "@/generated/prisma/client";

export interface DashboardMetrics {
  activeCompetencies: number;
  openAssessments: number;
  activeProjects: number;
  expiringCertificates: number;
  recentObservations: number;
  publishedExams: number;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** Active (non-soft-deleted) row filter for Prisma queries. */
export const notDeleted = { deletedAt: null } as const;
