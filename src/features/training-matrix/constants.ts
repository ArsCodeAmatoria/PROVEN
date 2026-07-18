import type { TrainingMatrixDisplayStatus } from "@/lib/validations/training-matrix";

export const TRAINING_MATRIX_STATUS_LABELS: Record<
  TrainingMatrixDisplayStatus,
  string
> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPETENT: "Competent",
  VERIFIED: "Verified",
  NEEDS_REASSESSMENT: "Needs Reassessment",
};

/** Tailwind classes for color-coded matrix cells. */
export const TRAINING_MATRIX_STATUS_STYLES: Record<
  TrainingMatrixDisplayStatus,
  string
> = {
  NOT_STARTED: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-amber-100 text-amber-900 border-amber-200",
  COMPETENT: "bg-emerald-100 text-emerald-900 border-emerald-200",
  VERIFIED: "bg-sky-100 text-sky-900 border-sky-200",
  NEEDS_REASSESSMENT: "bg-rose-100 text-rose-900 border-rose-200",
};

export const TRAINING_MATRIX_STATUS_HEX: Record<
  TrainingMatrixDisplayStatus,
  string
> = {
  NOT_STARTED: "F1F5F9",
  IN_PROGRESS: "FEF3C7",
  COMPETENT: "D1FAE5",
  VERIFIED: "E0F2FE",
  NEEDS_REASSESSMENT: "FFE4E6",
};

export const TRAINING_MATRIX_STATUSES = Object.keys(
  TRAINING_MATRIX_STATUS_LABELS,
) as TrainingMatrixDisplayStatus[];
