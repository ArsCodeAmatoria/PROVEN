"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Presentation, Table2, Triangle } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/features/learning/slides/page-shell";
import { useTranslations } from "@/features/learning/i18n/locale-context";
import {
  formatDurationLocalized,
  getLocalizedCompetencyCourse,
} from "@/features/learning/lib/competency-i18n";
import type { CompetencyCourse } from "@/features/learning/lib/competency-course-types";
import { loadSlideCourse } from "@/features/learning/lib/load-slide-course";
import type { TrackSlug } from "@/features/learning/lib/tracks";
import { isTrackAvailable, slidesPresentHref } from "@/features/learning/lib/tracks";
import { TrackComingSoon } from "@/features/learning/slides/track-coming-soon";

type Props = {
  readonly track: TrackSlug;
};

export function SlidesIndexContent({ track }: Props) {
  const { t, locale } = useTranslations();
  const [courseData, setCourseData] = useState<CompetencyCourse | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadSlideCourse(track, locale).then((next) => {
      if (!cancelled) setCourseData(next);
    });
    return () => {
      cancelled = true;
    };
  }, [track, locale]);

  if (!isTrackAvailable(track)) {
    return <TrackComingSoon track={track} />;
  }

  if (!courseData) {
    return (
      <PageShell className="py-8 lg:py-12">
        <div className="h-48 animate-pulse rounded-md bg-muted" aria-busy="true" />
      </PageShell>
    );
  }

  const course = getLocalizedCompetencyCourse(locale, track, courseData);
  const totalDuration = courseData.totalDurationMin;
  const isIntermediate = track === "intermediate";

  return (
    <PageShell className="py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-lg text-muted-foreground lg:text-xl">
        <Link href="/learning">{t("common.home")}</Link> / <span className="text-foreground">{t("slides.breadcrumb")}</span>
      </nav>

      <header className="max-w-3xl space-y-4 pb-8">
        <Badge variant="secondary">{isIntermediate ? t("tracks.intermediate.badge") : t("slides.badge")}</Badge>
        <h1>{course.title}</h1>
        <p className="text-xl text-muted-foreground lg:text-2xl">{course.description}</p>
        {totalDuration ? (
          <p className="text-lg font-medium text-foreground">
            {t("slides.plannedInstruction", {
              duration: formatDurationLocalized(totalDuration, locale),
              count: courseData.slideCount,
            })}
          </p>
        ) : null}
        <p className="text-lg text-muted-foreground">
          {t("slides.intro")}
        </p>
        {locale === "es" ? (
          <p className="rounded-sm bg-foreground/5 px-4 py-3 text-base text-muted-foreground">
            {t("slides.contentNotice")}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg">
            <Link href={slidesPresentHref(track)}>
              <Presentation className="mr-2 h-5 w-5" />
              {t("slides.startCourse")}
            </Link>
          </Button>
          {!isIntermediate ? (
            <>
              <Button asChild variant="outline" size="lg">
                <Link href="/learning/weight-charts">
                  <Table2 className="mr-2 h-5 w-5" />
                  {t("slides.weightCharts")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/learning/rigging-charts">
                  <Triangle className="mr-2 h-5 w-5" />
                  {t("slides.riggingCharts")}
                </Link>
              </Button>
            </>
          ) : null}
        </div>
        <a
          href={courseData.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {isIntermediate ? t("tracks.intermediate.source") : t("slides.sourceArticle")}
          <ExternalLink className="h-4 w-4" />
        </a>
      </header>

      <section className="space-y-6 py-8">
        <h2>{t("slides.courseUnits")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {course.units.map((unit) => (
            <Link
              key={unit.id}
              href={slidesPresentHref(track, { unit: unit.id })}
              className="block space-y-2 p-4 py-3 transition-colors hover:bg-foreground/4"
            >
              <p className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {t("slides.slidesRange", { start: unit.slideStart, end: unit.slideEnd })}
                {unit.durationMin ? ` · ${formatDurationLocalized(unit.durationMin, locale)}` : ""}
              </p>
              <p className="text-lg font-semibold lg:text-xl">{unit.label}</p>
              <p className="inline-flex items-center font-display text-sm font-semibold uppercase tracking-wide">
                {t("slides.presentUnit")} <ArrowRight className="ml-1 h-4 w-4" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4 py-8 text-lg text-muted-foreground lg:text-xl">
        <h2>{t("slides.competenciesTitle")}</h2>
        <ul className="list-disc space-y-2 pl-5">
          {course.competencies.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 py-8 text-lg text-muted-foreground lg:text-xl">
        <h2>{t("slides.presenterTips")}</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t("slides.tip1")}</li>
          {!isIntermediate ? (
            <li>
              {t("slides.tip2Before")}{" "}
              <Link href="/learning/weight-charts" className="text-foreground underline underline-offset-4">
                {t("slides.tip2Link")}
              </Link>{" "}
              {t("slides.tip2Mid")}{" "}
              <Link
                href="/learning/rigging-charts"
                className="text-foreground underline underline-offset-4"
              >
                {t("slides.tip2LinkRigging")}
              </Link>{" "}
              {t("slides.tip2After")}
            </li>
          ) : null}
          <li>{t("slides.tip3")}</li>
          <li>{t("slides.tip4")}</li>
          <li>{t("slides.tip5")}</li>
          <li>{t("slides.tip6")}</li>
        </ul>
      </section>
    </PageShell>
  );
}
