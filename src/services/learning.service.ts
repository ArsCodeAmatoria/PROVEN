import "server-only";

import { cache } from "react";

import { LessonProgressStatus, type Prisma } from "@/generated/prisma/client";
import { getSlideCourse } from "@/features/learning/lib/competency-course";
import { RIGGER_COMPETENCY_UNIT_IDS } from "@/features/learning/lib/competency-course-types";
import { DEFAULT_TRACK } from "@/features/learning/lib/tracks";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";

import { failure, getDatabaseConfigError, success, unavailable } from "./base";

const CURRICULUM_CODE = "TOWER-CRANE-RIGGER";
const MODULE_CODE = "RIGGER-COMPETENCY";
const EXPECTED_LESSON_COUNT = RIGGER_COMPETENCY_UNIT_IDS.length;

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
 * Short-circuits when live lesson keys already match the rigger unit list.
 */
export const ensureRiggerCompetencyCurriculum = cache(async (
  companyId: string,
): Promise<ServiceResult<{ curriculumId: string; moduleId: string }>> => {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.curriculum.findFirst({
      where: { companyId, code: CURRICULUM_CODE, deletedAt: null },
      select: {
        id: true,
        modules: {
          where: { code: MODULE_CODE, deletedAt: null },
          take: 1,
          select: {
            id: true,
            lessons: {
              where: { deletedAt: null },
              select: { contentKey: true },
            },
          },
        },
      },
    });

    const existingModule = existing?.modules[0];
    if (existing && existingModule) {
      const keys = new Set(existingModule.lessons.map((l) => l.contentKey));
      const expectedKeys = RIGGER_COMPETENCY_UNIT_IDS.map(unitContentKey);
      const synced =
        existingModule.lessons.length === EXPECTED_LESSON_COUNT &&
        expectedKeys.every((key) => keys.has(key));
      if (synced) {
        return success({
          curriculumId: existing.id,
          moduleId: existingModule.id,
        });
      }
    }

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

    const curriculumModule = await prisma.curriculumModule.upsert({
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
            moduleId: curriculumModule.id,
            contentKey,
          },
        },
        create: {
          moduleId: curriculumModule.id,
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

    return success({
      curriculumId: curriculum.id,
      moduleId: curriculumModule.id,
    });
  } catch (error) {
    return failure(error);
  }
});

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

    const [curriculum, curriculumModule, enrolment, lessons] = await Promise.all([
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
      moduleId: curriculumModule.id,
      moduleTitle: curriculumModule.title,
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
