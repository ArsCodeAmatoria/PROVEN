import "server-only";

import { ASSESSMENT_RATING_SCORES } from "@/features/assessments/constants";
import {
  TRAINING_MATRIX_STATUS_LABELS,
} from "@/features/training-matrix/constants";
import { mapStoredStatusToDisplay } from "@/lib/training-matrix-status";
import type {
  GenerateReportInput,
  ReportType,
} from "@/lib/validations/report";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";
import { notDeleted } from "@/types";
import { formatDate, fullName } from "@/utils/format";
import {
  getAssessmentById,
} from "@/services/assessments.service";
import { getObservationById } from "@/services/observations.service";
import { getEmployeeById } from "@/services/people.service";
import { getTrainingMatrix } from "@/services/training-matrix.service";

import {
  failure,
  getDatabaseConfigError,
  success,
  unavailable,
} from "./base";

export type ReportOptionLists = {
  employees: { id: string; label: string }[];
  supervisors: { id: string; label: string }[];
  projects: { id: string; label: string }[];
  assessments: { id: string; label: string }[];
  observations: { id: string; label: string }[];
};

export type ReportCompany = {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
};

export type ReportPhoto = { url: string; caption?: string | null };

export type ReportSignature = {
  role: string;
  signerName: string;
  signedAt: string;
  signatureUrl?: string | null;
};

export type WorkerCompetencyProfilePayload = {
  kind: "worker_competency_profile";
  company: ReportCompany;
  worker: {
    id: string;
    name: string;
    photoUrl: string | null;
    trade: string | null;
    level: number;
    employeeNumber: string | null;
    supervisorName: string | null;
    title: string | null;
  };
  competencies: {
    code: string;
    title: string;
    status: string;
    lastAssessedAt: string;
  }[];
  assessments: {
    date: string;
    title: string;
    rating: string;
    outcome: string;
  }[];
  trends: { label: string; score: number }[];
  certificates: { name: string; expiresAt: string; status: string }[];
};

export type CompetencyPassportPayload = {
  kind: "competency_passport";
  company: ReportCompany;
  worker: WorkerCompetencyProfilePayload["worker"];
  verified: {
    code: string;
    title: string;
    trade: string | null;
    verifiedAt: string;
  }[];
  signatures: ReportSignature[];
};

export type PracticalAssessmentPayload = {
  kind: "practical_assessment";
  company: ReportCompany;
  assessment: {
    title: string;
    type: string;
    projectName: string | null;
    competencyCode: string | null;
    competencyTitle: string | null;
    assessedAt: string;
    rating: string;
    outcome: string;
    comments: string | null;
    instructorNotes: string | null;
    workerComments: string | null;
  };
  worker: WorkerCompetencyProfilePayload["worker"];
  history: { date: string; rating: string; project: string }[];
  trends: { label: string; score: number }[];
  signatures: ReportSignature[];
  photos: ReportPhoto[];
};

export type FieldObservationPayload = {
  kind: "field_observation";
  company: ReportCompany;
  observation: {
    type: string;
    observedAt: string;
    projectName: string | null;
    competencyTitle: string | null;
    rating: string | null;
    notes: string | null;
    followUpStatus: string;
    followUpNotes: string | null;
    observerName: string;
  };
  worker: WorkerCompetencyProfilePayload["worker"];
  photos: ReportPhoto[];
};

export type SupervisorProgressPayload = {
  kind: "supervisor_progress";
  company: ReportCompany;
  supervisor: { id: string; name: string; photoUrl: string | null };
  reports: {
    name: string;
    trade: string | null;
    competentCount: number;
    verifiedCount: number;
    inProgressCount: number;
    recentAssessment: string;
  }[];
};

export type ProjectCompetencySummaryPayload = {
  kind: "project_competency_summary";
  company: ReportCompany;
  project: { id: string; code: string; name: string; location: string | null };
  summary: Record<string, number>;
  rows: {
    worker: string;
    competency: string;
    status: string;
    lastAssessedAt: string;
  }[];
};

export type CompanyTrainingMatrixPayload = {
  kind: "company_training_matrix";
  company: ReportCompany;
  matrix: Awaited<ReturnType<typeof getTrainingMatrix>> extends ServiceResult<
    infer T
  >
    ? T
    : never;
};

export type CompetencyExpiryPayload = {
  kind: "competency_expiry";
  company: ReportCompany;
  items: {
    worker: string;
    item: string;
    kind: string;
    expiresAt: string;
    status: string;
  }[];
};

