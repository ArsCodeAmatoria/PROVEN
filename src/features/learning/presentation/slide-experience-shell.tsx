"use client";

import { Michroma, Orbitron } from "next/font/google";

import { LearningLocaleProvider } from "@/features/learning/i18n/locale-context";
import "@/features/learning/styles/slides.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const michroma = Michroma({
  variable: "--font-michroma",
  subsets: ["latin"],
  weight: ["400"],
});

/**
 * Fullscreen Pull slide shell — fonts and CSS isolated from Proven chrome.
 * Uses `pull-slides` (not `dark`) so Proven's oklch `.dark` tokens cannot bleed in.
 */
export function SlideExperienceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${orbitron.variable} ${michroma.variable} learning-slides-root pull-slides min-h-screen bg-background text-foreground antialiased`}
      style={
        {
          ["--font-sans" as string]:
            "var(--font-michroma), ui-sans-serif, system-ui, sans-serif",
          ["--font-display" as string]:
            "var(--font-orbitron), ui-sans-serif, system-ui, sans-serif",
        } as React.CSSProperties
      }
    >
      <LearningLocaleProvider>{children}</LearningLocaleProvider>
    </div>
  );
}
