import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { DEFAULT_ORGANIZATION_ID } from "@/features/competencies/api";
import { PeopleList } from "@/features/people/components/people-list";
import { listPeople } from "@/services/people.service";

export const metadata: Metadata = {
  title: "People",
};

export default async function PeoplePage() {
  const result = await listPeople(DEFAULT_ORGANIZATION_ID);

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Organization members, roles, and competency participation."
      />
      <PeopleList items={result.data?.items ?? []} error={result.error} />
    </div>
  );
}