export type ReportPayload =
  | WorkerCompetencyProfilePayload
  | CompetencyPassportPayload
  | PracticalAssessmentPayload
  | FieldObservationPayload
  | SupervisorProgressPayload
  | ProjectCompetencySummaryPayload
  | CompanyTrainingMatrixPayload
  | CompetencyExpiryPayload;

function ratingLabel(rating: string | null | undefined) {
  if (!rating) return "—";
  return rating.replaceAll("_", " ");
}

function scoreForRating(rating: string | null | undefined) {
  if (!rating) return 0;
  return (
    ASSESSMENT_RATING_SCORES[
      rating as keyof typeof ASSESSMENT_RATING_SCORES
    ] ?? 0
  );
}

async function loadCompany(companyId: string): Promise<ReportCompany | null> {
  const company = await prisma.company.findFirst({
    where: { id: companyId, ...notDeleted },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      address: true,
      phone: true,
    },
  });
  return company;
}

function workerFromEmployee(employee: {
  id: string;
  photoUrl: string | null;
  trade: string | null;
  level: number;
  employeeNumber: string | null;
  title: string | null;
  user: { firstName: string; lastName: string; avatarUrl: string | null };
  supervisor?: { user: { firstName: string; lastName: string } } | null;
}) {
  return {
    id: employee.id,
    name: fullName(employee.user.firstName, employee.user.lastName),
    photoUrl: employee.photoUrl || employee.user.avatarUrl || null,
    trade: employee.trade,
    level: employee.level,
    employeeNumber: employee.employeeNumber,
    supervisorName: employee.supervisor
      ? fullName(
          employee.supervisor.user.firstName,
          employee.supervisor.user.lastName,
        )
      : null,
    title: employee.title,
  };
}

