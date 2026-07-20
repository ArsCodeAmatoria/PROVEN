export const learningDictionaryEn = {
  home: {
    category: "Tower Crane Rigger",
  },
  tracks: {
    comingSoon: "Coming soon",
    comingSoonDetail: "Lessons and practice test are in development.",
    rigger: {
      title: "Rigger Competency",
    },
    intermediate: {
      title: "Intermediate",
      badge: "Intermediate tower crane rigger lessons",
      source: "ASME B30.20 reference",
    },
    pro: {
      title: "Pro",
    },
  },
  slides: {
    breadcrumb: "Lessons",
    badge: "Classroom lessons",
    plannedInstruction:
      "Planned instruction: {duration} ({count} lessons ≈ 5 min each, plus breaks)",
    intro:
      "Built for in-person teaching with clicker, TV cast, phone, and offline save.",
    startCourse: "Start lessons",
    weightCharts: "Weight charts",
    riggingCharts: "Rigging charts",
    sourceArticle: "BC Crane Safety source article",
    courseUnits: "Lesson units",
    presentUnit: "Present this unit",
    competenciesTitle: "What the course covers",
    presenterTips: "Presenter tips",
    tip1: "Use arrow keys or a clicker remote (Page Up/Down works too).",
    tip2Before: "Keep",
    tip2Link: "weight charts",
    tip2Mid: "and",
    tip2LinkRigging: "rigging charts",
    tip2After: "open on a second screen during the math block.",
    tip3: "Cast audience view to a TV with the monitor button in presenter mode.",
    tip4: "Swipe left/right on phone; tap Save offline before going to a job site without internet.",
    tip5: "Each lesson is roughly five minutes — pace for discussion and breaks.",
    tip6: "Tap the slide counter in the corner to open navigation, cast, fullscreen, and exit controls.",
    quizQuestion: "Question {n}",
    quizRevealAnswers: "Reveal answers",
    quizHideAnswers: "Hide answers",
    contentNotice:
      "Classroom lessons are available in English and Spanish. Switch language in the learning header.",
  },
  common: {
    home: "Learning",
  },
} as const;

export type LearningDictionary = typeof learningDictionaryEn;

export function formatMessage(
  template: string,
  vars: Record<string, string | number>,
) {
  return Object.entries(vars).reduce(
    (result, [key, value]) =>
      result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
