import { TRAINING_MATRIX_STATUS_LABELS } from "@/features/training-matrix/constants";
import { buildTrainingMatrixPdf } from "@/lib/training-matrix-export";
import type { ReportPayload } from "@/services/reports.service";

import {
  createReportDoc,
  drawKeyValueGrid,
  drawParagraph,
  drawPhotoEvidence,
  drawReportHeader,
  drawSectionTitle,
  drawSignatureBlock,
  drawSimpleTable,
  drawTrendBars,
  drawWorkerCard,
  finalizeReport,
  syncCursor,
} from "./shared";

export async function buildReportPdf(payload: ReportPayload) {
  switch (payload.kind) {
    case "company_training_matrix": {
      // Reuse existing matrix PDF, then stamp company branding via wrapper page if needed.
      return buildTrainingMatrixPdf(payload.matrix);
    }
    case "worker_competency_profile":
      return buildWorkerProfilePdf(payload);
    case "competency_passport":
      return buildPassportPdf(payload);
    case "practical_assessment":
      return buildPracticalAssessmentPdf(payload);
    case "field_observation":
      return buildFieldObservationPdf(payload);
    case "supervisor_progress":
      return buildSupervisorProgressPdf(payload);
    case "project_competency_summary":
      return buildProjectSummaryPdf(payload);
    case "competency_expiry":
      return buildExpiryPdf(payload);
    default:
      throw new Error("Unsupported report type.");
  }
}

async function buildWorkerProfilePdf(
  payload: Extract<ReportPayload, { kind: "worker_competency_profile" }>,
) {
  const doc = createReportDoc("Worker Competency Profile");
  let y = await drawReportHeader(doc, {
    companyName: payload.company.name,
    reportTitle: "Worker Competency Profile",
    subtitle: payload.company.address,
    logoUrl: payload.company.logoUrl,
  });
  y = syncCursor(doc, y);

  y = await drawWorkerCard(doc, y, {
    name: payload.worker.name,
    photoUrl: payload.worker.photoUrl,
    meta: [
      [payload.worker.title, payload.worker.trade]
        .filter(Boolean)
        .join(" · "),
      payload.worker.employeeNumber
        ? `Employee #${payload.worker.employeeNumber}`
        : "",
      payload.worker.supervisorName
        ? `Supervisor: ${payload.worker.supervisorName}`
        : "",
      `Level ${payload.worker.level}`,
    ].filter(Boolean),
  });
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Competency Status", y);
  y = drawSimpleTable(
    doc,
    y,
    ["Code", "Competency", "Status", "Last assessed"],
    payload.competencies.map((item) => [
      item.code,
      item.title,
      item.status,
      item.lastAssessedAt,
    ]),
  );
  y = syncCursor(doc, y);

  y = drawTrendBars(doc, y, payload.trends);
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Assessment History", y);
  y = drawSimpleTable(
    doc,
    y,
    ["Date", "Assessment", "Rating", "Outcome"],
    payload.assessments.map((item) => [
      item.date,
      item.title,
      item.rating,
      item.outcome,
    ]),
  );
  y = syncCursor(doc, y);

  if (payload.certificates.length > 0) {
    y = drawSectionTitle(doc, "Certificates", y);
    drawSimpleTable(
      doc,
      y,
      ["Certificate", "Expires", "Status"],
      payload.certificates.map((item) => [
        item.name,
        item.expiresAt,
        item.status,
      ]),
    );
  }

  return finalizeReport(doc, payload.company.name);
}

async function buildPassportPdf(
  payload: Extract<ReportPayload, { kind: "competency_passport" }>,
) {
  const doc = createReportDoc("Competency Passport");
  let y = await drawReportHeader(doc, {
    companyName: payload.company.name,
    reportTitle: "Competency Passport",
    subtitle: "Verified practical competencies",
    logoUrl: payload.company.logoUrl,
  });
  y = syncCursor(doc, y);

  y = await drawWorkerCard(doc, y, {
    name: payload.worker.name,
    photoUrl: payload.worker.photoUrl,
    meta: [
      payload.worker.trade ?? "",
      payload.worker.employeeNumber
        ? `Employee #${payload.worker.employeeNumber}`
        : "",
    ].filter(Boolean),
  });
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Verified Competencies", y);
  y = drawSimpleTable(
    doc,
    y,
    ["Code", "Competency", "Trade", "Verified"],
    payload.verified.map((item) => [
      item.code,
      item.title,
      item.trade ?? "—",
      item.verifiedAt,
    ]),
  );
  y = syncCursor(doc, y);

  await drawSignatureBlock(doc, y, payload.signatures);
  return finalizeReport(doc, payload.company.name);
}

