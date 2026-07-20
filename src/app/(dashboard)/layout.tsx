import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { DashboardNotifications } from "@/components/layout/dashboard-notifications";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { requireAuth } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth();

  return (
    <AppShell
      profile={profile}
      notificationsSlot={
        <Suspense fallback={<NotificationsMenu items={[]} />}>
          <DashboardNotifications employeeId={profile.employeeId} />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
