export const COMPETENCY_STATUS_LABELS = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
} as const;

export const COMPETENCY_DIFFICULTY_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
} as const;

export const COMPETENCY_TABS = [
  { value: "overview", label: "Overview" },
  { value: "demonstrations", label: "Demonstrations" },
  { value: "references", label: "References" },
  { value: "attachments", label: "Attachments" },
  { value: "history", label: "History" },
] as const;
