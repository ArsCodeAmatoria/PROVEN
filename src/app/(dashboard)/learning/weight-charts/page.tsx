import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProvenWeightChartPicker } from "@/features/learning/components/proven-weight-chart-picker";
import { requirePermission } from "@/lib/auth/session";

type PageProps = {
  searchParams: Promise<{ chart?: string }>;
};

export const metadata: Metadata = {
  title: "Weight charts",
  description:
    "Reference tables for load weight estimation — steel, lumber, plywood, drywall, sand, water, and unit conversions.",
};

export default async function WeightChartsPage({ searchParams }: PageProps) {
  await requirePermission("learning");
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weight charts"
        description="Use during the rigging math block for material density and panel weights."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/learning">Back to Learning</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/learning/rigging-charts">Rigging charts</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <ProvenWeightChartPicker initialCategoryId={sp.chart} />
        </CardContent>
      </Card>
    </div>
  );
}
