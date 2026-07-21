import type { Locale } from "@/features/learning/i18n/config";
import type { CompetencyCourse } from "@/features/learning/lib/competency-course-types";
import type { TrackSlug } from "@/features/learning/lib/tracks";

const PRO_COMING_SOON_COURSE = {
  slug: "pro-rigging",
  title: "Pro",
  description:
    "Tower crane rigger pro — multi-crane lifts, multi-crane rotating loads, drifting, and self-erect tower cranes.",
  sourceUrl: "",
  slideCount: 0,
  units: [],
  slides: [],
} as CompetencyCourse;

/**
 * Dynamically load one track (+ locale) so client bundles do not pull every
 * slide JSON file into the present/cast route.
 */
export async function loadSlideCourse(
  track: TrackSlug,
  locale: Locale = "en",
): Promise<CompetencyCourse> {
  if (track === "pro-rigging") {
    return PRO_COMING_SOON_COURSE;
  }

  if (track === "rigger-competency" && locale === "es") {
    const mod = await import("@/features/learning/data/competency-slides-es.json");
    return mod.default as CompetencyCourse;
  }

  if (track === "intermediate") {
    const mod = await import("@/features/learning/data/pro-rigging-slides.json");
    return mod.default as CompetencyCourse;
  }

  const mod = await import("@/features/learning/data/competency-slides.json");
  return mod.default as CompetencyCourse;
}
