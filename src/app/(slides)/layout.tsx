import { SlideExperienceShell } from "@/features/learning/presentation/slide-experience-shell";
import { requireAuth } from "@/lib/auth/session";

/**
 * Fullscreen learning experience — no Proven AppShell chrome.
 * Preserves Pull lesson viewer layout unchanged.
 */
export default async function SlidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <SlideExperienceShell>{children}</SlideExperienceShell>;
}
