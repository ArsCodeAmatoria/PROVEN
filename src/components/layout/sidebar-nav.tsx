"use client";

import {
  Award,
  BadgeCheck,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NAV_ITEMS, SETTINGS_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  BadgeCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Eye,
  Award,
  Users,
  Settings,
};

interface SidebarNavProps {
  onNavigate?: () => void;
  className?: string;
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex h-14 items-center px-4">
        <Logo />
      </div>
      <Separator className="bg-sidebar-border" />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon];
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                )}
              >
                {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6">
          <p className="mb-2 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <nav className="flex flex-col gap-1">
            {SETTINGS_NAV.map((item) => {
              const Icon = ICONS[item.icon];
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground">
          Competency Management System
        </p>
      </div>
    </aside>
  );
}
