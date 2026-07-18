/**
 * Application roles — kept in a Prisma-free module so middleware
 * and client components never import the Prisma runtime.
 * Values must stay in sync with `enum UserRole` in prisma/schema.prisma.
 */
export const USER_ROLES = [
  "SUPER_ADMIN",
  "COMPANY_ADMIN",
  "INSTRUCTOR",
  "SUPERVISOR",
  "APPRENTICE",
  "OPERATOR",
  "READ_ONLY",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}
