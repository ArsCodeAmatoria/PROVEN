import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { CompanyForm } from "@/features/admin/components/company-form";

export const metadata: Metadata = {
  title: "New company · Platform Admin",
};

export default function AdminNewCompanyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New company"
        description="Create a tenant organization. Slug is generated from the name."
      />
      <CompanyForm mode="create" />
    </div>
  );
}
