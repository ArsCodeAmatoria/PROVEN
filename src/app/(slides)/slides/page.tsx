import { redirect } from "next/navigation";

import { parseTrackSlug, slidesPresentHref } from "@/features/learning/lib/tracks";

type PageProps = {
  searchParams: Promise<{ track?: string }>;
};

/** Lesson index is no longer used — jump straight into the deck at slide 1. */
export default async function SlidesIndexRedirect({ searchParams }: PageProps) {
  const sp = await searchParams;
  const track = parseTrackSlug(sp.track);
  redirect(slidesPresentHref(track, { slide: "1" }));
}
