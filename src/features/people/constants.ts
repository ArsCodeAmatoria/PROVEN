export const EMPLOYEE_STATUS_LABELS = {
  ACTIVE: "Active",
  ON_LEAVE: "On leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
} as const;

export type EmployeeStatusKey = keyof typeof EMPLOYEE_STATUS_LABELS;

export const EMPLOYEE_TABS = [
  { value: "overview", label: "Overview" },
  { value: "competencies", label: "Competencies" },
  { value: "assessments", label: "Assessments" },
  { value: "demonstrations", label: "Demonstrations" },
  { value: "observations", label: "Observations" },
  { value: "exams", label: "Written Exams" },
  { value: "hours", label: "Hours" },
  { value: "documents", label: "Documents" },
  { value: "history", label: "History" },
  { value: "timeline", label: "Timeline" },
] as const;

export function employeePhotoUrl(employee: {
  photoUrl?: string | null;
  user?: { avatarUrl?: string | null };
}) {
  return employee.photoUrl || employee.user?.avatarUrl || null;
}
