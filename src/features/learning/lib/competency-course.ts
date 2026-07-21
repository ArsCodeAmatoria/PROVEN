import "server-only";

import competencyData from "@/features/learning/data/competency-slides.json";
import competencyDataEs from "@/features/learning/data/competency-slides-es.json";
import proData from "@/features/learning/data/pro-rigging-slides.json";
import type { Locale } from "@/features/learning/i18n/config";
import type {
  CompetencyCourse,
  CompetencySlide,
  CompetencyUnit,
} from "@/features/learning/lib/competency-course-types";
import {
  getCompetencySlide as getSlideFromCourse,
  getUnitForSlide as getUnitFromCourse,
  slideIndexFromQuery as slideIndexFromCourse,
} from "@/features/learning/lib/competency-course-types";
import type { TrackSlug } from "@/features/learning/lib/tracks";
import { DEFAULT_TRACK } from "@/features/learning/lib/tracks";

export type {
  CompetencyCourse,
  CompetencySlide,
  CompetencySlideSection,
  CompetencySlideSectionItem,
  CompetencyUnit,
  HeroStatCallout,
  SlideEmphasis,
  SlidePanelBg,
  SlideQuizQuestion,
  SlideSourceLink,
} from "@/features/learning/lib/competency-course-types";

export {
  RIGGER_COMPETENCY_UNIT_IDS,
  getCompetencySlide,
  getUnitForSlide,
  slideIndexFromQuery,
} from "@/features/learning/lib/competency-course-types";

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

const COURSES: Record<TrackSlug, CompetencyCourse> = {
  "rigger-competency": competencyData as CompetencyCourse,
  intermediate: proData as CompetencyCourse,
  "pro-rigging": PRO_COMING_SOON_COURSE,
};

/** @deprecated Use getSlideCourse(track) */
export const COMPETENCY_COURSE = COURSES[DEFAULT_TRACK];

/** Server-only sync loader (pulls JSON into the server bundle, not the client). */
export function getSlideCourse(
  track: TrackSlug,
  locale: Locale = "en",
): CompetencyCourse {
  if (track === "rigger-competency" && locale === "es") {
    return competencyDataEs as CompetencyCourse;
  }
  return COURSES[track];
}

export function getCompetencySlideByTrack(
  track: TrackSlug,
  index: number,
  locale: Locale = "en",
): CompetencySlide | undefined {
  return getSlideFromCourse(getSlideCourse(track, locale), index);
}

export function getUnitForSlideByTrack(
  track: TrackSlug,
  slideId: number,
  locale: Locale = "en",
): CompetencyUnit | undefined {
  return getUnitFromCourse(getSlideCourse(track, locale), slideId);
}

export function slideIndexFromQueryByTrack(
  track: TrackSlug,
  params: {
    slide?: string;
    unit?: string;
    last?: string;
  },
  locale: Locale = "en",
): number {
  return slideIndexFromCourse(getSlideCourse(track, locale), params);
}
