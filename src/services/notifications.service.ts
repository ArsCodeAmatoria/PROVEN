import "server-only";

import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";
import { notDeleted } from "@/types";

import type { DashboardNotificationItem } from "./dashboard.service";
import { failure, getDatabaseConfigError, success, unavailable } from "./base";

export async function listNotificationsForEmployee(
  employeeId: string,
  limit = 8,
): Promise<ServiceResult<DashboardNotificationItem[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const items = await prisma.notification.findMany({
      where: { employeeId, ...notDeleted },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return success(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type,
        isRead: item.isRead,
        createdAt: item.createdAt,
        linkUrl: item.linkUrl,
      })),
    );
  } catch (error) {
    return failure(error);
  }
}
