import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { PeopleList } from "@/features/people/components/people-list";
import { isAdminRole } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import {
  listEmployees,
  listSupervisorOptions,
  listTradeOptions,
} from "@/services/people.service";

export const metadata: Metadata = {
  title: "People",
};

interface PeoplePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  await requirePermission("people");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const params = await searchParams;

  const q = first(params.q)?.trim() || undefined;
  const status = first(params.status) || undefined;
  const trade = first(params.trade) || undefined;
  const levelValue = first(params.level);
  const level = levelValue ? Number(levelValue) : undefined;
  const supervisorId = first(params.supervisorId) || undefined;
  const page = Number(first(params.page) || "1");

  const [employees, trades, supervisors] = await Promise.all([
    listEmployees(companyId, {
      q,
      status,
      trade,
      level: Number.isFinite(level) ? level : undefined,
      supervisorId,
      page: Number.isFinite(page) ? page : 1,
      pageSize: 20,
    }),
    listTradeOptions(companyId),
    listSupervisorOptions(companyId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Employee profiles, trades, hours, certificates, and competency participation."
      />
      <Suspense fallback={null}>
        <PeopleList
          result={employees.data}
          error={employees.error}
          trades={trades.data ?? []}
          supervisors={supervisors.data ?? []}
          canManage={isAdminRole(profile.role)}
          filters={{
            q,
            status,
            trade,
            level: levelValue,
            supervisorId,
          }}
        />
      </Suspense>
    </div>
  );
}
