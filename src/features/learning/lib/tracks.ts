export const TRACK_SLUGS = ["rigger-competency", "intermediate", "pro-rigging"] as const;

export type TrackSlug = (typeof TRACK_SLUGS)[number];

export const DEFAULT_TRACK: TrackSlug = "rigger-competency";

export const TRACK_AVAILABLE: Record<TrackSlug, boolean> = {
  "rigger-competency": true,
  intermediate: false,
  "pro-rigging": false,
};

export function isTrackAvailable(track: TrackSlug): boolean {
  return TRACK_AVAILABLE[track];
}

export function parseTrackSlug(value?: string | null): TrackSlug {
  if (value === "pro-rigging" || value === "pro") return "pro-rigging";
  if (value === "intermediate") return "intermediate";
  return DEFAULT_TRACK;
}

export function isTrackSlug(value: string): value is TrackSlug {
  return (TRACK_SLUGS as readonly string[]).includes(value);
}

export function slidesIndexHref(track: TrackSlug): string {
  return `/slides?track=${track}`;
}

/** Exit presenter/cast back into the Proven Learning module. */
export function slidesExitHref(): string {
  return "/learning";
}

export function weightChartsHref(params?: { chart?: string }): string {
  const search = new URLSearchParams();
  if (params?.chart) search.set("chart", params.chart);
  const q = search.toString();
  return q ? `/learning/weight-charts?${q}` : "/learning/weight-charts";
}

export function riggingChartsHref(params?: { chart?: string }): string {
  const search = new URLSearchParams();
  if (params?.chart) search.set("chart", params.chart);
  const q = search.toString();
  return q ? `/learning/rigging-charts?${q}` : "/learning/rigging-charts";
}

export function slidesPresentHref(
  track: TrackSlug,
  params?: { unit?: string; slide?: string },
): string {
  const search = new URLSearchParams({ track });
  if (params?.unit) search.set("unit", params.unit);
  if (params?.slide) search.set("slide", params.slide);
  return `/slides/present?${search.toString()}`;
}

export function slidesCastHref(track: TrackSlug): string {
  return `/slides/cast?track=${track}`;
}
