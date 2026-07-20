import { NextResponse } from "next/server";

import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import { exportAuditSessionBccsaExcel } from "@/services/compliance.service";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  await requirePermission("compliance");
  const { companyId } = await requireCompanyId();
  const { sessionId } = await context.params;

  const result = await exportAuditSessionBccsaExcel(companyId, sessionId);
  if (!result.data) {
    return NextResponse.json(
      { error: result.error ?? "Unable to export BCCSA workbook." },
      { status: result.error?.toLowerCase().includes("not found") ? 404 : 500 },
    );
  }

  const { buffer, filename } = result.data;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.ms-excel.sheet.macroEnabled.12",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
