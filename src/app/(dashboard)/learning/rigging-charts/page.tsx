import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProvenRiggingChartPicker } from "@/features/learning/components/proven-rigging-chart-picker";
import { requirePermission } from "@/lib/auth/session";

type PageProps = {
  searchParams: Promise<{ chart?: string }>;
};

export const metadata: Metadata = {
  title: "Rigging charts",
  description:
    "Sling-angle sine math, tension and reduction factors, and hitch ratings by sling type.",
};

export default async function RiggingChartsPage({ searchParams }: PageProps) {
  await requirePermission("learning");
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rigging charts"
        description="Sine math for sling angles, hitch ratings by sling type, choke-angle reduction, and inclined basket derating. Always verify against the sling tag and manufacturer charts."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/learning">Back to Learning</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/learning/weight-charts">Weight charts</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <ProvenRiggingChartPicker initialCategoryId={sp.chart} />
        </CardContent>
      </Card>
    </div>
  );
}
