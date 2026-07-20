import competencyData from "@/features/learning/data/competency-slides.json";
import competencyDataEs from "@/features/learning/data/competency-slides-es.json";
import proData from "@/features/learning/data/pro-rigging-slides.json";
import type { Locale } from "@/features/learning/i18n/config";
import type { TrackSlug } from "@/features/learning/lib/tracks";
import { DEFAULT_TRACK } from "@/features/learning/lib/tracks";

export type SlideEmphasis = "yellow" | "red";

export type CompetencySlideSectionItem =
  | string
  | {
      label: string;
      href?: string | null;
      logo?: string | null;
      emphasis?: SlideEmphasis | null;
    };

export type CompetencySlideSection = {
  heading: string;
  headingEmphasis?: SlideEmphasis | null;
  items: CompetencySlideSectionItem[];
};

export type SlidePanelBg = "gray" | "warm" | "cool" | "bc" | "white" | "compress" | "angle" | "sine" | "cover" | "chain" | "chalk" | "oppose" | "personnel" | "strength";

export type HeroStatCallout = {
  value: string;
  label: string;
  emphasis?: SlideEmphasis | null;
  href?: string | null;
};

export type SlideSourceLink = {
  label: string;
  href: string;
};

export type SlideQuizOption = {
  id: string;
  text: string;
};

export type SlideQuizQuestion = {
  id: string;
  prompt: string;
  options: SlideQuizOption[];
  correctAnswer: string;
  explanation?: string | null;
};

export type CompetencySlide = {
  id: number;
  unit: string;
  unitLabel: string;
  title: string;
  summary: string;
  bullets: string[];
  ohrsRef: string | null;
  source: string | null;
  chartHref: string | null;
  lessonHref: string | null;
  formula: string | null;
  diagram: string | null;
  image: string | null;
  secondaryImage?: string | null;
  cover: boolean;
  hero: boolean;
  critical: boolean;
  focus: boolean;
  sections: CompetencySlideSection[] | null;
  panelBg: SlidePanelBg | null;
  heroStats: HeroStatCallout[] | null;
  sourceLinks: SlideSourceLink[] | null;
  focusKicker: string | null;
  focusCallout: string | null;
  quiz: boolean;
  quizQuestions: SlideQuizQuestion[] | null;
};

export type CompetencyUnit = {
  id: string;
  label: string;
  durationMin?: number;
  slideStart: number;
  slideEnd: number;
};

export type CompetencyCourse = {
  slug: string;
  title: string;
  description: string;
  sourceUrl: string;
  totalDurationMin?: number;
  slideCount: number;
  units: CompetencyUnit[];
  slides: CompetencySlide[];
};

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

export function getSlideCourse(track: TrackSlug, locale: Locale = "en"): CompetencyCourse {
  if (track === "rigger-competency" && locale === "es") {
    return competencyDataEs as CompetencyCourse;
  }
  return COURSES[track];
}

export function getCompetencySlide(track: TrackSlug, index: number, locale: Locale = "en"): CompetencySlide | undefined {
  return getSlideCourse(track, locale).slides[index];
}

export function getUnitForSlide(track: TrackSlug, slideId: number, locale: Locale = "en"): CompetencyUnit | undefined {
  return getSlideCourse(track, locale).units.find((u) => slideId >= u.slideStart && slideId <= u.slideEnd);
}

export function slideIndexFromQuery(
  track: TrackSlug,
  params: {
    slide?: string;
    unit?: string;
    last?: string;
  },
  locale: Locale = "en"
): number {
  const course = getSlideCourse(track, locale);
  if (params.last === "1") return course.slideCount - 1;
  if (params.slide) {
    const n = parseInt(params.slide, 10);
    if (Number.isFinite(n)) return Math.max(0, Math.min(course.slideCount - 1, n - 1));
  }
  if (params.unit) {
    const unit = course.units.find((u) => u.id === params.unit);
    if (unit) return unit.slideStart - 1;
  }
  return 0;
}
