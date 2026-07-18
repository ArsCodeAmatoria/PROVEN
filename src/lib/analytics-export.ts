import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { AnalyticsDashboardData } from "@/services/analytics.service";
import { formatDate } from "@/utils/format";

export async function buildAnalyticsExcel(data: AnalyticsDashboardData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Proven";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Summary");
  summary.addRow(["Company", data.companyName]);
  summary.addRow([
    "Company competency %",
    data.companyCompetencyPercent,
  ]);
  summary.addRow([
    "Workers needing reassessment",
    data.workersRequiringReassessment.length,
  ]);
  summary.addRow([
    "Upcoming reassessments",
    data.upcomingReassessments.length,
  ]);
  summary.getColumn(1).width = 32;
  summary.getColumn(2).width = 24;

  const workers = workbook.addWorksheet("Reassessment Workers");
  workers.addRow(["Worker", "Trade", "Competencies", "Reason"]);
  for (const item of data.workersRequiringReassessment) {
    workers.addRow([
      item.name,
      item.trade ?? "",
      item.competencyCount,
      item.reason,
    ]);
  }

  const competencies = workbook.addWorksheet("Competency Stats");
  competencies.addRow([
    "Code",
    "Title",
    "Trade",
    "Assessments",
    "Pass rate %",
    "Avg score",
  ]);
  for (const item of data.competencyStats) {
    competencies.addRow([
      item.code,
      item.title,
      item.trade ?? "",
      item.assessmentCount,
      item.passRate,
      item.averageScore,
    ]);
  }

  const instructors = workbook.addWorksheet("Instructor Activity");
  instructors.addRow([
    "Instructor",
    "Assessments",
    "Observations",
    "Demonstrations",
    "Total",
  ]);
  for (const item of data.instructorStats) {
    instructors.addRow([
      item.name,
      item.assessmentCount,
      item.observationCount,
      item.demonstrationCount,
      item.totalActivity,
    ]);
  }

  const projects = workbook.addWorksheet("Project Completion");
  projects.addRow(["Code", "Project", "Completed", "Total", "% Complete"]);
  for (const item of data.projectCompletionDetails) {
    projects.addRow([
      item.code,
      item.name,
      item.completed,
      item.total,
      item.percentComplete,
    ]);
  }

  const upcoming = workbook.addWorksheet("Upcoming Reassessments");
  upcoming.addRow(["Worker", "Competency", "Due", "Source"]);
  for (const item of data.upcomingReassessments) {
    upcoming.addRow([
      item.workerName,
      item.competencyTitle,
      formatDate(item.dueAt),
      item.source,
    ]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildAnalyticsPdf(data: AnalyticsDashboardData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Analytics — ${data.companyName}`, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Company competency completion: ${data.companyCompetencyPercent}%`,
    40,
    58,
  );

  autoTable(doc, {
    startY: 72,
    head: [["Metric", "Value"]],
    body: [
      ["Workers needing reassessment", String(data.workersRequiringReassessment.length)],
      ["Upcoming reassessments", String(data.upcomingReassessments.length)],
      ["Tracked competencies", String(data.competencyStats.length)],
      ["Active instructors", String(data.instructorStats.length)],
    ],
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  const afterSummary =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 120;

  autoTable(doc, {
    startY: afterSummary + 16,
    head: [["Most assessed", "Count"]],
    body: data.mostAssessedCompetencies.map((item) => [
      item.label,
      String(item.value),
    ]),
    margin: { left: 40, right: 40 },
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  const afterMost =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? afterSummary + 80;

  autoTable(doc, {
    startY: afterMost + 16,
    head: [["Lowest pass rate", "%"]],
    body: data.lowestPassRateCompetencies.map((item) => [
      item.label,
      String(item.value),
    ]),
    margin: { left: 40, right: 40 },
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  doc.addPage();
  autoTable(doc, {
    startY: 40,
    head: [["Worker", "Trade", "Competencies"]],
    body: data.workersRequiringReassessment.map((item) => [
      item.name,
      item.trade ?? "—",
      String(item.competencyCount),
    ]),
    margin: { left: 40, right: 40 },
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  const afterWorkers =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 120;

  autoTable(doc, {
    startY: afterWorkers + 16,
    head: [["Upcoming", "Competency", "Due", "Source"]],
    body: data.upcomingReassessments.map((item) => [
      item.workerName,
      item.competencyTitle,
      formatDate(item.dueAt),
      item.source,
    ]),
    margin: { left: 40, right: 40 },
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  return Buffer.from(doc.output("arraybuffer"));
}
