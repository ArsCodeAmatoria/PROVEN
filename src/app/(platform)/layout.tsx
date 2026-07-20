import { AdminShell } from "@/components/admin/admin-shell";
import { requireRole } from "@/lib/auth/session";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("SUPER_ADMIN");

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
