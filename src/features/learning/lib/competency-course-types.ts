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

export type SlidePanelBg =
  | "gray"
  | "warm"
  | "cool"
  | "bc"
  | "white"
  | "compress"
  | "angle"
  | "sine"
  | "cover"
  | "chain"
  | "chalk"
  | "oppose"
  | "personnel"
  | "strength";

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

/** Stable unit ids for the default rigger track — short-circuit curriculum sync. */
export const RIGGER_COMPETENCY_UNIT_IDS = [
  "intro",
  "regulations",
  "bth",
  "ratings",
] as const;

export function getCompetencySlide(
  course: CompetencyCourse,
  index: number,
): CompetencySlide | undefined {
  return course.slides[index];
}

export function getUnitForSlide(
  course: CompetencyCourse,
  slideId: number,
): CompetencyUnit | undefined {
  return course.units.find(
    (u) => slideId >= u.slideStart && slideId <= u.slideEnd,
  );
}

export function slideIndexFromQuery(
  course: CompetencyCourse,
  params: {
    slide?: string;
    unit?: string;
    last?: string;
  },
): number {
  if (params.last === "1") return Math.max(0, course.slideCount - 1);
  if (params.slide) {
    const n = parseInt(params.slide, 10);
    if (Number.isFinite(n)) {
      return Math.max(0, Math.min(course.slideCount - 1, n - 1));
    }
  }
  if (params.unit) {
    const unit = course.units.find((u) => u.id === params.unit);
    if (unit) return unit.slideStart - 1;
  }
  return 0;
}
