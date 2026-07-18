import type {
  AssessmentRating,
  TrainingMatrixCellStatus,
} from "@/generated/prisma/client";
import type { TrainingMatrixDisplayStatus } from "@/lib/validations/training-matrix";

const COMPETENT_RATINGS: AssessmentRating[] = [
  "COMPETENT",
  "EXCEEDS_STANDARD",
  "PASS",
];

export function isCompetentAssessmentRating(
  rating: AssessmentRating | null | undefined,
) {
  return rating != null && COMPETENT_RATINGS.includes(rating);
}

export function mapStoredStatusToDisplay(
  status: TrainingMatrixCellStatus,
): TrainingMatrixDisplayStatus {
  if (status === "EXPIRED") return "NEEDS_REASSESSMENT";
  if (status === "EXEMPT") return "NOT_STARTED";
  if (
    status === "NOT_STARTED" ||
    status === "IN_PROGRESS" ||
    status === "COMPETENT" ||
    status === "VERIFIED" ||
    status === "NEEDS_REASSESSMENT"
  ) {
    return status;
  }
  return "NOT_STARTED";
}

export function matrixStatusFromAssessment(input: {
  rating: AssessmentRating;
  hasInstructorSignature: boolean;
  hasApprenticeSignature: boolean;
}): TrainingMatrixCellStatus {
  if (
    input.rating === "NEEDS_IMPROVEMENT" ||
    input.rating === "NOT_OBSERVED"
  ) {
    return "IN_PROGRESS";
  }

  if (
    isCompetentAssessmentRating(input.rating) &&
    input.hasInstructorSignature &&
    input.hasApprenticeSignature
  ) {
    return "VERIFIED";
  }

  if (isCompetentAssessmentRating(input.rating)) {
    return "COMPETENT";
  }

  return "IN_PROGRESS";
}
