import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { parseUserRole } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/roles";

export type ProvenAccessRecord = {
  userId: string;
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  employeeId: string;
  companyId: string;
  role: UserRole;
  status: string;
  title: string | null;
  companyName: string;
  companySlug: string;
};

/**
 * Resolve employment via the service role when Prisma/RLS cannot see the row.
 */
export async function resolveProvenAccessViaAdmin(
  authUserId: string,
): Promise<ProvenAccessRecord | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const admin = createAdminClient();

    const { data: appUser } = await admin
      .from("users")
      .select(
        "id, auth_user_id, email, first_name, last_name, phone, avatar_url, is_active, created_at",
      )
      .eq("auth_user_id", authUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!appUser?.id) return null;

    const { data: employee } = await admin
      .from("employees")
      .select("id, role, status, title, company_id")
      .eq("user_id", appUser.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!employee?.id || !employee.company_id) return null;

    const { data: company } = await admin
      .from("companies")
      .select("id, name, slug, deleted_at")
      .eq("id", employee.company_id)
      .maybeSingle();

    if (!company || company.deleted_at) return null;

    return {
      userId: appUser.id,
      authUserId: appUser.auth_user_id,
      email: appUser.email,
      firstName: appUser.first_name ?? "",
      lastName: appUser.last_name ?? "",
      phone: appUser.phone ?? null,
      avatarUrl: appUser.avatar_url ?? null,
      isActive: appUser.is_active !== false,
      createdAt: appUser.created_at,
      employeeId: employee.id,
      companyId: employee.company_id,
      role: parseUserRole(employee.role),
      status: employee.status,
      title: employee.title ?? null,
      companyName: company.name,
      companySlug: company.slug,
    };
  } catch {
    return null;
  }
}
