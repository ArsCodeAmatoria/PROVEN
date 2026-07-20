"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/features/learning/slides/page-shell";
import { useTranslations } from "@/features/learning/i18n/locale-context";
import type { TrackSlug } from "@/features/learning/lib/tracks";

export function TrackComingSoon({ track = "pro-rigging" }: { readonly track?: TrackSlug }) {
  const { t } = useTranslations();
  const title =
    track === "intermediate"
      ? t("tracks.intermediate.title")
      : track === "rigger-competency"
        ? t("tracks.rigger.title")
        : t("tracks.pro.title");

  return (
    <PageShell className="py-10 lg:py-16">
      <div className="max-w-xl space-y-5">
        <nav className="text-lg text-muted-foreground">
          <Link href="/learning">{t("common.home")}</Link>
        </nav>
        <p className="category-label">{t("home.category")}</p>
        <h1>{title}</h1>
        <p className="flex items-center gap-2 font-display text-base font-semibold uppercase tracking-wide text-highlight-secondary lg:text-lg">
          <span aria-hidden className="text-4xl leading-none lg:text-5xl">*</span>
          {t("tracks.comingSoon")}
        </p>
        <p className="text-xl text-muted-foreground">{t("tracks.comingSoonDetail")}</p>
        <Button asChild size="lg">
          <Link href="/learning">{t("common.home")}</Link>
        </Button>
      </div>
    </PageShell>
  );
}
