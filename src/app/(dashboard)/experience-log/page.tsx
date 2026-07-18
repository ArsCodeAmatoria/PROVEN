import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { ExperienceLogList } from "@/features/experience-log/components/experience-log-list";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import type { LiftType } from "@/generated/prisma/client";
import {
  ensureDefaultExperienceMilestones,
  getExperienceEngineOptions,
  getExperienceTotals,
  listExperienceLogs,
  listExperienceMilestoneProgress,
} from "@/services/experience-log.service";

export const metadata: Metadata = {
  title: "Experience Log",
};

interface ExperienceLogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExperienceLogPage({
  searchParams,
}: ExperienceLogPageProps) {
  await requirePermission("experience-log");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const params = await searchParams;

  const filters = {
    q: first(params.q)?.trim() || undefined,
    employeeId: first(params.employeeId) || undefined,
    projectId: first(params.projectId) || undefined,
    liftType: first(params.liftType) as LiftType | undefined,
    from: first(params.from) || undefined,
    to: first(params.to) || undefined,
  };
  const page = Number(first(params.page) || "1");

  await ensureDefaultExperienceMilestones(companyId, profile.id);

  const [list, totals, milestones, options] = await Promise.all([
    listExperienceLogs(companyId, {
      ...filters,
      page: Number.isFinite(page) ? page : 1,
      pageSize: 20,
    }),
    getExperienceTotals(companyId, {
      employeeId: filters.employeeId,
    }),
    listExperienceMilestoneProgress(companyId, {
      employeeId: filters.employeeId,
    }),
    getExperienceEngineOptions(companyId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experience Log"
        description="Track project, employer, equipment, lift type, tasks, and hours — with automatic totals and milestone progress."
      />
      <Suspense fallback={null}>
        <ExperienceLogList
          result={list.data}
          error={list.error}
          canManage={canWrite(profile.role)}
          totals={totals.data}
          milestones={milestones.data ?? []}
          filters={filters}
          employees={options.data?.employees ?? []}
          projects={options.data?.projects ?? []}
        />
      </Suspense>
    </div>
  );
}
