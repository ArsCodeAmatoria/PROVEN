import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import bank from "@/lib/cor/bccsa-question-bank.json";
import {
  buildBccsaCorWorkbook,
  parseCanadianMailingAddress,
  statusToTechniqueMark,
  type BccsaExportHeader,
} from "@/lib/cor/bccsa-excel-export";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";
import { notDeleted } from "@/types";

import { failure, getDatabaseConfigError, success, unavailable } from "./base";

const PLATFORM_COR_CODE = bank.programCode;

const auditSessionListInclude = {
  program: { select: { id: true, title: true, code: true } },
  leadEmployee: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
  _count: {
    select: {
      responses: { where: notDeleted },
      correctiveActions: { where: notDeleted },
    },
  },
} satisfies Prisma.CorAuditSessionInclude;

export type AuditSessionListItem = Prisma.CorAuditSessionGetPayload<{
  include: typeof auditSessionListInclude;
}>;

const correctiveActionListInclude = {
  owner: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  },
  question: { select: { id: true, number: true, description: true } },
} satisfies Prisma.CorrectiveActionInclude;

export type CorrectiveActionListItem = Prisma.CorrectiveActionGetPayload<{
  include: typeof correctiveActionListInclude;
}>;

const sessionDetailInclude = {
  program: { select: { id: true, title: true, code: true, version: true } },
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      address: true,
      website: true,
    },
  },
  leadEmployee: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  },
  responses: {
    where: notDeleted,
    include: {
      question: {
        select: {
          id: true,
          number: true,
          description: true,
          weight: true,
          requiresDocumentation: true,
          requiresObservation: true,
          requiresInterview: true,
          elementId: true,
          element: {
            select: { id: true, code: true, title: true, sortOrder: true },
          },
        },
      },
    },
  },
} satisfies Prisma.CorAuditSessionInclude;

export type AuditSessionDetail = Prisma.CorAuditSessionGetPayload<{
  include: typeof sessionDetailInclude;
}>;

export type ComplianceElementView = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  questionCount: number;
  weight: number;
};

export type ComplianceDashboardView = {
  programId: string;
  programTitle: string;
  programVersion: string;
  readinessPct: number | null;
  predictedScore: number | null;
  elementCount: number;
  questionCount: number;
  openCorrectiveActions: number;
  outstandingEvidence: number;
  draftAudits: number;
  completedAudits: number;
  elements: ComplianceElementView[];
};

export type AuditQuestionView = {
  questionId: string;
  number: string;
  description: string;
  weight: number;
  requiresDocumentation: boolean;
  requiresObservation: boolean;
  requiresInterview: boolean;
  elementCode: string;
  elementTitle: string;
  elementSortOrder: number;
  responseId: string | null;
  status: string;
  score: number | null;
  comments: string | null;
  observationNotes: string | null;
  interviewNotes: string | null;
  evidence: CorEvidenceItem[];
};

export type CorEvidenceItem = {
  linkId: string;
  questionId: string;
  questionNumber: string | null;
  sourceType: string;
  sourceId: string;
  kind: string | null;
  notes: string | null;
  title: string;
  url: string | null;
  mimeType: string | null;
  createdAt: Date;
};

/**
 * Idempotent platform COR program from official BCCSA question bank.
 */
export async function ensurePlatformCorProgram(): Promise<
  ServiceResult<{ programId: string }>
> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    let program = await prisma.corProgram.findFirst({
      where: { companyId: null, code: PLATFORM_COR_CODE, ...notDeleted },
    });

    if (!program) {
      program = await prisma.corProgram.create({
        data: {
          companyId: null,
          code: PLATFORM_COR_CODE,
          title: bank.programTitle,
          description:
            "Official BCCSA COR OHS Audit question bank (V2 R13). Source workbook in templates/bccsa-cor.",
          version: bank.programVersion,
          isActive: true,
          sortOrder: 0,
        },
      });
    } else {
      program = await prisma.corProgram.update({
        where: { id: program.id },
        data: {
          title: bank.programTitle,
          description:
            "Official BCCSA COR OHS Audit question bank (V2 R13). Source workbook in templates/bccsa-cor.",
          version: bank.programVersion,
          isActive: true,
          deletedAt: null,
        },
      });
    }

    const keepElementCodes = new Set(bank.elements.map((e) => e.code));
    const keepQuestionKeys = new Set(
      bank.elements.flatMap((e) => e.questions.map((q) => q.number)),
    );

    for (const [index, element] of bank.elements.entries()) {
      const row = await prisma.corElement.upsert({
        where: {
          programId_code: { programId: program.id, code: element.code },
        },
        create: {
          programId: program.id,
          code: element.code,
          title: element.title,
          description: element.description,
          weight: 1,
          sortOrder: index + 1,
        },
        update: {
          title: element.title,
          description: element.description,
          sortOrder: index + 1,
          deletedAt: null,
        },
      });

      for (const [qIndex, q] of element.questions.entries()) {
        await prisma.corQuestion.upsert({
          where: {
            elementId_number: { elementId: row.id, number: q.number },
          },
          create: {
            elementId: row.id,
            number: q.number,
            reference: `BCCSA-${q.number}`,
            description: q.description,
            weight: q.weight,
            requiresDocumentation: q.requiresDocumentation,
            requiresObservation: q.requiresObservation,
            requiresInterview: q.requiresInterview,
            sortOrder: qIndex + 1,
          },
          update: {
            description: q.description,
            weight: q.weight,
            requiresDocumentation: q.requiresDocumentation,
            requiresObservation: q.requiresObservation,
            requiresInterview: q.requiresInterview,
            sortOrder: qIndex + 1,
            deletedAt: null,
          },
        });
      }
    }

    const staleElements = await prisma.corElement.findMany({
      where: {
        programId: program.id,
        ...notDeleted,
        code: { notIn: [...keepElementCodes] },
      },
      select: { id: true },
    });
    if (staleElements.length) {
      const ids = staleElements.map((e) => e.id);
      await prisma.corQuestion.updateMany({
        where: { elementId: { in: ids }, ...notDeleted },
        data: { deletedAt: new Date() },
      });
      await prisma.corElement.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });
    }

    const liveElements = await prisma.corElement.findMany({
      where: { programId: program.id, ...notDeleted },
      select: { id: true },
    });
    const liveIds = liveElements.map((e) => e.id);
    if (liveIds.length) {
      const staleQuestions = await prisma.corQuestion.findMany({
        where: {
          elementId: { in: liveIds },
          ...notDeleted,
          number: { notIn: [...keepQuestionKeys] },
        },
        select: { id: true },
      });
      if (staleQuestions.length) {
        await prisma.corQuestion.updateMany({
          where: { id: { in: staleQuestions.map((q) => q.id) } },
          data: { deletedAt: new Date() },
        });
      }
    }

    return success({ programId: program.id });
  } catch (error) {
    return failure(error);
  }
}

