/** BroadcastChannel sync between presenter and audience (TV) windows. */
export const SLIDE_CAST_CHANNEL_PREFIX = "pull-slide-cast:";

export type SlideCastMessage =
  | { readonly type: "sync"; readonly index: number; readonly total: number }
  | { readonly type: "request-sync" };

export function slideCastChannelId(lessonSlug: string): string {
  return `${SLIDE_CAST_CHANNEL_PREFIX}${lessonSlug}`;
}
