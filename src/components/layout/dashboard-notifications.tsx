import { NotificationsMenu } from "@/components/layout/notifications-menu";
import type { DashboardNotificationItem } from "@/services/dashboard.service";
import { listNotificationsForEmployee } from "@/services/notifications.service";

export async function DashboardNotifications({
  employeeId,
}: {
  employeeId: string | null;
}) {
  const notificationsResult = employeeId
    ? await listNotificationsForEmployee(employeeId)
    : { data: [] as DashboardNotificationItem[], error: null };

  return <NotificationsMenu items={notificationsResult.data ?? []} />;
}
