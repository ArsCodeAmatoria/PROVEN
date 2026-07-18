export const APP_NAME = "Proven";
export const APP_DESCRIPTION =
  "Competency management for construction — verify practical skills, exams, apprenticeships, observations, and certifications.";

export const NAV_ITEMS = [
  {
    title: "Overview",
    href: "/",
    icon: "LayoutDashboard",
    permission: "dashboard" as const,
  },
  {
    title: "Competencies",
    href: "/competencies",
    icon: "BadgeCheck",
    permission: "competencies" as const,
  },
  {
    title: "Assessments",
    href: "/assessments",
    icon: "ClipboardCheck",
    permission: "assessments" as const,
  },
  {
    title: "Written Exams",
    href: "/exams",
    icon: "FileText",
    permission: "exams" as const,
  },
  {
    title: "Apprenticeships",
    href: "/apprenticeships",
    icon: "GraduationCap",
    permission: "apprenticeships" as const,
  },
  {
    title: "Observations",
    href: "/observations",
    icon: "Eye",
    permission: "observations" as const,
  },
  {
    title: "Certifications",
    href: "/certifications",
    icon: "Award",
    permission: "certifications" as const,
  },
  {
    title: "People",
    href: "/people",
    icon: "Users",
    permission: "people" as const,
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
