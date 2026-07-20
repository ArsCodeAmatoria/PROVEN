import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { LearningCurriculumPanel } from "@/features/learning/components/learning-curriculum-panel";
import { requireCompanyId } from "@/lib/auth/session";
import { getLearningHubForEmployee } from "@/services/learning.service";

export const metadata: Metadata = {
  title: "Learning",
};

export default async function LearningPage() {
  const { companyId, profile } = await requireCompanyId();
  if (!profile.employeeId) {
    redirect("/settings?error=no_profile");
  }

  const hub = await getLearningHubForEmployee(companyId, profile.employeeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning"
        description="Curriculum progress and classroom lesson slides — slide layout is unchanged from Pull."
      />
      {hub.error ? (
        <p className="text-sm text-destructive">{hub.error}</p>
      ) : hub.data ? (
        <LearningCurriculumPanel hub={hub.data} />
      ) : null}
    </div>
  );
}
