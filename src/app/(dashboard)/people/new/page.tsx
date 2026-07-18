import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EmployeeForm } from "@/features/people/components/employee-form";
import { isAdminRole } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { listSupervisorOptions } from "@/services/people.service";

export const metadata: Metadata = {
  title: "Add employee",
};

export default async function NewEmployeePage() {
  await requirePermission("people");
  const profile = await requireAuth();

  if (!isAdminRole(profile.role)) {
    redirect("/people");
  }

  const { companyId } = await requireCompanyId();
  const supervisors = await listSupervisorOptions(companyId);

  if (supervisors.error && !supervisors.data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add employee"
        description="Create a company employment record and invite the person to Proven."
      />
      <EmployeeForm
        mode="create"
        supervisors={supervisors.data ?? []}
      />
    </div>
  );
}
