import { z } from "zod";

export const reportTypeSchema = z.enum([
  "worker_competency_profile",
  "competency_passport",
  "practical_assessment",
  "field_observation",
  "supervisor_progress",
  "project_competency_summary",
  "company_training_matrix",
  "competency_expiry",
]);

export type ReportType = z.infer<typeof reportTypeSchema>;

export const generateReportSchema = z
  .object({
    type: reportTypeSchema,
    employeeId: z.string().uuid().optional(),
    assessmentId: z.string().uuid().optional(),
    observationId: z.string().uuid().optional(),
    supervisorId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    includePhotos: z
      .union([z.boolean(), z.literal("true"), z.literal("false")])
      .optional()
      .transform((value) => {
        if (value === undefined) return true;
        if (typeof value === "boolean") return value;
        return value === "true";
      }),
  })
  .superRefine((data, ctx) => {
    if (
      (data.type === "worker_competency_profile" ||
        data.type === "competency_passport") &&
      !data.employeeId
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Select a worker.",
        path: ["employeeId"],
      });
    }
    if (data.type === "practical_assessment" && !data.assessmentId) {
      ctx.addIssue({
        code: "custom",
        message: "Select an assessment.",
        path: ["assessmentId"],
      });
    }
    if (data.type === "field_observation" && !data.observationId) {
      ctx.addIssue({
        code: "custom",
        message: "Select an observation.",
        path: ["observationId"],
      });
    }
    if (data.type === "supervisor_progress" && !data.supervisorId) {
      ctx.addIssue({
        code: "custom",
        message: "Select a supervisor.",
        path: ["supervisorId"],
      });
    }
    if (data.type === "project_competency_summary" && !data.projectId) {
      ctx.addIssue({
        code: "custom",
        message: "Select a project.",
        path: ["projectId"],
      });
    }
  });

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
