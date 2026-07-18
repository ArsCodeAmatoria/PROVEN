import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmployeeDetailView } from "@/features/people/components/employee-detail";
import { isAdminRole } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { listWorkerDemonstrationProgress } from "@/services/demonstrations.service";
import { getEmployeeById } from "@/services/people.service";

interface EmployeePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: EmployeePageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Employee ${id.slice(0, 8)}` };
}

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: EmployeePageProps) {
  await requirePermission("people");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { id } = await params;
  const query = await searchParams;
  const tab = Array.isArray(query.tab) ? query.tab[0] : query.tab;

  const result = await getEmployeeById(companyId, id);
  if (!result.data) {
    notFound();
  }

  const progression = await listWorkerDemonstrationProgress(companyId, id);

  return (
    <EmployeeDetailView
      employee={result.data}
      canManage={isAdminRole(profile.role)}
      defaultTab={tab}
      demonstrationProgress={progression.data ?? []}
    />
  );
}
