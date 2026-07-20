"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, FingerprintPattern } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ADMIN_NAV, ADMIN_NAV_GROUPS } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex min-h-14 flex-col justify-center gap-0.5 px-4 py-3">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="inline-flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <FingerprintPattern
            className="h-7 w-7 shrink-0"
            aria-hidden
            strokeWidth={1.75}
          />
          <span className="text-[15px]">Proven</span>
        </Link>
        <p className="pl-9 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Platform Admin
        </p>
      </div>
      <Separator className="bg-sidebar-border" />
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="flex flex-col gap-6">
          {ADMIN_NAV_GROUPS.map((group) => {
            const items = ADMIN_NAV.filter((item) => item.group === group.id);
            if (items.length === 0) return null;

            return (
              <div key={group.id}>
                {group.id !== "overview" ? (
                  <p className="mb-2 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                ) : null}
                <nav className="flex flex-col gap-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex min-h-11 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to company workspace
        </Link>
      </div>
    </aside>
  );
}
