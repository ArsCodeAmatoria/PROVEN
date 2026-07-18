export const DEMONSTRATION_RATING_LABELS = {
  NOT_OBSERVED: "Not Observed",
  NEEDS_IMPROVEMENT: "Needs Improvement",
  COMPETENT: "Competent",
  EXCEEDS_STANDARD: "Exceeds Standard",
} as const;

export const DEMONSTRATION_RATING_SCORES = {
  NOT_OBSERVED: 0,
  NEEDS_IMPROVEMENT: 1,
  COMPETENT: 2,
  EXCEEDS_STANDARD: 3,
} as const;

export const SUCCESSFUL_DEMONSTRATION_RATINGS = [
  "COMPETENT",
  "EXCEEDS_STANDARD",
] as const;

export const DEMONSTRATION_WIZARD_STEPS = [
  { id: "worker", label: "Worker" },
  { id: "project", label: "Project" },
  { id: "category", label: "Category" },
  { id: "competency", label: "Competency" },
  { id: "evaluate", label: "Evaluate" },
] as const;
