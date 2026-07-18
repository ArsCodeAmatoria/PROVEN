"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

export function AppHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarNav
                onNavigate={() => setOpen(false)}
                className="w-full border-0"
              />
            </SheetContent>
          </Sheet>
          <Logo />
        </div>

        <div className="hidden min-w-0 flex-1 lg:block">
          <p className="truncate text-sm text-muted-foreground">
            Competency Management System
          </p>
        </div>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
