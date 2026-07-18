export const OBSERVATION_TYPE_LABELS = {
  POSITIVE_OBSERVATION: "Positive Observation",
  COACHING_OPPORTUNITY: "Coaching Opportunity",
  COMPETENT_DEMONSTRATION: "Competent Demonstration",
  UNSAFE_ACT: "Unsafe Act",
  UNSAFE_CONDITION: "Unsafe Condition",
  NEAR_MISS: "Near Miss",
  FOLLOW_UP_REQUIRED: "Follow-up Required",
} as const;

export const OBSERVATION_FOLLOW_UP_LABELS = {
  NONE: "None",
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CLOSED: "Closed",
} as const;
