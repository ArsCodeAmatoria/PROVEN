import { NextResponse } from "next/server";

import {
  buildTrainingMatrixExcel,
  buildTrainingMatrixPdf,
} from "@/lib/training-matrix-export";
import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import {
  trainingMatrixExportFormatSchema,
  trainingMatrixFiltersSchema,
  type TrainingMatrixDisplayStatus,
} from "@/lib/validations/training-matrix";
import { getTrainingMatrix } from "@/services/training-matrix.service";

export async function GET(request: Request) {
  await requirePermission("training-matrix");
  const { companyId } = await requireCompanyId();

  const url = new URL(request.url);
  const formatParsed = trainingMatrixExportFormatSchema.safeParse(
    url.searchParams.get("format") ?? "xlsx",
  );
  if (!formatParsed.success) {
    return NextResponse.json({ error: "Invalid export format." }, { status: 400 });
  }

  const filtersParsed = trainingMatrixFiltersSchema.safeParse({
    projectId: url.searchParams.get("projectId") || undefined,
    trade: url.searchParams.get("trade") || undefined,
    crew: url.searchParams.get("crew") || undefined,
    supervisorId: url.searchParams.get("supervisorId") || undefined,
    status:
      (url.searchParams.get("status") as TrainingMatrixDisplayStatus | null) ||
      undefined,
  });

  if (!filtersParsed.success) {
    return NextResponse.json({ error: "Invalid filters." }, { status: 400 });
  }

  const matrix = await getTrainingMatrix(companyId, filtersParsed.data);
  if (!matrix.data) {
    return NextResponse.json(
      { error: matrix.error ?? "Unable to build matrix." },
      { status: 500 },
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = `training-matrix-${stamp}`;

  if (formatParsed.data === "pdf") {
    const buffer = buildTrainingMatrixPdf(matrix.data);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
      },
    });
  }

  const buffer = await buildTrainingMatrixExcel(matrix.data);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
    },
  });
}
