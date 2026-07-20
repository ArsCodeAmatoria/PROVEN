"use server";

import { revalidatePath } from "next/cache";

import { requireCompanyId } from "@/lib/auth/session";
import {
  markLessonCompleted,
  markLessonInProgress,
} from "@/services/learning.service";

export async function markUnitInProgressAction(input: {
  enrolmentId: string;
  lessonId: string;
}) {
  const { companyId } = await requireCompanyId();
  void companyId;
  const result = await markLessonInProgress(
    input.enrolmentId,
    input.lessonId,
  );
  if (result.error) {
    return { error: result.error };
  }
  revalidatePath("/learning");
  return { data: result.data };
}

export async function markUnitCompletedAction(input: {
  enrolmentId: string;
  lessonId: string;
}) {
  const { companyId } = await requireCompanyId();
  void companyId;
  const result = await markLessonCompleted(
    input.enrolmentId,
    input.lessonId,
  );
  if (result.error) {
    return { error: result.error };
  }
  revalidatePath("/learning");
  return { data: result.data };
}
