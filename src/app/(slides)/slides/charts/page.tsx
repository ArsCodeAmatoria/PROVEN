import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ chart?: string }>;
};

/** Legacy Pull path → Proven Learning weight charts. */
export default async function LegacySlidesChartsRedirect({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const chart = sp.chart ? `?chart=${encodeURIComponent(sp.chart)}` : "";
  redirect(`/learning/weight-charts${chart}`);
}