export async function getReportOptions(
  companyId: string,
): Promise<ServiceResult<ReportOptionLists>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const [employees, projects, assessments, observations] = await Promise.all([
      prisma.employee.findMany({
        where: {
          companyId,
          ...notDeleted,
          status: { in: ["ACTIVE", "ON_LEAVE"] },
        },
        include: { user: true },
        orderBy: [
          { user: { lastName: "asc" } },
          { user: { firstName: "asc" } },
        ],
        take: 500,
      }),
      prisma.project.findMany({
        where: { companyId, ...notDeleted },
        orderBy: { name: "asc" },
        take: 200,
      }),
      prisma.assessment.findMany({
        where: { companyId, ...notDeleted, status: "COMPLETED" },
        include: {
          results: {
            where: notDeleted,
            include: { employee: { include: { user: true } } },
            take: 1,
          },
          competency: { select: { code: true } },
        },
        orderBy: { completedAt: "desc" },
        take: 200,
      }),
      prisma.observation.findMany({
        where: { companyId, ...notDeleted },
        include: { employee: { include: { user: true } } },
        orderBy: { observedAt: "desc" },
        take: 200,
      }),
    ]);

    return success({
      employees: employees.map((row) => ({
        id: row.id,
        label: fullName(row.user.firstName, row.user.lastName),
      })),
      supervisors: employees.map((row) => ({
        id: row.id,
        label: fullName(row.user.firstName, row.user.lastName),
      })),
      projects: projects.map((row) => ({
        id: row.id,
        label: `${row.code} · ${row.name}`,
      })),
      assessments: assessments.map((row) => {
        const subject = row.results[0]?.employee;
        const subjectName = subject
          ? fullName(subject.user.firstName, subject.user.lastName)
          : "Worker";
        return {
          id: row.id,
          label: `${formatDate(row.completedAt ?? row.createdAt)} · ${subjectName} · ${row.competency?.code ?? row.title}`,
        };
      }),
      observations: observations.map((row) => ({
        id: row.id,
        label: `${formatDate(row.observedAt)} · ${fullName(row.employee.user.firstName, row.employee.user.lastName)} · ${row.observationType}`,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function buildReportPayload(
  companyId: string,
  input: GenerateReportInput,
): Promise<ServiceResult<ReportPayload>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const company = await loadCompany(companyId);
    if (!company) return failure(new Error("Company not found."));

    switch (input.type) {
      case "worker_competency_profile":
        return success(await buildWorkerProfile(company, input.employeeId!));
      case "competency_passport":
        return success(await buildPassport(company, input.employeeId!));
      case "practical_assessment":
        return success(
          await buildPracticalAssessment(
            companyId,
            company,
            input.assessmentId!,
            input.includePhotos,
          ),
        );
      case "field_observation":
        return success(
          await buildFieldObservation(
            companyId,
            company,
            input.observationId!,
            input.includePhotos,
          ),
        );
      case "supervisor_progress":
        return success(
          await buildSupervisorProgress(company, input.supervisorId!),
        );
      case "project_competency_summary":
        return success(
          await buildProjectSummary(companyId, company, input.projectId!),
        );
      case "company_training_matrix": {
        const matrix = await getTrainingMatrix(companyId);
        if (!matrix.data) {
          return { data: null, error: matrix.error };
        }
        return success({
          kind: "company_training_matrix",
          company,
          matrix: matrix.data,
        });
      }
      case "competency_expiry":
        return success(await buildExpiryReport(companyId, company));
      default:
        return failure(new Error("Unknown report type."));
    }
  } catch (error) {
    return failure(error);
  }
}

export function reportFileSlug(type: ReportType) {
  return type.replaceAll("_", "-");
}

async function buildWorkerProfile(
  company: ReportCompany,
  employeeId: string,
): Promise<WorkerCompetencyProfilePayload> {
  const result = await getEmployeeById(company.id, employeeId);
  if (!result.data) throw new Error(result.error ?? "Worker not found.");
  const employee = result.data;

  const trends = employee.assessmentResults
    .filter((item) => item.rating)
    .slice(0, 12)
    .reverse()
    .map((item) => ({
      label: formatDate(item.assessedAt ?? item.createdAt),
      score: scoreForRating(item.rating),
    }));

  return {
    kind: "worker_competency_profile",
    company,
    worker: workerFromEmployee(employee),
    competencies: employee.trainingMatrixEntries.map((entry) => ({
      code: entry.competency.code,
      title: entry.competency.title,
      status:
        TRAINING_MATRIX_STATUS_LABELS[
          mapStoredStatusToDisplay(entry.status)
        ],
      lastAssessedAt: formatDate(entry.lastAssessedAt),
    })),
    assessments: employee.assessmentResults.slice(0, 25).map((item) => ({
      date: formatDate(item.assessedAt ?? item.createdAt),
      title: item.assessment.title,
      rating: ratingLabel(item.rating),
      outcome: ratingLabel(item.outcome),
    })),
    trends,
    certificates: employee.certificates.map((cert) => ({
      name: cert.name,
      expiresAt: formatDate(cert.expiresAt),
      status: cert.status,
    })),
  };
}

async function buildPassport(
  company: ReportCompany,
  employeeId: string,
): Promise<CompetencyPassportPayload> {
  const profile = await buildWorkerProfile(company, employeeId);
  const entries = await prisma.trainingMatrixEntry.findMany({
    where: {
      employeeId,
      ...notDeleted,
      status: { in: ["VERIFIED", "COMPETENT"] },
      employee: { companyId: company.id, ...notDeleted },
    },
    include: {
      competency: {
        select: { code: true, title: true, trade: true },
      },
    },
    orderBy: { lastAssessedAt: "desc" },
  });

  const signatures: ReportSignature[] = [];
  const latestVerified = await prisma.assessmentResult.findMany({
    where: {
      employeeId,
      ...notDeleted,
      lockedAt: { not: null },
      rating: { in: ["COMPETENT", "EXCEEDS_STANDARD", "PASS"] },
    },
    include: {
      signatures: { where: notDeleted, orderBy: { signedAt: "desc" } },
    },
    orderBy: { assessedAt: "desc" },
    take: 5,
  });

  for (const result of latestVerified) {
    for (const signature of result.signatures) {
      signatures.push({
        role: signature.role,
        signerName: signature.signerName,
        signedAt: formatDate(signature.signedAt),
        signatureUrl: signature.signatureUrl,
      });
    }
  }

  return {
    kind: "competency_passport",
    company,
    worker: profile.worker,
    verified: entries.map((entry) => ({
      code: entry.competency.code,
      title: entry.competency.title,
      trade: entry.competency.trade,
      verifiedAt: formatDate(entry.lastAssessedAt),
    })),
    signatures: signatures.slice(0, 8),
  };
}

async function buildPracticalAssessment(
  companyId: string,
  company: ReportCompany,
  assessmentId: string,
  includePhotos: boolean,
): Promise<PracticalAssessmentPayload> {
  const detail = await getAssessmentById(companyId, assessmentId);
  if (!detail.data) throw new Error(detail.error ?? "Assessment not found.");
  const assessment = detail.data;
  const result = assessment.result;
  if (!result) throw new Error("Assessment has no result.");

  const history = (assessment.history ?? []).map((item) => ({
    date: formatDate(item.assessedAt),
    rating: ratingLabel(item.rating),
    project: item.projectName ?? "—",
  }));

  const trends = (assessment.history ?? []).map((item) => ({
    label: formatDate(item.assessedAt),
    score: scoreForRating(item.rating),
  }));

  return {
    kind: "practical_assessment",
    company,
    assessment: {
      title: assessment.title,
      type: assessment.type,
      projectName: assessment.project?.name ?? null,
      competencyCode: assessment.competency?.code ?? null,
      competencyTitle: assessment.competency?.title ?? null,
      assessedAt: formatDate(result.assessedAt ?? assessment.completedAt),
      rating: ratingLabel(result.rating),
      outcome: ratingLabel(result.outcome),
      comments: result.comments,
      instructorNotes: result.instructorNotes,
      workerComments: result.apprenticeComments,
    },
    worker: workerFromEmployee(result.employee),
    history,
    trends,
    signatures: result.signatures.map((signature) => ({
      role: signature.role,
      signerName: signature.signerName,
      signedAt: formatDate(signature.signedAt),
      signatureUrl: signature.signatureUrl,
    })),
    photos: includePhotos
      ? assessment.photos.map((photo) => ({
          url: photo.url,
          caption: photo.caption,
        }))
      : [],
  };
}

async function buildFieldObservation(
  companyId: string,
  company: ReportCompany,
  observationId: string,
  includePhotos: boolean,
): Promise<FieldObservationPayload> {
  const detail = await getObservationById(companyId, observationId);
  if (!detail.data) throw new Error(detail.error ?? "Observation not found.");
  const observation = detail.data;

  return {
    kind: "field_observation",
    company,
    observation: {
      type: observation.observationType,
      observedAt: formatDate(observation.observedAt),
      projectName: observation.project
        ? `${observation.project.code} · ${observation.project.name}`
        : null,
      competencyTitle: observation.competency?.title ?? null,
      rating: observation.rating,
      notes: observation.notes || observation.comments,
      followUpStatus: observation.followUpStatus,
      followUpNotes: observation.correctiveActions,
      observerName: fullName(
        observation.observer.user.firstName,
        observation.observer.user.lastName,
      ),
    },
    worker: workerFromEmployee(observation.employee),
    photos: includePhotos
      ? observation.photos.map((photo) => ({
          url: photo.url,
          caption: photo.caption,
        }))
      : [],
  };
}

async function buildSupervisorProgress(
  company: ReportCompany,
  supervisorId: string,
): Promise<SupervisorProgressPayload> {
  const supervisor = await prisma.employee.findFirst({
    where: { id: supervisorId, companyId: company.id, ...notDeleted },
    include: { user: true },
  });
  if (!supervisor) throw new Error("Supervisor not found.");

  const reports = await prisma.employee.findMany({
    where: {
      companyId: company.id,
      supervisorId,
      ...notDeleted,
      status: { in: ["ACTIVE", "ON_LEAVE"] },
    },
    include: {
      user: true,
      trainingMatrixEntries: { where: notDeleted },
      assessmentResults: {
        where: notDeleted,
        orderBy: { assessedAt: "desc" },
        take: 1,
      },
    },
    orderBy: [
      { user: { lastName: "asc" } },
      { user: { firstName: "asc" } },
    ],
  });

  return {
    kind: "supervisor_progress",
    company,
    supervisor: {
      id: supervisor.id,
      name: fullName(supervisor.user.firstName, supervisor.user.lastName),
      photoUrl: supervisor.photoUrl || supervisor.user.avatarUrl,
    },
    reports: reports.map((report) => {
      const statuses = report.trainingMatrixEntries.map((entry) =>
        mapStoredStatusToDisplay(entry.status),
      );
      return {
        name: fullName(report.user.firstName, report.user.lastName),
        trade: report.trade,
        competentCount: statuses.filter((status) => status === "COMPETENT")
          .length,
        verifiedCount: statuses.filter((status) => status === "VERIFIED")
          .length,
        inProgressCount: statuses.filter((status) => status === "IN_PROGRESS")
          .length,
        recentAssessment: formatDate(
          report.assessmentResults[0]?.assessedAt ??
            report.assessmentResults[0]?.createdAt,
        ),
      };
    }),
  };
}

async function buildProjectSummary(
  companyId: string,
  company: ReportCompany,
  projectId: string,
): Promise<ProjectCompetencySummaryPayload> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId, ...notDeleted },
  });
  if (!project) throw new Error("Project not found.");

  const matrix = await getTrainingMatrix(companyId, { projectId });
  if (!matrix.data) throw new Error(matrix.error ?? "Unable to load matrix.");

  const summary: Record<string, number> = {
    NOT_STARTED: 0,
    IN_PROGRESS: 0,
    COMPETENT: 0,
    VERIFIED: 0,
    NEEDS_REASSESSMENT: 0,
  };

  const workerMap = new Map(
    matrix.data.workers.map((worker) => [worker.id, worker.name]),
  );
  const competencyMap = new Map(
    matrix.data.competencies.map((item) => [
      item.id,
      `${item.code} ${item.title}`,
    ]),
  );

  const rows = matrix.data.cells
    .filter((cell) => cell.status !== "NOT_STARTED")
    .map((cell) => {
      summary[cell.status] = (summary[cell.status] ?? 0) + 1;
      return {
        worker: workerMap.get(cell.employeeId) ?? "—",
        competency: competencyMap.get(cell.competencyId) ?? "—",
        status: TRAINING_MATRIX_STATUS_LABELS[cell.status],
        lastAssessedAt: formatDate(cell.lastAssessedAt),
      };
    });

  // Count not started as well for summary completeness
  for (const cell of matrix.data.cells) {
    if (cell.status === "NOT_STARTED") {
      summary.NOT_STARTED += 1;
    }
  }

  return {
    kind: "project_competency_summary",
    company,
    project: {
      id: project.id,
      code: project.code,
      name: project.name,
      location: project.location,
    },
    summary,
    rows: rows.slice(0, 200),
  };
}

