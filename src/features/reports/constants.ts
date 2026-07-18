export const REPORT_TYPE_META = [
  {
    type: "worker_competency_profile",
    title: "Worker Competency Profile",
    description:
      "Full worker profile with competency status, assessment history, and trends.",
    requires: "employeeId",
  },
  {
    type: "competency_passport",
    title: "Competency Passport",
    description:
      "Verified competencies with worker photo and supporting signatures.",
    requires: "employeeId",
  },
  {
    type: "practical_assessment",
    title: "Practical Assessment Report",
    description:
      "Permanent assessment record with comments, trends, signatures, and photos.",
    requires: "assessmentId",
  },
  {
    type: "field_observation",
    title: "Field Observation Report",
    description: "Field observation notes, follow-up, and optional photo evidence.",
    requires: "observationId",
  },
  {
    type: "supervisor_progress",
    title: "Supervisor Progress Report",
    description: "Roll-up of direct reports’ competency progress.",
    requires: "supervisorId",
  },
  {
    type: "project_competency_summary",
    title: "Project Competency Summary",
    description: "Project-scoped competency status counts and active cells.",
    requires: "projectId",
  },
  {
    type: "company_training_matrix",
    title: "Company Training Matrix",
    description: "Company-wide workers × competencies matrix PDF.",
    requires: null,
  },
  {
    type: "competency_expiry",
    title: "Competency Expiry Report",
    description:
      "Assessments, certificates, and matrix items approaching or past expiry.",
    requires: null,
  },
] as const;

export type ReportRequires =
  (typeof REPORT_TYPE_META)[number]["requires"];
