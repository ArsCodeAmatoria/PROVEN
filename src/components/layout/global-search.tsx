"use client";

import {
  Award,
  BadgeCheck,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Search,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const NAV_SEARCH = [
  { title: "Overview", href: "/", icon: LayoutDashboard, group: "Navigate" },
  {
    title: "Competency Library",
    href: "/competencies",
    icon: BadgeCheck,
    group: "Navigate",
  },
  {
    title: "Assessments",
    href: "/assessments",
    icon: ClipboardCheck,
    group: "Navigate",
  },
  { title: "Written Exams", href: "/exams", icon: FileText, group: "Navigate" },
  {
    title: "Projects",
    href: "/apprenticeships",
    icon: GraduationCap,
    group: "Navigate",
  },
  {
    title: "Observations",
    href: "/observations",
    icon: Eye,
    group: "Navigate",
  },
  {
    title: "Certifications",
    href: "/certifications",
    icon: Award,
    group: "Navigate",
  },
  { title: "People", href: "/people", icon: Users, group: "Navigate" },
  { title: "Profile", href: "/profile", icon: UserRound, group: "Account" },
  { title: "Settings", href: "/settings", icon: Settings, group: "Account" },
] as const;

const ACTIONS = [
  {
    title: "New assessment",
    href: "/assessments",
    icon: ClipboardCheck,
  },
  {
    title: "Record observation",
    href: "/observations",
    icon: Eye,
  },
  {
    title: "Add competency",
    href: "/competencies/new",
    icon: BadgeCheck,
  },
] as const;

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {compact ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Search"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="relative h-9 w-full justify-start gap-2 px-3 text-sm text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search…</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:flex">
            ⌘K
          </kbd>
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages and actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {NAV_SEARCH.filter((item) => item.group === "Navigate").map(
              (item) => (
                <CommandItem
                  key={item.href}
                  value={item.title}
                  onSelect={() => run(item.href)}
                >
                  <item.icon />
                  {item.title}
                </CommandItem>
              ),
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick actions">
            {ACTIONS.map((item) => (
              <CommandItem
                key={item.title}
                value={item.title}
                onSelect={() => run(item.href)}
              >
                <item.icon />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Account">
            {NAV_SEARCH.filter((item) => item.group === "Account").map(
              (item) => (
                <CommandItem
                  key={item.href}
                  value={item.title}
                  onSelect={() => run(item.href)}
                >
                  <item.icon />
                  {item.title}
                </CommandItem>
              ),
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
