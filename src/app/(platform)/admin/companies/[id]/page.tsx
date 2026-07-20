import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader, StatCard } from "@/components/shared/page-header";
import { CompanyActions } from "@/features/admin/components/company-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlatformCompany } from "@/services/admin.service";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = {
  title: "Company · Platform Admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCompanyDetailPage({ params }: PageProps) {
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
        title={company.name}
        description={`Slug: ${company.slug}`}
      >
        <Badge variant={company.isActive ? "success" : "secondary"}>
          {company.isActive ? "Active" : "Inactive"}
        </Badge>
        <Button variant="outline" asChild>
          <Link href={`/admin/companies/${company.id}/edit`}>Edit</Link>
        </Button>
        <CompanyActions companyId={company.id} isActive={company.isActive} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Workers" value={company.workerCount} />
        <StatCard label="Active workers" value={company.activeWorkerCount} />
        <StatCard label="Users" value={company.userCount} />
        <StatCard label="Assessments" value={company.assessmentCount} />
        <StatCard label="Projects" value={company.projectCount} />
        <StatCard label="Competencies" value={company.competencyCount} />
        <StatCard label="Certificates" value={company.certificateCount} />
        <StatCard label="Documents" value={company.documentCount} />
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Company details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Phone" value={company.phone} />
          <Detail label="Website" value={company.website} />
          <Detail label="Address" value={company.address} />
          <Detail label="Created" value={formatDate(company.createdAt)} />
          <Detail label="Primary color" value={company.primaryColor} />
          <Detail label="Secondary color" value={company.secondaryColor} />
          {(company.primaryColor || company.secondaryColor) && (
            <div className="flex items-center gap-2 sm:col-span-2">
              {company.primaryColor ? (
                <span
                  className="inline-block h-6 w-6 rounded border border-border"
                  style={{ backgroundColor: company.primaryColor }}
                  title={company.primaryColor}
                />
              ) : null}
              {company.secondaryColor ? (
                <span
                  className="inline-block h-6 w-6 rounded border border-border"
                  style={{ backgroundColor: company.secondaryColor }}
                  title={company.secondaryColor}
                />
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
