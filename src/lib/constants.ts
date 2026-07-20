export const APP_NAME = "Proven";
export const APP_DESCRIPTION =
  "Competency management for construction — verify practical skills, exams, apprenticeships, observations, and certifications.";

/** Consolidated Proven modules. Existing routes remapped to the single-platform IA. */
export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
    permission: "dashboard" as const,
  },
  {
    title: "Workers",
    href: "/people",
    icon: "Users",
    permission: "people" as const,
  },
  {
    title: "Learning",
    href: "/learning",
    icon: "BookOpen",
    permission: "learning" as const,
  },
  {
    title: "Compliance",
    href: "/compliance",
    icon: "ShieldCheck",
    permission: "compliance" as const,
  },
  {
    title: "Files",
    href: "/files",
    icon: "FolderOpen",
    permission: "files" as const,
  },
  {
    title: "Knowledge",
    href: "/exams",
    icon: "FileText",
    permission: "exams" as const,
  },
  {
    title: "Competencies",
    href: "/competencies",
    icon: "BadgeCheck",
    permission: "competencies" as const,
  },
  {
    title: "Practical Assessments",
    href: "/assessments",
    icon: "ClipboardCheck",
    permission: "assessments" as const,
  },
  {
    title: "Practical Demos",
    href: "/demonstrations",
    icon: "Hammer",
    permission: "demonstrations" as const,
  },
  {
    title: "Observations",
    href: "/observations",
    icon: "Eye",
    permission: "observations" as const,
  },
  {
    title: "Training Matrix",
    href: "/training-matrix",
    icon: "Grid3x3",
    permission: "training-matrix" as const,
  },
  {
    title: "Equipment",
    href: "/equipment-qualifications",
    icon: "Forklift",
    permission: "equipment-qualifications" as const,
  },
  {
    title: "Certificates",
    href: "/certifications",
    icon: "Award",
    permission: "certifications" as const,
  },
  {
    title: "Hours",
    href: "/experience-log",
    icon: "Clock3",
    permission: "experience-log" as const,
  },
  {
    title: "Apprenticeships",
    href: "/apprenticeships",
    icon: "GraduationCap",
    permission: "apprenticeships" as const,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: "FileBarChart",
    permission: "reports" as const,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: "ChartColumn",
    permission: "analytics" as const,
  },
  {
    title: "Administration",
    href: "/admin",
    icon: "Shield",
    permission: "platform" as const,
  },
] as const;

export const SETTINGS_NAV = [
  {
    title: "Profile",
    href: "/profile",
    icon: "UserRound",
    permission: "profile" as const,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
    permission: "settings" as const,
  },
] as const;
