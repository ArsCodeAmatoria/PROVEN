import Link from "next/link";
import { Menu } from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SessionProfile } from "@/lib/auth/session";
import { fullName } from "@/utils/format";

interface AdminShellProps {
  profile: SessionProfile;
  children: React.ReactNode;
}

export function AdminShell({ profile, children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <AdminSidebar />
      </div>
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Platform Admin</SheetTitle>
                <AdminSidebar />
              </SheetContent>
            </Sheet>
            <Link href="/admin" className="text-sm font-semibold tracking-tight">
              Platform Admin
            </Link>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-medium">
              {fullName(profile.firstName, profile.lastName)}
            </p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
