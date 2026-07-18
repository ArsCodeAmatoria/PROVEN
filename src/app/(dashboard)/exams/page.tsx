import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ExamList } from "@/features/exams/components/exam-list";
import { requireCompanyId } from "@/lib/auth/session";
import { listExams } from "@/services/exams.service";

export const metadata: Metadata = {
  title: "Written Exams",
};

export default async function ExamsPage() {
  const { companyId } = await requireCompanyId();
  const result = await listExams(companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Written Exams"
        description="Manage written examinations, passing scores, and graded attempts."
      />
      <ExamList items={result.data?.items ?? []} error={result.error} />
    </div>
  );
}
