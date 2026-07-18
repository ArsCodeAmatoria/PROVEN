export const ASSESSMENT_RATING_LABELS = {
  PASS: "Pass",
  NEEDS_IMPROVEMENT: "Needs Improvement",
  COMPETENT: "Competent",
  EXCEEDS_STANDARD: "Exceeds Standard",
  NOT_OBSERVED: "Not Observed",
} as const;

export const ASSESSMENT_RATING_SCORES = {
  NOT_OBSERVED: 0,
  NEEDS_IMPROVEMENT: 1,
  PASS: 2,
  COMPETENT: 3,
  EXCEEDS_STANDARD: 4,
} as const;

export const ASSESSMENT_STATUS_LABELS = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const ASSESSMENT_TYPE_LABELS = {
  PRACTICAL: "Practical",
  WRITTEN: "Written",
  OBSERVATION: "Observation",
  PORTFOLIO: "Portfolio",
  ORAL: "Oral",
  CONTINUOUS: "Continuous",
} as const;

export const ASSESSMENT_SIGNER_ROLE_LABELS = {
  INSTRUCTOR: "Instructor",
  APPRENTICE: "Apprentice",
  WITNESS: "Witness",
} as const;

export const ASSESSMENT_WIZARD_STEPS = [
  { id: "employee", label: "Employee" },
  { id: "project", label: "Project" },
  { id: "category", label: "Category" },
  { id: "competency", label: "Competency" },
  { id: "assessment", label: "Assessment" },
] as const;
