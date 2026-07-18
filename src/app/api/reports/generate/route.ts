import { NextResponse } from "next/server";

import { buildReportPdf } from "@/lib/pdf/build-report";
import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import { generateReportSchema } from "@/lib/validations/report";
import {
  buildReportPayload,
  reportFileSlug,
} from "@/services/reports.service";

export async function GET(request: Request) {
  await requirePermission("reports");
  const { companyId } = await requireCompanyId();

  const url = new URL(request.url);
  const parsed = generateReportSchema.safeParse({
    type: url.searchParams.get("type") ?? undefined,
    employeeId: url.searchParams.get("employeeId") || undefined,
    assessmentId: url.searchParams.get("assessmentId") || undefined,
    observationId: url.searchParams.get("observationId") || undefined,
    supervisorId: url.searchParams.get("supervisorId") || undefined,
    projectId: url.searchParams.get("projectId") || undefined,
    includePhotos: url.searchParams.get("includePhotos") ?? "true",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid report request." },
      { status: 400 },
    );
  }

  const payload = await buildReportPayload(companyId, parsed.data);
  if (!payload.data) {
    return NextResponse.json(
      { error: payload.error ?? "Unable to build report." },
      { status: 500 },
    );
  }

  try {
    const buffer = await buildReportPdf(payload.data);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `${reportFileSlug(parsed.data.type)}-${stamp}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
