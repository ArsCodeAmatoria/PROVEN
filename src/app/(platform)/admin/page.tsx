import type { Metadata } from "next";

import {
  AdminDashboardHeader,
  AdminStatGrid,
} from "@/features/admin/components/admin-stat-grid";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlatformDashboardStats } from "@/services/admin.service";

export const metadata: Metadata = {
  title: "Platform Admin",
};

export default async function AdminDashboardPage() {
  const result = await getPlatformDashboardStats();

  return (
    <div className="space-y-6">
      <AdminDashboardHeader />
      {result.data ? (
        <AdminStatGrid stats={result.data} />
      ) : (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Unable to load dashboard</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
