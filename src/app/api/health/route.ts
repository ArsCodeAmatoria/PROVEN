import { NextResponse } from "next/server";

import { hasDatabaseConfig, hasSupabaseConfig } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "proven",
    timestamp: new Date().toISOString(),
    checks: {
      database: hasDatabaseConfig(),
      supabase: hasSupabaseConfig(),
    },
  });
}