export async function getComplianceDashboard(
  companyId: string,
): Promise<ServiceResult<ComplianceDashboardView>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const ensured = await ensurePlatformCorProgram();
    if (!ensured.data) {
      return unavailable(ensured.error ?? "COR program unavailable");
    }

    const program = await prisma.corProgram.findFirstOrThrow({
      where: { id: ensured.data.programId, ...notDeleted },
      include: {
        elements: {
          where: notDeleted,
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { questions: { where: notDeleted } } },
          },
        },
      },
    });

    const [
      openCorrectiveActions,
      draftAudits,
      completedAudits,
      outstandingEvidence,
    ] = await Promise.all([
      prisma.correctiveAction.count({
        where: {
          companyId,
          ...notDeleted,
          status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_EVIDENCE", "PENDING_VERIFICATION"] },
        },
      }),
      prisma.corAuditSession.count({
        where: {
          companyId,
          ...notDeleted,
          status: { in: ["DRAFT", "IN_PROGRESS"] },
        },
      }),
      prisma.corAuditSession.count({
        where: { companyId, ...notDeleted, status: "COMPLETED" },
      }),
      prisma.corEvidenceLink.count({
        where: {
          ...notDeleted,
          session: { companyId, ...notDeleted },
        },
      }),
    ]);

    const latestSession = await prisma.corAuditSession.findFirst({
      where: { companyId, type: "INTERNAL", ...notDeleted },
      orderBy: { updatedAt: "desc" },
      select: {
        readinessPct: true,
        predictedScore: true,
        overallScore: true,
      },
    });

    const questionCount = program.elements.reduce(
      (sum, el) => sum + el._count.questions,
      0,
    );

    return success({
      programId: program.id,
      programTitle: program.title,
      programVersion: program.version,
      readinessPct: latestSession?.readinessPct ?? null,
      predictedScore:
        latestSession?.predictedScore ?? latestSession?.overallScore ?? null,
      elementCount: program.elements.length,
      questionCount,
      openCorrectiveActions,
      outstandingEvidence,
      draftAudits,
      completedAudits,
      elements: program.elements.map((el) => ({
        id: el.id,
        code: el.code,
        title: el.title,
        description: el.description,
        questionCount: el._count.questions,
        weight: el.weight,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function listCorrectiveActionsForCompany(
  companyId: string,
): Promise<ServiceResult<CorrectiveActionListItem[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const items = await prisma.correctiveAction.findMany({
      where: { companyId, ...notDeleted },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      take: 100,
      include: correctiveActionListInclude,
    });
    return success(items);
  } catch (error) {
    return failure(error);
  }
}

export async function listAuditSessionsForCompany(
  companyId: string,
): Promise<ServiceResult<AuditSessionListItem[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const items = await prisma.corAuditSession.findMany({
      where: { companyId, ...notDeleted },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: auditSessionListInclude,
    });
    return success(items);
  } catch (error) {
    return failure(error);
  }
}

export async function createInternalAuditSession(
  companyId: string,
  input: { title?: string; createdById?: string; leadEmployeeId?: string },
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const ensured = await ensurePlatformCorProgram();
    if (!ensured.data) {
      return unavailable(ensured.error ?? "COR program unavailable");
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const session = await prisma.corAuditSession.create({
      data: {
        companyId,
        programId: ensured.data.programId,
        type: "INTERNAL",
        status: "DRAFT",
        title: input.title?.trim() || `Internal COR audit ${stamp}`,
        startedAt: new Date(),
        leadEmployeeId: input.leadEmployeeId,
        createdById: input.createdById,
      },
    });

    return success({ id: session.id });
  } catch (error) {
    return failure(error);
  }
}

export async function getAuditSessionDetail(
  companyId: string,
  sessionId: string,
): Promise<ServiceResult<{ session: AuditSessionDetail; questions: AuditQuestionView[] }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const ensured = await ensurePlatformCorProgram();
    if (!ensured.data) {
      return unavailable(ensured.error ?? "COR program unavailable");
    }

    const session = await prisma.corAuditSession.findFirst({
      where: { id: sessionId, companyId, ...notDeleted },
      include: sessionDetailInclude,
    });
    if (!session) {
      return unavailable("Audit session not found");
    }

    const elements = await prisma.corElement.findMany({
      where: { programId: ensured.data.programId, ...notDeleted },
      orderBy: { sortOrder: "asc" },
      include: {
        questions: {
          where: notDeleted,
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const responseByQuestion = new Map(
      session.responses.map((r) => [r.questionId, r]),
    );

    const evidenceByQuestion = await loadEvidenceByQuestion(
      companyId,
      sessionId,
    );

    const questions: AuditQuestionView[] = [];
    for (const el of elements) {
      for (const q of el.questions) {
        const response = responseByQuestion.get(q.id);
        questions.push({
          questionId: q.id,
          number: q.number,
          description: q.description,
          weight: q.weight,
          requiresDocumentation: q.requiresDocumentation,
          requiresObservation: q.requiresObservation,
          requiresInterview: q.requiresInterview,
          elementCode: el.code,
          elementTitle: el.title,
          elementSortOrder: el.sortOrder,
          responseId: response?.id ?? null,
          status: response?.status ?? "NOT_STARTED",
          score: response?.score ?? null,
          comments: response?.comments ?? null,
          observationNotes: response?.observationNotes ?? null,
          interviewNotes: response?.interviewNotes ?? null,
          evidence: evidenceByQuestion.get(q.id) ?? [],
        });
      }
    }

    return success({ session, questions });
  } catch (error) {
    return failure(error);
  }
}

async function loadEvidenceByQuestion(
  companyId: string,
  sessionId: string,
): Promise<Map<string, CorEvidenceItem[]>> {
  const links = await prisma.corEvidenceLink.findMany({
    where: { sessionId, ...notDeleted },
    orderBy: { createdAt: "desc" },
    include: {
      question: { select: { id: true, number: true } },
    },
  });

  const photoIds = links
    .filter((l) => l.sourceType === "PHOTO")
    .map((l) => l.sourceId);
  const videoIds = links
    .filter((l) => l.sourceType === "VIDEO")
    .map((l) => l.sourceId);
  const documentIds = links
    .filter((l) => l.sourceType === "DOCUMENT")
    .map((l) => l.sourceId);

  const [photos, videos, documents] = await Promise.all([
    photoIds.length
      ? prisma.photo.findMany({
          where: { id: { in: photoIds }, companyId, ...notDeleted },
        })
      : Promise.resolve([]),
    videoIds.length
      ? prisma.video.findMany({
          where: { id: { in: videoIds }, companyId, ...notDeleted },
        })
      : Promise.resolve([]),
    documentIds.length
      ? prisma.document.findMany({
          where: { id: { in: documentIds }, companyId, ...notDeleted },
        })
      : Promise.resolve([]),
  ]);

  const photoById = new Map(photos.map((p) => [p.id, p]));
  const videoById = new Map(videos.map((v) => [v.id, v]));
  const documentById = new Map(documents.map((d) => [d.id, d]));

  const map = new Map<string, CorEvidenceItem[]>();
  for (const link of links) {
    let title = link.notes || "Evidence";
    let url: string | null = null;
    let mimeType: string | null = null;

    if (link.sourceType === "PHOTO") {
      const photo = photoById.get(link.sourceId);
      if (!photo) continue;
      title = photo.caption || "Photo";
      url = photo.url;
      mimeType = photo.mimeType;
    } else if (link.sourceType === "VIDEO") {
      const video = videoById.get(link.sourceId);
      if (!video) continue;
      title = video.caption || "Video";
      url = video.url;
      mimeType = video.mimeType;
    } else if (link.sourceType === "DOCUMENT") {
      const doc = documentById.get(link.sourceId);
      if (!doc) continue;
      title = doc.title;
      url = doc.url;
      mimeType = doc.mimeType;
    }

    const item: CorEvidenceItem = {
      linkId: link.id,
      questionId: link.questionId,
      questionNumber: link.question.number,
      sourceType: link.sourceType,
      sourceId: link.sourceId,
      kind: link.kind ?? null,
      notes: link.notes,
      title,
      url,
      mimeType,
      createdAt: link.createdAt,
    };
    const list = map.get(link.questionId) ?? [];
    list.push(item);
    map.set(link.questionId, list);
  }
  return map;
}

export async function listCompanyCorEvidence(
  companyId: string,
): Promise<ServiceResult<CorEvidenceItem[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const links = await prisma.corEvidenceLink.findMany({
      where: {
        ...notDeleted,
        session: { companyId, ...notDeleted },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        question: { select: { id: true, number: true } },
      },
    });

    const photoIds = links
      .filter((l) => l.sourceType === "PHOTO")
      .map((l) => l.sourceId);
    const videoIds = links
      .filter((l) => l.sourceType === "VIDEO")
      .map((l) => l.sourceId);
    const documentIds = links
      .filter((l) => l.sourceType === "DOCUMENT")
      .map((l) => l.sourceId);

    const [photos, videos, documents] = await Promise.all([
      photoIds.length
        ? prisma.photo.findMany({
            where: { id: { in: photoIds }, companyId, ...notDeleted },
          })
        : Promise.resolve([]),
      videoIds.length
        ? prisma.video.findMany({
            where: { id: { in: videoIds }, companyId, ...notDeleted },
          })
        : Promise.resolve([]),
      documentIds.length
        ? prisma.document.findMany({
            where: { id: { in: documentIds }, companyId, ...notDeleted },
          })
        : Promise.resolve([]),
    ]);

    const photoById = new Map(photos.map((p) => [p.id, p]));
    const videoById = new Map(videos.map((v) => [v.id, v]));
    const documentById = new Map(documents.map((d) => [d.id, d]));

    const items: CorEvidenceItem[] = [];
    for (const link of links) {
      let title = link.notes || "Evidence";
      let url: string | null = null;
      let mimeType: string | null = null;
      if (link.sourceType === "PHOTO") {
        const photo = photoById.get(link.sourceId);
        if (!photo) continue;
        title = photo.caption || "Photo";
        url = photo.url;
        mimeType = photo.mimeType;
      } else if (link.sourceType === "VIDEO") {
        const video = videoById.get(link.sourceId);
        if (!video) continue;
        title = video.caption || "Video";
        url = video.url;
        mimeType = video.mimeType;
      } else if (link.sourceType === "DOCUMENT") {
        const doc = documentById.get(link.sourceId);
        if (!doc) continue;
        title = doc.title;
        url = doc.url;
        mimeType = doc.mimeType;
      }
      items.push({
        linkId: link.id,
        questionId: link.questionId,
        questionNumber: link.question.number,
        sourceType: link.sourceType,
        sourceId: link.sourceId,
        kind: link.kind ?? null,
        notes: link.notes,
        title,
        url,
        mimeType,
        createdAt: link.createdAt,
      });
    }

    return success(items);
  } catch (error) {
    return failure(error);
  }
}

export async function attachCorEvidenceMedia(
  companyId: string,
  input: {
    sessionId: string;
    questionId: string;
    kind: "photo" | "video" | "document";
    evidenceKind?: "DOCUMENTATION" | "OBSERVATION" | "INTERVIEW" | null;
    storagePath: string;
    url: string;
    title?: string | null;
    caption?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
    uploadedById?: string | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<{ linkId: string; sourceId: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const session = await prisma.corAuditSession.findFirst({
      where: { id: input.sessionId, companyId, ...notDeleted },
      select: { id: true, status: true },
    });
    if (!session) return unavailable("Audit session not found");

    const question = await prisma.corQuestion.findFirst({
      where: { id: input.questionId, ...notDeleted },
      select: { id: true, number: true },
    });
    if (!question) return unavailable("Question not found");

    // Ensure a response row exists so the question shows as in progress.
    const existingResponse = await prisma.corQuestionResponse.findFirst({
      where: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        ...notDeleted,
      },
    });
    if (!existingResponse) {
      await prisma.corQuestionResponse.create({
        data: {
          sessionId: input.sessionId,
          questionId: input.questionId,
          status: "IN_PROGRESS",
          createdById: input.createdById ?? null,
        },
      });
    } else if (existingResponse.status === "NOT_STARTED") {
      await prisma.corQuestionResponse.update({
        where: { id: existingResponse.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    if (session.status === "DRAFT") {
      await prisma.corAuditSession.update({
        where: { id: session.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    let sourceId: string;
    let sourceType: "PHOTO" | "VIDEO" | "DOCUMENT";

    if (input.kind === "photo") {
      const photo = await prisma.photo.create({
        data: {
          companyId,
          entityType: "COR_EVIDENCE",
          entityId: input.questionId,
          storagePath: input.storagePath,
          url: input.url,
          caption: input.caption ?? input.title ?? `Q ${question.number}`,
          mimeType: input.mimeType ?? null,
          sizeBytes: input.sizeBytes ?? null,
          uploadedById: input.uploadedById ?? null,
          createdById: input.createdById ?? null,
        },
      });
      sourceId = photo.id;
      sourceType = "PHOTO";
    } else if (input.kind === "video") {
      const video = await prisma.video.create({
        data: {
          companyId,
          entityType: "COR_EVIDENCE",
          entityId: input.questionId,
          storagePath: input.storagePath,
          url: input.url,
          caption: input.caption ?? input.title ?? `Q ${question.number}`,
          mimeType: input.mimeType ?? null,
          sizeBytes: input.sizeBytes ?? null,
          uploadedById: input.uploadedById ?? null,
          createdById: input.createdById ?? null,
        },
      });
      sourceId = video.id;
      sourceType = "VIDEO";
    } else {
      const document = await prisma.document.create({
        data: {
          companyId,
          entityType: "COR_EVIDENCE",
          entityId: input.questionId,
          storagePath: input.storagePath,
          url: input.url,
          title:
            input.title?.trim() ||
            input.caption?.trim() ||
            `Evidence for ${question.number}`,
          description: input.caption ?? null,
          mimeType: input.mimeType ?? null,
          sizeBytes: input.sizeBytes ?? null,
          uploadedById: input.uploadedById ?? null,
          createdById: input.createdById ?? null,
        },
      });
      sourceId = document.id;
      sourceType = "DOCUMENT";
    }

    const link = await prisma.corEvidenceLink.create({
      data: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        kind: input.evidenceKind ?? null,
        sourceType,
        sourceId,
        notes: input.caption ?? input.title ?? null,
        createdById: input.createdById ?? null,
      },
    });

    return success({ linkId: link.id, sourceId });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Link existing company Files (Document rows) as COR evidence without re-uploading.
 */
export async function attachCompanyDocumentsToCorEvidence(
  companyId: string,
  input: {
    sessionId: string;
    questionId: string;
    documentIds: string[];
    evidenceKind?: "DOCUMENTATION" | "OBSERVATION" | "INTERVIEW" | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<{ attached: number; skipped: number }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  const documentIds = [
    ...new Set(input.documentIds.map((id) => id.trim()).filter(Boolean)),
  ];
  if (documentIds.length === 0) {
    return unavailable("Select at least one file to attach.");
  }

  try {
    const session = await prisma.corAuditSession.findFirst({
      where: { id: input.sessionId, companyId, ...notDeleted },
      select: { id: true, status: true },
    });
    if (!session) return unavailable("Audit session not found");

    const question = await prisma.corQuestion.findFirst({
      where: { id: input.questionId, ...notDeleted },
      select: { id: true, number: true },
    });
    if (!question) return unavailable("Question not found");

    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        companyId,
        entityType: "COMPANY",
        ...notDeleted,
      },
      select: { id: true, title: true },
    });
    if (documents.length === 0) {
      return unavailable("No matching company files found.");
    }

    const existingLinks = await prisma.corEvidenceLink.findMany({
      where: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        sourceType: "DOCUMENT",
        sourceId: { in: documents.map((d) => d.id) },
        ...notDeleted,
      },
      select: { sourceId: true },
    });
    const alreadyLinked = new Set(existingLinks.map((l) => l.sourceId));
    const toAttach = documents.filter((d) => !alreadyLinked.has(d.id));

    const existingResponse = await prisma.corQuestionResponse.findFirst({
      where: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        ...notDeleted,
      },
    });
    if (!existingResponse) {
      await prisma.corQuestionResponse.create({
        data: {
          sessionId: input.sessionId,
          questionId: input.questionId,
          status: "IN_PROGRESS",
          createdById: input.createdById ?? null,
        },
      });
    } else if (existingResponse.status === "NOT_STARTED") {
      await prisma.corQuestionResponse.update({
        where: { id: existingResponse.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    if (session.status === "DRAFT") {
      await prisma.corAuditSession.update({
        where: { id: session.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    if (toAttach.length > 0) {
      await prisma.corEvidenceLink.createMany({
        data: toAttach.map((doc) => ({
          sessionId: input.sessionId,
          questionId: input.questionId,
          kind: input.evidenceKind ?? "DOCUMENTATION",
          sourceType: "DOCUMENT" as const,
          sourceId: doc.id,
          notes: doc.title,
          createdById: input.createdById ?? null,
        })),
      });
    }

    return success({
      attached: toAttach.length,
      skipped: documents.length - toAttach.length,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteCorEvidenceLink(
  companyId: string,
  linkId: string,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const link = await prisma.corEvidenceLink.findFirst({
      where: {
        id: linkId,
        ...notDeleted,
        session: { companyId, ...notDeleted },
      },
    });
    if (!link) return unavailable("Evidence not found");

    await prisma.corEvidenceLink.update({
      where: { id: link.id },
      data: { deletedAt: new Date() },
    });

    return success({ id: link.id });
  } catch (error) {
    return failure(error);
  }
}

export async function upsertAuditQuestionResponse(
  companyId: string,
  input: {
    sessionId: string;
    questionId: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "ADEQUATE" | "NEEDS_IMPROVEMENT" | "FAIL" | "NOT_APPLICABLE";
    score?: number | null;
    comments?: string | null;
    observationNotes?: string | null;
    interviewNotes?: string | null;
    createdById?: string;
  },
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const session = await prisma.corAuditSession.findFirst({
      where: { id: input.sessionId, companyId, ...notDeleted },
      select: { id: true, status: true },
    });
    if (!session) return unavailable("Audit session not found");

    const question = await prisma.corQuestion.findFirst({
      where: { id: input.questionId, ...notDeleted },
      select: { id: true },
    });
    if (!question) return unavailable("Question not found");

    const existing = await prisma.corQuestionResponse.findFirst({
      where: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        ...notDeleted,
      },
    });

    const data = {
      status: input.status,
      score: input.score ?? null,
      comments: input.comments?.trim() || null,
      observationNotes: input.observationNotes?.trim() || null,
      interviewNotes: input.interviewNotes?.trim() || null,
      deletedAt: null as Date | null,
    };

    let id: string;
    if (existing) {
      const updated = await prisma.corQuestionResponse.update({
        where: { id: existing.id },
        data,
      });
      id = updated.id;
    } else {
      const created = await prisma.corQuestionResponse.create({
        data: {
          sessionId: input.sessionId,
          questionId: input.questionId,
          ...data,
          createdById: input.createdById,
        },
      });
      id = created.id;
    }

    if (session.status === "DRAFT") {
      await prisma.corAuditSession.update({
        where: { id: session.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    return success({ id });
  } catch (error) {
    return failure(error);
  }
}

export async function exportAuditSessionBccsaExcel(
  companyId: string,
  sessionId: string,
  options?: { headerOverrides?: Partial<BccsaExportHeader> },
): Promise<ServiceResult<{ buffer: Buffer; filename: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const detail = await getAuditSessionDetail(companyId, sessionId);
    if (!detail.data) {
      return unavailable(detail.error ?? "Audit session not found");
    }

    const { session, questions } = detail.data;
    const company = session.company;

    const staff = await prisma.employee.findMany({
      where: { companyId, ...notDeleted },
      select: {
        title: true,
        department: true,
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    const fullName = (e: (typeof staff)[number]) =>
      `${e.user.firstName} ${e.user.lastName}`.trim();

    const owner =
      staff.find((e) => /chris@/i.test(e.user.email)) ??
      staff.find((e) => /ceo|owner/i.test(`${e.title ?? ""} ${e.department ?? ""}`));
    const secondary =
      staff.find((e) => /britt@|leigh@|safety@/i.test(e.user.email)) ??
      staff.find((e) => /safety/i.test(`${e.title ?? ""} ${e.department ?? ""}`));

    const mailingRaw =
      company.address?.trim() ||
      (company.slug === "ridgetechone"
        ? "#503 – 4211 Kingsway, Burnaby, BC V5H 1Z6"
        : null);
    const parsed = parseCanadianMailingAddress(mailingRaw);

    const tradeName =
      company.slug === "ridgetechone"
        ? "Ridgetechone"
        : company.name.includes(" ")
          ? company.name.split(/\s+/).slice(0, 2).join(" ")
          : company.name;

    const header: BccsaExportHeader = {
      legalName: company.name,
      tradeName,
      mailingStreet: parsed.street ?? mailingRaw,
      cityProvince: parsed.cityProvince,
      postalCode: parsed.postalCode,
      phone:
        company.phone?.trim() ||
        (company.slug === "ridgetechone" ? "(604) 335-9216" : null),
      auditStart: session.startedAt ?? session.scheduledAt ?? session.createdAt,
      auditEnd:
        session.completedAt ??
        session.startedAt ??
        session.scheduledAt ??
        session.createdAt,
      programSize: "LARGE",
      auditKind: "MAINTENANCE",
      primaryContact: session.leadEmployee
        ? `${session.leadEmployee.user.firstName} ${session.leadEmployee.user.lastName}`
        : owner
          ? fullName(owner)
          : null,
      primaryEmail:
        session.leadEmployee?.user.email ?? owner?.user.email ?? null,
      secondaryContact: secondary ? fullName(secondary) : null,
      secondaryEmail: secondary?.user.email ?? null,
      ownerName: owner ? fullName(owner) : null,
      ownerEmail: owner?.user.email ?? null,
      ...options?.headerOverrides,
    };

    const elementComments: Record<string, string> = {};
    for (const q of questions) {
      const technique = statusToTechniqueMark(q.status, q.score);
      if (!technique && !q.comments && q.evidence.length === 0) continue;

      const existing = elementComments[q.elementCode] ?? "";
      const adequate =
        q.status === "ADEQUATE" || q.status === "NOT_APPLICABLE";
      if (!existing) {
        elementComments[q.elementCode] =
          `Element ${q.elementCode} (${q.elementTitle}): internal review of company Safety Program documentation. ` +
          (adequate
            ? "Documentation reviewed and scored Adequate pending interview/observation confirmation where required."
            : `Current status includes ${q.status.replaceAll("_", " ").toLowerCase()} items — see question comments.`);
      }
    }

    const answers = questions
      .map((q) => {
        const technique = statusToTechniqueMark(q.status, q.score);
        const evidenceTitles = q.evidence
          .map((e) => e.title)
          .filter(Boolean)
          .slice(0, 10);
        const evidenceNote =
          evidenceTitles.length > 0
            ? `Evidence on file: ${evidenceTitles.join("; ")}${
                q.evidence.length > evidenceTitles.length
                  ? ` (+${q.evidence.length - evidenceTitles.length} more)`
                  : ""
              }.`
            : null;
        const comments = [q.comments?.trim(), evidenceNote]
          .filter(Boolean)
          .join("\n");
        if (!technique && !comments) return null;
        return {
          questionKey: q.number,
          technique,
          comments: comments || null,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a != null);

    const built = await buildBccsaCorWorkbook({
      header,
      answers,
      elementComments,
      filenameBase: company.name,
    });

    return success(built);
  } catch (error) {
    return failure(error);
  }
}