async function buildPracticalAssessmentPdf(
  payload: Extract<ReportPayload, { kind: "practical_assessment" }>,
) {
  const doc = createReportDoc("Practical Assessment Report");
  let y = await drawReportHeader(doc, {
    companyName: payload.company.name,
    reportTitle: "Practical Assessment Report",
    subtitle: payload.assessment.title,
    logoUrl: payload.company.logoUrl,
  });
  y = syncCursor(doc, y);

  y = await drawWorkerCard(doc, y, {
    name: payload.worker.name,
    photoUrl: payload.worker.photoUrl,
    meta: [payload.worker.trade ?? "", `Level ${payload.worker.level}`].filter(
      Boolean,
    ),
  });
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Assessment Details", y);
  y = drawKeyValueGrid(doc, y, [
    { label: "Type", value: payload.assessment.type },
    { label: "Project", value: payload.assessment.projectName ?? "—" },
    {
      label: "Competency",
      value: [payload.assessment.competencyCode, payload.assessment.competencyTitle]
        .filter(Boolean)
        .join(" · "),
    },
    { label: "Assessed", value: payload.assessment.assessedAt },
    { label: "Rating", value: payload.assessment.rating },
    { label: "Outcome", value: payload.assessment.outcome },
  ]);
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Comments", y);
  y = drawParagraph(doc, y, payload.assessment.comments);
  y = drawParagraph(
    doc,
    y,
    payload.assessment.instructorNotes
      ? `Instructor notes: ${payload.assessment.instructorNotes}`
      : null,
  );
  y = drawParagraph(
    doc,
    y,
    payload.assessment.workerComments
      ? `Worker comments: ${payload.assessment.workerComments}`
      : null,
  );
  y = syncCursor(doc, y);

  y = drawTrendBars(doc, y, payload.trends);
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Assessment History", y);
  y = drawSimpleTable(
    doc,
    y,
    ["Date", "Rating", "Project"],
    payload.history.map((item) => [item.date, item.rating, item.project]),
  );
  y = syncCursor(doc, y);

  y = await drawSignatureBlock(doc, y, payload.signatures);
  y = syncCursor(doc, y);
  await drawPhotoEvidence(doc, y, payload.photos, true);

  return finalizeReport(doc, payload.company.name);
}

async function buildFieldObservationPdf(
  payload: Extract<ReportPayload, { kind: "field_observation" }>,
) {
  const doc = createReportDoc("Field Observation Report");
  let y = await drawReportHeader(doc, {
    companyName: payload.company.name,
    reportTitle: "Field Observation Report",
    subtitle: payload.observation.type,
    logoUrl: payload.company.logoUrl,
  });
  y = syncCursor(doc, y);

  y = await drawWorkerCard(doc, y, {
    name: payload.worker.name,
    photoUrl: payload.worker.photoUrl,
    meta: [payload.worker.trade ?? ""].filter(Boolean),
  });
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Observation Details", y);
  y = drawKeyValueGrid(doc, y, [
    { label: "Observed", value: payload.observation.observedAt },
    { label: "Observer", value: payload.observation.observerName },
    { label: "Project", value: payload.observation.projectName ?? "—" },
    {
      label: "Competency",
      value: payload.observation.competencyTitle ?? "—",
    },
    { label: "Rating", value: payload.observation.rating ?? "—" },
    { label: "Follow-up", value: payload.observation.followUpStatus },
  ]);
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Notes", y);
  y = drawParagraph(doc, y, payload.observation.notes);
  y = drawParagraph(doc, y, payload.observation.followUpNotes);
  y = syncCursor(doc, y);

  await drawPhotoEvidence(doc, y, payload.photos, true);
  return finalizeReport(doc, payload.company.name);
}

async function buildSupervisorProgressPdf(
  payload: Extract<ReportPayload, { kind: "supervisor_progress" }>,
) {
  const doc = createReportDoc("Supervisor Progress Report");
  let y = await drawReportHeader(doc, {
    companyName: payload.company.name,
    reportTitle: "Supervisor Progress Report",
    subtitle: payload.supervisor.name,
    logoUrl: payload.company.logoUrl,
  });
  y = syncCursor(doc, y);

  y = await drawWorkerCard(doc, y, {
    name: payload.supervisor.name,
    photoUrl: payload.supervisor.photoUrl,
    meta: [`Direct reports: ${payload.reports.length}`],
  });
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Crew Progress", y);
  drawSimpleTable(
    doc,
    y,
    ["Worker", "Trade", "Verified", "Competent", "In progress", "Latest"],
    payload.reports.map((item) => [
      item.name,
      item.trade ?? "—",
      String(item.verifiedCount),
      String(item.competentCount),
      String(item.inProgressCount),
      item.recentAssessment,
    ]),
  );

  return finalizeReport(doc, payload.company.name);
}

async function buildProjectSummaryPdf(
  payload: Extract<ReportPayload, { kind: "project_competency_summary" }>,
) {
  const doc = createReportDoc("Project Competency Summary");
  let y = await drawReportHeader(doc, {
    companyName: payload.company.name,
    reportTitle: "Project Competency Summary",
    subtitle: `${payload.project.code} · ${payload.project.name}`,
    logoUrl: payload.company.logoUrl,
  });
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Status Summary", y);
  y = drawSimpleTable(
    doc,
    y,
    ["Status", "Count"],
    Object.entries(payload.summary).map(([status, count]) => [
      TRAINING_MATRIX_STATUS_LABELS[
        status as keyof typeof TRAINING_MATRIX_STATUS_LABELS
      ] ?? status,
      String(count),
    ]),
  );
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Active Competency Cells", y);
  drawSimpleTable(
    doc,
    y,
    ["Worker", "Competency", "Status", "Last assessed"],
    payload.rows.map((row) => [
      row.worker,
      row.competency,
      row.status,
      row.lastAssessedAt,
    ]),
  );

  return finalizeReport(doc, payload.company.name);
}

async function buildExpiryPdf(
  payload: Extract<ReportPayload, { kind: "competency_expiry" }>,
) {
  const doc = createReportDoc("Competency Expiry Report");
  let y = await drawReportHeader(doc, {
    companyName: payload.company.name,
    reportTitle: "Competency Expiry Report",
    subtitle: "Assessments, certificates, and matrix items due for renewal",
    logoUrl: payload.company.logoUrl,
  });
  y = syncCursor(doc, y);

  y = drawSectionTitle(doc, "Upcoming & Expired Items", y);
  drawSimpleTable(
    doc,
    y,
    ["Worker", "Item", "Type", "Expires", "Status"],
    payload.items.map((item) => [
      item.worker,
      item.item,
      item.kind,
      item.expiresAt,
      item.status,
    ]),
  );

  return finalizeReport(doc, payload.company.name);
}
