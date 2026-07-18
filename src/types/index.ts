export type {
  Company,
  Profile,
  UserSettings,
  CompanyInvite,
  Competency,
  CompetencyCriterion,
  CompetencyAssessment,
  WrittenExam,
  ExamQuestion,
  ExamAttempt,
  Apprenticeship,
  ApprenticeshipProgress,
  InstructorObservation,
  Certification,
  ContinuousAssessment,
} from "@/generated/prisma/client";

export type { UserRole } from "@/types/roles";
export { USER_ROLES, isUserRole } from "@/types/roles";

export {
  CompetencyStatus,
  AssessmentOutcome,
  ExamStatus,
  ExamAttemptStatus,
  ApprenticeshipStatus,
  ObservationRating,
  CertificationStatus,
  ContinuousAssessmentType,
  InviteStatus,
} from "@/generated/prisma/client";

export interface DashboardMetrics {
  activeCompetencies: number;
  openAssessments: number;
  activeApprenticeships: number;
  expiringCertifications: number;
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
