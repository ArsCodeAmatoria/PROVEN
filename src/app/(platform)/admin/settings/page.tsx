import type { Metadata } from "next";

import { PageHeader, StatCard } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getPlatformDashboardStats,
  getPlatformSystemInfo,
} from "@/services/admin.service";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Settings · Platform Admin",
};

export default async function AdminSettingsPage() {
  const [stats, system] = await Promise.all([
    getPlatformDashboardStats(),
    getPlatformSystemInfo(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Platform configuration summary and environment checks."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="App name"
          value={env.NEXT_PUBLIC_APP_NAME}
          description={env.NEXT_PUBLIC_APP_URL}
        />
        <StatCard
          label="Environment"
          value={env.NODE_ENV}
        />
        <StatCard
          label="Database"
          value={
            system.data?.health.database
              ? "Connected"
              : stats.data?.systemHealth.database
                ? "Connected"
                : "Unavailable"
          }
        />
        <StatCard
          label="Supabase"
          value={
            system.data?.health.supabase || stats.data?.systemHealth.supabase
              ? "Configured"
              : "Missing"
          }
        />
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Platform defaults</CardTitle>
          <CardDescription>
            Super Admin manages tenants from this portal. Company workspace
            branding uses each tenant&apos;s primary and secondary colors when set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Active companies:{" "}
            <span className="font-medium text-foreground">
              {stats.data?.companies ?? "—"}
            </span>
          </p>
          <p>
            Active workers:{" "}
            <span className="font-medium text-foreground">
              {stats.data?.activeWorkers ?? "—"}
            </span>
          </p>
          <p>
            Active users:{" "}
            <span className="font-medium text-foreground">
              {stats.data?.activeUsers ?? "—"}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
