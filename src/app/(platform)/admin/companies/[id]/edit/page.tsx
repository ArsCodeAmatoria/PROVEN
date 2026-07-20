import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { CompanyForm } from "@/features/admin/components/company-form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlatformCompany } from "@/services/admin.service";

export const metadata: Metadata = {
  title: "Edit company · Platform Admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditCompanyPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getPlatformCompany(id);

  if (!result.data) {
    if (result.error === "Company not found.") notFound();
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load company</CardTitle>
          <CardDescription>{result.error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const company = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${company.name}`}
        description="Update tenant branding and contact details."
      />
      <CompanyForm
        mode="edit"
        companyId={company.id}
        defaultValues={{
          name: company.name,
          slug: company.slug,
          phone: company.phone ?? "",
          website: company.website ?? "",
          address: company.address ?? "",
          logoUrl: company.logoUrl ?? "",
          primaryColor: company.primaryColor ?? "",
          secondaryColor: company.secondaryColor ?? "",
          isActive: company.isActive,
        }}
      />
    </div>
  );
}
