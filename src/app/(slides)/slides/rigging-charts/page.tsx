import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ chart?: string }>;
};

/** Legacy Pull path → Proven Learning rigging charts. */
export default async function LegacySlidesRiggingChartsRedirect({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const chart = sp.chart ? `?chart=${encodeURIComponent(sp.chart)}` : "";
  redirect(`/learning/rigging-charts${chart}`);
}
