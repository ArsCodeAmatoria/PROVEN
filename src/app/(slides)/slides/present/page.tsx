import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CompetencySlideDeck } from "@/features/learning/presentation/competency-slide-deck";
import {
  getSlideCourse,
  slideIndexFromQuery,
} from "@/features/learning/lib/competency-course";
import {
  isTrackAvailable,
  parseTrackSlug,
} from "@/features/learning/lib/tracks";

type PageProps = {
  searchParams: Promise<{
    slide?: string;
    unit?: string;
    last?: string;
    track?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const track = parseTrackSlug(sp.track);
  const course = getSlideCourse(track);
  return {
    title: `Present · ${course.title}`,
    description: course.description,
  };
}

export default async function SlidesPresentPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const track = parseTrackSlug(sp.track);

  if (!isTrackAvailable(track)) {
    redirect("/learning");
  }

  const initialSlideIndex = slideIndexFromQuery(track, sp);

  return (
    <CompetencySlideDeck
      key={`present-${track}-${initialSlideIndex}`}
      courseSlug={track}
      initialSlideIndex={initialSlideIndex}
    />
  );
}
