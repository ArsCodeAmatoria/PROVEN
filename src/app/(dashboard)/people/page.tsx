import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { PeopleList } from "@/features/people/components/people-list";
import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import { listPeople } from "@/services/people.service";

export const metadata: Metadata = {
  title: "People",
};

export default async function PeoplePage() {
  await requirePermission("people");
  const { companyId } = await requireCompanyId();
  const result = await listPeople(companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Company employees, roles, and competency participation. Companies can have unlimited employees."
      />
      <PeopleList items={result.data?.items ?? []} error={result.error} />
    </div>
  );
}
