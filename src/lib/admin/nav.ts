import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  Eye,
  FileBarChart,
  FileText,
  FolderKanban,
  HardDrive,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  Users,
  UserSquare2,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  group: "overview" | "directory" | "learning" | "operations" | "system";
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    group: "overview",
  },
  {
    title: "Companies",
    href: "/admin/companies",
    icon: Building2,
    group: "directory",
  },
  {
    title: "Workers",
    href: "/admin/workers",
    icon: UserSquare2,
    group: "directory",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    group: "directory",
  },
  {
    title: "Curriculum",
    href: "/admin/curriculum",
    icon: BookOpen,
    group: "learning",
  },
  {
    title: "Competencies",
    href: "/admin/competencies",
    icon: BadgeCheck,
    group: "learning",
  },
  {
    title: "Assessments",
    href: "/admin/assessments",
    icon: ClipboardCheck,
    group: "operations",
  },
  {
    title: "Observations",
    href: "/admin/observations",
    icon: Eye,
    group: "operations",
  },
  {
    title: "Projects",
    href: "/admin/projects",
    icon: FolderKanban,
    group: "operations",
  },
  {
    title: "Certificates",
    href: "/admin/certificates",
    icon: Award,
    group: "operations",
  },
  {
    title: "Documents",
    href: "/admin/documents",
    icon: FileText,
    group: "operations",
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: FileBarChart,
    group: "system",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    group: "system",
  },
  {
    title: "Audit Log",
    href: "/admin/audit",
    icon: ScrollText,
    group: "system",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    group: "system",
  },
  {
    title: "System",
    href: "/admin/system",
    icon: HardDrive,
    group: "system",
  },
];

export const ADMIN_NAV_GROUPS: {
  id: AdminNavItem["group"];
  label: string;
}[] = [
  { id: "overview", label: "Overview" },
  { id: "directory", label: "Directory" },
  { id: "learning", label: "Learning" },
  { id: "operations", label: "Operations" },
  { id: "system", label: "System" },
];

export { Activity, Shield };
