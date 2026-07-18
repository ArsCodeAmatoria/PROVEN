"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { DashboardNotificationItem } from "@/services/dashboard.service";
import { formatRelative } from "@/utils/format";

interface NotificationsMenuProps {
  items: DashboardNotificationItem[];
}

export function NotificationsMenu({ items }: NotificationsMenuProps) {
  const unread = items.filter((item) => !item.isRead).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <Separator />
        <ScrollArea className="h-72">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id}>
                  {item.linkUrl ? (
                    <Link
                      href={item.linkUrl}
                      className="block px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <NotificationRow item={item} />
                    </Link>
                  ) : (
                    <div className="px-4 py-3">
                      <NotificationRow item={item} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({ item }: { item: DashboardNotificationItem }) {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        {!item.isRead ? (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-foreground" />
        ) : null}
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
      <p className="text-[11px] text-muted-foreground">
        {formatRelative(item.createdAt)}
      </p>
    </div>
  );
}
