export const APP_NAME = "Proven";
export const APP_DESCRIPTION =
  "Competency management for construction — verify practical skills, exams, apprenticeships, observations, and certifications.";

/**
 * Organization scope until authenticated session wiring is complete.
 * Prefer deriving this from the signed-in profile in production.
 */
export const DEFAULT_ORGANIZATION_ID =
  process.env.PROVEN_DEFAULT_ORG_ID ?? "org_pending_setup";

export const NAV_ITEMS = [
  {
    title: "Overview",
    href: "/",
    icon: "LayoutDashboard",
  },
  {
    title: "Competencies",
    href: "/competencies",
    icon: "BadgeCheck",
  },
  {
    title: "Assessments",
    href: "/assessments",
    icon: "ClipboardCheck",
  },
  {
    title: "Written Exams",
    href: "/exams",
    icon: "FileText",
  },
  {
    title: "Apprenticeships",
    href: "/apprenticeships",
    icon: "GraduationCap",
  },
  {
    title: "Observations",
    href: "/observations",
    icon: "Eye",
  },
  {
    title: "Certifications",
    href: "/certifications",
    icon: "Award",
  },
  {
    title: "People",
    href: "/people",
    icon: "Users",
  },
] as const;

export const SETTINGS_NAV = [
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
  },
] as const;
