import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EmployeeForm } from "@/features/people/components/employee-form";
import { EmployeePhotoUpload } from "@/features/people/components/employee-photo-upload";
import { employeePhotoUrl } from "@/features/people/constants";
import { isAdminRole } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import {
  getEmployeeById,
  listSupervisorOptions,
} from "@/services/people.service";
import { fullName } from "@/utils/format";

interface EditEmployeePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditEmployeePageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Edit employee ${id.slice(0, 8)}` };
}

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  await requirePermission("people");
  const profile = await requireAuth();

  if (!isAdminRole(profile.role)) {
    redirect("/people");
  }

  const { companyId } = await requireCompanyId();
  const { id } = await params;

  const [employeeResult, supervisors] = await Promise.all([
    getEmployeeById(companyId, id),
    listSupervisorOptions(companyId, id),
  ]);

  if (!employeeResult.data) {
    notFound();
  }

  const employee = employeeResult.data;
  const hireDate = employee.hireDate
    ? employee.hireDate.toISOString().slice(0, 10)
    : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`Edit ${fullName(employee.user.firstName, employee.user.lastName)}`}
        description="Update employment details, emergency contact, and notes."
      />

      <EmployeePhotoUpload
        employeeId={employee.id}
        firstName={employee.user.firstName}
        lastName={employee.user.lastName}
        photoUrl={employeePhotoUrl(employee)}
        canManage
      />

      <EmployeeForm
        mode="edit"
        employeeId={employee.id}
        supervisors={supervisors.data ?? []}
        defaultValues={{
          email: employee.user.email,
          firstName: employee.user.firstName,
          lastName: employee.user.lastName,
          phone: employee.user.phone ?? "",
          employeeNumber: employee.employeeNumber ?? "",
          title: employee.title ?? "",
          trade: employee.trade ?? "",
          level: employee.level,
          department: employee.department ?? "",
          role: employee.role,
          status: employee.status,
          supervisorId: employee.supervisorId ?? undefined,
          hireDate,
          notes: employee.notes ?? "",
          emergencyContactName: employee.emergencyContactName ?? "",
          emergencyContactPhone: employee.emergencyContactPhone ?? "",
          emergencyContactRelation: employee.emergencyContactRelation ?? "",
        }}
      />
    </div>
  );
}
