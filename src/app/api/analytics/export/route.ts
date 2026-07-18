import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildAnalyticsExcel,
  buildAnalyticsPdf,
} from "@/lib/analytics-export";
import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import { getAnalyticsDashboard } from "@/services/analytics.service";

const formatSchema = z.enum(["xlsx", "pdf"]);

export async function GET(request: Request) {
  await requirePermission("analytics");
  const { companyId } = await requireCompanyId();

  const url = new URL(request.url);
  const parsed = formatSchema.safeParse(url.searchParams.get("format") ?? "xlsx");
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid format." }, { status: 400 });
  }

  const analytics = await getAnalyticsDashboard(companyId);
  if (!analytics.data) {
    return NextResponse.json(
      { error: analytics.error ?? "Unable to build analytics export." },
      { status: 500 },
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  if (parsed.data === "pdf") {
    const buffer = buildAnalyticsPdf(analytics.data);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="analytics-${stamp}.pdf"`,
      },
    });
  }

  const buffer = await buildAnalyticsExcel(analytics.data);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="analytics-${stamp}.xlsx"`,
    },
  });
}