async function buildExpiryReport(
  companyId: string,
  company: ReportCompany,
): Promise<CompetencyExpiryPayload> {
  const now = new Date();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 90);

  const [results, certificates, matrixEntries] = await Promise.all([
    prisma.assessmentResult.findMany({
      where: {
        ...notDeleted,
        lockedAt: { not: null },
        OR: [
          { validUntil: { lte: horizon } },
          {
            assessedAt: { lte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365) },
          },
        ],
        assessment: { companyId, ...notDeleted },
      },
      include: {
        employee: { include: { user: true } },
        assessment: {
          include: { competency: { select: { code: true, title: true } } },
        },
      },
      orderBy: { validUntil: "asc" },
      take: 200,
    }),
    prisma.certificate.findMany({
      where: {
        companyId,
        ...notDeleted,
        OR: [
          { expiresAt: { lte: horizon } },
          { status: { in: ["EXPIRED", "PENDING"] } },
        ],
      },
      include: { employee: { include: { user: true } } },
      orderBy: { expiresAt: "asc" },
      take: 200,
    }),
    prisma.trainingMatrixEntry.findMany({
      where: {
        ...notDeleted,
        status: { in: ["EXPIRED", "NEEDS_REASSESSMENT"] },
        employee: { companyId, ...notDeleted },
      },
      include: {
        employee: { include: { user: true } },
        competency: { select: { code: true, title: true } },
      },
      take: 200,
    }),
  ]);

  const items = [
    ...results.map((item) => ({
      worker: fullName(item.employee.user.firstName, item.employee.user.lastName),
      item: item.assessment.competency
        ? `${item.assessment.competency.code} · ${item.assessment.competency.title}`
        : item.assessment.title,
      kind: "Assessment",
      expiresAt: formatDate(item.validUntil ?? item.assessedAt),
      status: item.validUntil && item.validUntil < now ? "Expired" : "Due soon",
    })),
    ...certificates.map((item) => ({
      worker: fullName(item.employee.user.firstName, item.employee.user.lastName),
      item: item.name,
      kind: "Certificate",
      expiresAt: formatDate(item.expiresAt),
      status: item.status,
    })),
    ...matrixEntries.map((item) => ({
      worker: fullName(item.employee.user.firstName, item.employee.user.lastName),
      item: `${item.competency.code} · ${item.competency.title}`,
      kind: "Matrix",
      expiresAt: formatDate(item.dueDate ?? item.lastAssessedAt),
      status: TRAINING_MATRIX_STATUS_LABELS[mapStoredStatusToDisplay(item.status)],
    })),
  ];

  return {
    kind: "competency_expiry",
    company,
    items,
  };
}
