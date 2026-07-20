import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Anchor,
  BookOpen,
  Bookmark,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  HardHat,
  Layers,
  Ruler,
  Scale,
  Shield,
  UsersRound,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const SLIDE_CYCLIC_ICONS = [
  BookOpen,
  Layers,
  Shield,
  Anchor,
  HardHat,
  Wrench,
  ClipboardCheck,
  GraduationCap,
  UsersRound,
  Scale,
  FileText,
  ClipboardList,
  Bookmark,
  AlertTriangle,
  Ruler,
] as const satisfies readonly LucideIcon[];

export function slideDeckProseClass(): string {
  return cn(
    "rigging-slide-panel-prose max-w-none min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain",
    "prose prose-lg leading-snug dark:prose-invert xl:prose-xl",
    "prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-foreground",
    "prose-p:my-1.5 prose-p:text-foreground/90 prose-p:font-medium",
    "prose-li:my-0.5 prose-li:text-foreground/90 prose-li:font-medium",
    "prose-ul:my-2 prose-ul:overflow-hidden",
    "prose-h2:my-2 prose-h2:text-balance prose-h2:text-2xl prose-h2:font-black lg:prose-h2:text-[1.875rem]",
    "prose-h3:my-1.5 prose-h3:text-xl prose-h3:font-black lg:prose-h3:text-[1.7rem]",
    "[&_strong]:font-bold [&_strong]:text-foreground",
    "[&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4"
  );
}
