import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DemonstrationDetailView } from "@/features/demonstrations/components/demonstration-detail";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getDemonstrationById } from "@/services/demonstrations.service";

interface DemonstrationPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DemonstrationPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Demonstration ${id.slice(0, 8)}` };
}

export default async function DemonstrationDetailPage({
  params,
}: DemonstrationPageProps) {
  await requirePermission("demonstrations");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { id } = await params;

  const result = await getDemonstrationById(companyId, id);
  if (!result.data) {
    notFound();
  }

  return (
    <DemonstrationDetailView
      demonstration={result.data}
      canManage={canWrite(profile.role)}
    />
  );
}
