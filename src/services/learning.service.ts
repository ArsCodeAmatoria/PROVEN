import "server-only";

import { LessonProgressStatus, type Prisma } from "@/generated/prisma/client";
import { getSlideCourse } from "@/features/learning/lib/competency-course";
import { DEFAULT_TRACK } from "@/features/learning/lib/tracks";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";

import { failure, getDatabaseConfigError, success, unavailable } from "./base";

const CURRICULUM_CODE = "TOWER-CRANE-RIGGER";
const MODULE_CODE = "RIGGER-COMPETENCY";

export type LessonStatusView = {
  lessonId: string;
  contentKey: string;
  title: string;
  sortOrder: number;
  estimatedMinutes: number | null;
  unitId: string;
  status: LessonProgressStatus;
  presentHref: string;
  completedAt: Date | null;
};

export type LearningHubView = {
  curriculumId: string;
  curriculumTitle: string;
  moduleId: string;
  moduleTitle: string;
  enrolmentId: string | null;
  lessons: LessonStatusView[];
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  slideCourseHref: string;
};

function unitContentKey(unitId: string) {
  return `${DEFAULT_TRACK}:${unitId}`;
}

/**
 * Idempotently mirror Pull slide units into Proven curriculum tables.
 * Does not alter slide JSON or the viewer — only catalog + progress rows.
 */
export async function ensureRiggerCompetencyCurriculum(
  companyId: string,
): Promise<ServiceResult<{ curriculumId: string; moduleId: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const course = getSlideCourse(DEFAULT_TRACK);

    const curriculum = await prisma.curriculum.upsert({
      where: {
        companyId_code: { companyId, code: CURRICULUM_CODE },
      },
      create: {
        companyId,
        code: CURRICULUM_CODE,
        title: "Tower Crane Rigger",
        description: course.description,
        isActive: true,
        sortOrder: 0,
      },
      update: {
        title: "Tower Crane Rigger",
        description: course.description,
        isActive: true,
        deletedAt: null,
      },
    });

    const module = await prisma.curriculumModule.upsert({
      where: {
        curriculumId_code: {
          curriculumId: curriculum.id,
          code: MODULE_CODE,
        },
      },
      create: {
        curriculumId: curriculum.id,
        code: MODULE_CODE,
        title: course.title,
        description: course.description,
        sortOrder: 0,
      },
      update: {
        title: course.title,
        description: course.description,
        deletedAt: null,
      },
    });

    for (const [index, unit] of course.units.entries()) {
      const contentKey = unitContentKey(unit.id);
      await prisma.curriculumLesson.upsert({
        where: {
          moduleId_contentKey: {
            moduleId: module.id,
            contentKey,
          },
        },
        create: {
          moduleId: module.id,
          contentKey,
          title: unit.label,
          sortOrder: index,
          estimatedMinutes: unit.durationMin ?? null,
        },
        update: {
          title: unit.label,
          sortOrder: index,
          estimatedMinutes: unit.durationMin ?? null,
          deletedAt: null,
        },
      });
    }

    return success({ curriculumId: curriculum.id, moduleId: module.id });
  } catch (error) {
    return failure(error);
  }
}

export async function getLearningHubForEmployee(
  companyId: string,
  employeeId: string,
): Promise<ServiceResult<LearningHubView>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const ensured = await ensureRiggerCompetencyCurriculum(companyId);
    if (!ensured.data) {
      return unavailable(ensured.error ?? "Curriculum unavailable");
    }

    const { curriculumId, moduleId } = ensured.data;
    const course = getSlideCourse(DEFAULT_TRACK);

    const [curriculum, module, enrolment, lessons] = await Promise.all([
      prisma.curriculum.findFirstOrThrow({
        where: { id: curriculumId, deletedAt: null },
      }),
      prisma.curriculumModule.findFirstOrThrow({
        where: { id: moduleId, deletedAt: null },
      }),
      prisma.curriculumEnrolment.findUnique({
        where: {
          curriculumId_employeeId: { curriculumId, employeeId },
        },
      }),
      prisma.curriculumLesson.findMany({
        where: { moduleId, deletedAt: null },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    let activeEnrolment = enrolment;
    if (!activeEnrolment || activeEnrolment.deletedAt) {
      activeEnrolment = await prisma.curriculumEnrolment.upsert({
        where: {
          curriculumId_employeeId: { curriculumId, employeeId },
        },
        create: {
          companyId,
          curriculumId,
          employeeId,
        },
        update: {
          deletedAt: null,
        },
      });
    }

    const progressRows = await prisma.lessonProgress.findMany({
      where: {
        enrolmentId: activeEnrolment.id,
        deletedAt: null,
      },
    });
    const progressByLesson = new Map(
      progressRows.map((row) => [row.lessonId, row]),
    );

    const lessonViews: LessonStatusView[] = lessons.map((lesson) => {
      const unitId = lesson.contentKey.split(":")[1] ?? lesson.contentKey;
      const progress = progressByLesson.get(lesson.id);
      const status = progress?.status ?? LessonProgressStatus.NOT_STARTED;
      return {
        lessonId: lesson.id,
        contentKey: lesson.contentKey,
        title: lesson.title,
        sortOrder: lesson.sortOrder,
        estimatedMinutes: lesson.estimatedMinutes,
        unitId,
        status,
        presentHref: `/slides/present?track=${DEFAULT_TRACK}&unit=${encodeURIComponent(unitId)}`,
        completedAt: progress?.completedAt ?? null,
      };
    });

    return success({
      curriculumId: curriculum.id,
      curriculumTitle: curriculum.title,
      moduleId: module.id,
      moduleTitle: module.title || course.title,
      enrolmentId: activeEnrolment.id,
      lessons: lessonViews,
      completedCount: lessonViews.filter(
        (l) => l.status === LessonProgressStatus.COMPLETED,
      ).length,
      inProgressCount: lessonViews.filter(
        (l) => l.status === LessonProgressStatus.IN_PROGRESS,
      ).length,
      notStartedCount: lessonViews.filter(
        (l) => l.status === LessonProgressStatus.NOT_STARTED,
      ).length,
      slideCourseHref: `/slides/present?track=${DEFAULT_TRACK}&slide=1`,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function markLessonInProgress(
  enrolmentId: string,
  lessonId: string,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const existing = await prisma.lessonProgress.findUnique({
      where: { enrolmentId_lessonId: { enrolmentId, lessonId } },
    });

    if (existing?.status === LessonProgressStatus.COMPLETED) {
      return success({ id: existing.id });
    }

    const row = await prisma.lessonProgress.upsert({
      where: { enrolmentId_lessonId: { enrolmentId, lessonId } },
      create: {
        enrolmentId,
        lessonId,
        status: LessonProgressStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      update: {
        status: LessonProgressStatus.IN_PROGRESS,
        startedAt: existing?.startedAt ?? new Date(),
        deletedAt: null,
      } satisfies Prisma.LessonProgressUpdateInput,
    });

    return success({ id: row.id });
  } catch (error) {
    return failure(error);
  }
}

export async function markLessonCompleted(
  enrolmentId: string,
  lessonId: string,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const row = await prisma.lessonProgress.upsert({
      where: { enrolmentId_lessonId: { enrolmentId, lessonId } },
      create: {
        enrolmentId,
        lessonId,
        status: LessonProgressStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
      },
      update: {
        status: LessonProgressStatus.COMPLETED,
        completedAt: new Date(),
        deletedAt: null,
      },
    });

    return success({ id: row.id });
  } catch (error) {
    return failure(error);
  }
}
