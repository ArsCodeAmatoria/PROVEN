import {
  isUserRole,
  type UserRole,
  USER_ROLES,
} from "@/types/roles";

export type { UserRole };
export { USER_ROLES };

export const ALL_ROLES: UserRole[] = [...USER_ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPANY_ADMIN: "Company Admin",
  INSTRUCTOR: "Instructor",
  SUPERVISOR: "Supervisor",
  ASSESSOR: "Assessor",
  APPRENTICE: "Apprentice",
  STUDENT: "Student",
  OPERATOR: "Operator",
  READ_ONLY: "Read Only",
};

/** Permission keys used for nav + route guards. */
export type Permission =
  | "dashboard"
  | "learning"
  | "compliance"
  | "files"
  | "competencies"
  | "assessments"
  | "demonstrations"
  | "training-matrix"
  | "reports"
  | "analytics"
  | "experience-log"
  | "equipment-qualifications"
  | "exams"
  | "apprenticeships"
  | "observations"
  | "certifications"
  | "people"
  | "company"
  | "profile"
  | "settings"
  | "platform";

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  SUPER_ADMIN: [
    "dashboard",
    "learning",
    "compliance",
    "files",
    "competencies",
    "assessments",
    "demonstrations",
    "training-matrix",
    "reports",
    "analytics",
    "experience-log",
    "equipment-qualifications",
    "exams",
    "apprenticeships",
    "observations",
    "certifications",
    "people",
    "company",
    "profile",
    "settings",
    "platform",
  ],
  COMPANY_ADMIN: [
    "dashboard",
    "learning",
    "compliance",
    "files",
    "competencies",
    "assessments",
    "demonstrations",
    "training-matrix",
    "reports",
    "analytics",
    "experience-log",
    "equipment-qualifications",
    "exams",
    "apprenticeships",
    "observations",
    "certifications",
    "people",
    "company",
    "profile",
    "settings",
  ],
  INSTRUCTOR: [
    "dashboard",
    "learning",
    "compliance",
    "files",
    "competencies",
    "assessments",
    "demonstrations",
    "training-matrix",
    "reports",
    "analytics",
    "experience-log",
    "equipment-qualifications",
    "exams",
    "apprenticeships",
    "observations",
    "certifications",
    "profile",
    "settings",
  ],
  SUPERVISOR: [
    "dashboard",
    "learning",
    "compliance",
    "files",
    "competencies",
    "assessments",
    "demonstrations",
    "training-matrix",
    "reports",
    "analytics",
    "experience-log",
    "equipment-qualifications",
    "apprenticeships",
    "observations",
    "certifications",
    "profile",
    "settings",
  ],
  ASSESSOR: [
    "dashboard",
    "learning",
    "compliance",
    "files",
    "competencies",
    "assessments",
    "demonstrations",
    "training-matrix",
    "reports",
    "analytics",
    "experience-log",
    "equipment-qualifications",
    "apprenticeships",
    "observations",
    "certifications",
    "profile",
    "settings",
  ],
  APPRENTICE: [
    "dashboard",
    "learning",
    "compliance",
    "files",
    "assessments",
    "demonstrations",
    "experience-log",
    "equipment-qualifications",
    "exams",
    "apprenticeships",
    "certifications",
    "profile",
    "settings",
  ],
  STUDENT: [
    "dashboard",
    "learning",
    "compliance",
    "files",
    "assessments",
    "demonstrations",
    "experience-log",
    "equipment-qualifications",
    "exams",
    "apprenticeships",
    "certifications",
    "profile",
    "settings",
  ],
  OPERATOR: [
    "dashboard",
    "learning",
    "compliance",
    "files",
    "competencies",
    "assessments",
    "demonstrations",
    "training-matrix",
    "reports",
    "analytics",
    "experience-log",
    "equipment-qualifications",
    "observations",
    "certifications",
    "profile",
    "settings",
  ],
  READ_ONLY: [
    "dashboard",
    "learning",
    "compliance",
    "files",
    "competencies",
    "assessments",
    "demonstrations",
    "training-matrix",
    "reports",
    "analytics",
    "experience-log",
    "equipment-qualifications",
    "exams",
    "apprenticeships",
    "observations",
    "certifications",
    "profile",
    "settings",
  ],
};

export const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: "/admin", permission: "platform" },
  { prefix: "/people", permission: "people" },
  { prefix: "/learning", permission: "learning" },
  { prefix: "/compliance", permission: "compliance" },
  { prefix: "/files", permission: "files" },
  { prefix: "/slides", permission: "learning" },
  { prefix: "/competencies", permission: "competencies" },
  { prefix: "/demonstrations", permission: "demonstrations" },
  { prefix: "/training-matrix", permission: "training-matrix" },
  { prefix: "/reports", permission: "reports" },
  { prefix: "/analytics", permission: "analytics" },
  { prefix: "/experience-log", permission: "experience-log" },
  {
    prefix: "/equipment-qualifications",
    permission: "equipment-qualifications",
  },
  { prefix: "/assessments", permission: "assessments" },
  { prefix: "/exams", permission: "exams" },
  { prefix: "/apprenticeships", permission: "apprenticeships" },
  { prefix: "/observations", permission: "observations" },
  { prefix: "/certifications", permission: "certifications" },
  { prefix: "/settings", permission: "settings" },
  { prefix: "/profile", permission: "profile" },
  { prefix: "/", permission: "dashboard" },
];

export const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/callback",
] as const;

export const PUBLIC_ROUTES = [...AUTH_ROUTES, "/api/health"] as const;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canWrite(role: UserRole): boolean {
  return role !== "READ_ONLY";
}

export function isAdminRole(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "COMPANY_ADMIN";
}

export function parseUserRole(value: unknown): UserRole {
  return isUserRole(value) ? value : "READ_ONLY";
}

export function getPermissionForPath(pathname: string): Permission | null {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  for (const route of ROUTE_PERMISSIONS) {
    if (route.prefix === "/") {
      if (normalized === "/") return route.permission;
      continue;
    }
    if (
      normalized === route.prefix ||
      normalized.startsWith(`${route.prefix}/`)
    ) {
      return route.permission;
    }
  }

  return null;
}

export function getDefaultRouteForRole(role: UserRole): string {
  if (hasPermission(role, "platform")) return "/admin";
  if (hasPermission(role, "dashboard")) return "/";
  return "/profile";
}

export function isPlatformAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

export function getNavPermissions(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
