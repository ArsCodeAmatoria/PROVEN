import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CompetencySlideDeck } from "@/features/learning/presentation/competency-slide-deck";
import { getSlideCourse } from "@/features/learning/lib/competency-course";
import {
  isTrackAvailable,
  parseTrackSlug,
} from "@/features/learning/lib/tracks";

type PageProps = {
  searchParams: Promise<{ track?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const track = parseTrackSlug(sp.track);
  const course = getSlideCourse(track);
  return {
    title: `Audience · ${course.title}`,
    description: "TV/audience view synced from presenter.",
    robots: { index: false, follow: false },
  };
}

export default async function SlidesCastPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const track = parseTrackSlug(sp.track);

  if (!isTrackAvailable(track)) {
    redirect("/learning");
  }

  const course = getSlideCourse(track);

  return (
    <CompetencySlideDeck
      castRole="audience"
      courseSlug={track}
      course={course}
      initialSlideIndex={0}
    />
  );
}
