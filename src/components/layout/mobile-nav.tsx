"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { CompanySwitcher } from "@/components/layout/company-switcher";
import { Logo } from "@/components/layout/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CompanyMembership } from "@/lib/auth/session";
import type { UserRole } from "@/types/roles";

interface MobileNavProps {
  role: UserRole;
  companyId: string | null;
  companyName: string | null;
  memberships: CompanyMembership[];
}

export function MobileNav({
  role,
  companyId,
  companyName,
  memberships,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-w-0 items-center gap-2 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-[min(20rem,100vw)] flex-col p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="border-b border-border px-3 py-3 pr-12">
            <CompanySwitcher
              variant="panel"
              companyId={companyId}
              companyName={companyName}
              memberships={memberships}
              onSwitched={() => setOpen(false)}
            />
          </div>
          <SidebarNav
            role={role}
            onNavigate={() => setOpen(false)}
            className="w-full flex-1 border-0"
          />
        </SheetContent>
      </Sheet>
      <Logo />
    </div>
  );
}
