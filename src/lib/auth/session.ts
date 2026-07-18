import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type {
  Company,
  Employee,
  User,
  UserSettings,
} from "@/generated/prisma/client";
import { COMPANY_COOKIE } from "@/lib/auth/company-cookie";
import {
  getDefaultRouteForRole,
  getPermissionForPath,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { hasDatabaseConfig, hasSupabaseConfig } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { tryCreateClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/roles";

export type CompanyMembership = {
  employeeId: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  role: UserRole;
};

/** Session shape used by UI — maps User + selected Employee. */
export type SessionProfile = {
  id: string;
  employeeId: string | null;
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  title: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  companyId: string | null;
  company: Company | null;
  settings: UserSettings | null;
  createdAt: Date;
  user: User;
  employee: (Employee & { company: Company }) | null;
  memberships: CompanyMembership[];
};

function toSessionProfile(
  user: User & {
    settings: UserSettings | null;
    employees: (Employee & { company: Company })[];
  },
  preferredCompanyId?: string | null,
): SessionProfile {
  const activeEmployees = user.employees.filter(
    (item) => item.company.deletedAt === null,
  );

  const preferred =
    (preferredCompanyId
      ? activeEmployees.find((item) => item.companyId === preferredCompanyId)
      : null) ?? activeEmployees[0] ?? null;

  const memberships: CompanyMembership[] = activeEmployees.map((item) => ({
    employeeId: item.id,
    companyId: item.companyId,
    companyName: item.company.name,
    companySlug: item.company.slug,
    role: item.role as UserRole,
  }));

  return {
    id: user.id,
    employeeId: preferred?.id ?? null,
    authUserId: user.authUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    title: preferred?.title ?? null,
    avatarUrl: user.avatarUrl,
    role: (preferred?.role ?? "READ_ONLY") as UserRole,
    isActive: user.isActive && (!preferred || preferred.status === "ACTIVE"),
    companyId: preferred?.companyId ?? null,
    company: preferred?.company ?? null,
    settings: user.settings,
    createdAt: user.createdAt,
    user,
    employee: preferred,
    memberships,
  };
}

export async function getAuthUser() {
  const supabase = await tryCreateClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getCurrentProfile(): Promise<SessionProfile | null> {
  const authUser = await getAuthUser();
  if (!authUser || !hasDatabaseConfig()) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const preferredCompanyId = cookieStore.get(COMPANY_COOKIE)?.value;

    const user = await prisma.user.findFirst({
      where: { authUserId: authUser.id, deletedAt: null },
      include: {
        settings: true,
        employees: {
          where: { deletedAt: null },
          include: { company: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!user) return null;
    return toSessionProfile(user, preferredCompanyId);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionProfile> {
  if (!hasSupabaseConfig()) {
    redirect("/login?error=config");
  }

  const authUser = await getAuthUser();
  if (!authUser) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    const supabase = await tryCreateClient();
    await supabase?.auth.signOut();
    redirect("/login?error=no_profile");
  }

  if (!profile.isActive) {
    const supabase = await tryCreateClient();
    await supabase?.auth.signOut();
    redirect("/login?error=inactive");
  }

  return profile;
}

export async function requirePermission(
  permission: Permission,
): Promise<SessionProfile> {
  const profile = await requireAuth();
  if (!hasPermission(profile.role, permission)) {
    redirect(getDefaultRouteForRole(profile.role));
  }
  return profile;
}

export async function requireRole(
  roles: UserRole | UserRole[],
): Promise<SessionProfile> {
  const profile = await requireAuth();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(profile.role)) {
    redirect(getDefaultRouteForRole(profile.role));
  }
  return profile;
}

export async function requireCompanyId(): Promise<{
  profile: SessionProfile;
  companyId: string;
}> {
  const profile = await requireAuth();

  if (!profile.companyId) {
    redirect("/settings?error=no_company");
  }

  return { profile, companyId: profile.companyId };
}

export async function getCompanyScope(): Promise<string | null> {
  const profile = await getCurrentProfile();
  return profile?.companyId ?? null;
}

export function assertPathAccess(role: UserRole, pathname: string): boolean {
  const permission = getPermissionForPath(pathname);
  if (!permission) return true;
  return hasPermission(role, permission);
}
