import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/lib/auth/session";
import type { DashboardNotificationItem } from "@/services/dashboard.service";
import { listNotificationsForEmployee } from "@/services/notifications.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth();

  const notificationsResult = profile.employeeId
    ? await listNotificationsForEmployee(profile.employeeId)
    : { data: [] as DashboardNotificationItem[], error: null };

  return (
    <AppShell
      profile={profile}
      notifications={notificationsResult.data ?? []}
    >
      {children}
    </AppShell>
  );
}
