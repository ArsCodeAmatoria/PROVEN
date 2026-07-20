import type { Metadata } from "next";

import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlatformSystemInfo } from "@/services/admin.service";

export const metadata: Metadata = {
  title: "System · Platform Admin",
};

export default async function AdminSystemPage() {
  const result = await getPlatformSystemInfo();

  return (
    <div className="space-y-6">
      <PageHeader
        title="System"
        description="Infrastructure health and platform entity counts."
      />
      {result.error || !result.data ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Unable to load system info</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Companies" value={result.data.counts.companies} />
            <StatCard label="Users" value={result.data.counts.users} />
            <StatCard label="Employees" value={result.data.counts.employees} />
            <StatCard label="Audit logs" value={result.data.counts.auditLogs} />
          </div>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Health checks</CardTitle>
              <CardDescription>
                Live probes for database connectivity and Supabase env presence.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <span>Database</span>
                <Badge
                  variant={
                    result.data.health.database ? "success" : "destructive"
                  }
                >
                  {result.data.health.database ? "Healthy" : "Down"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <span>Supabase</span>
                <Badge
                  variant={
                    result.data.health.supabase ? "success" : "warning"
                  }
                >
                  {result.data.health.supabase
                    ? "Configured"
                    : "Not configured"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
