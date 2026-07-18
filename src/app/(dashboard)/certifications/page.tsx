import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { CertificationList } from "@/features/certifications/components/certification-list";
import { DEFAULT_ORGANIZATION_ID } from "@/features/competencies/api";
import { listCertifications } from "@/services/certifications.service";

export const metadata: Metadata = {
  title: "Certifications",
};

export default async function CertificationsPage() {
  const result = await listCertifications(DEFAULT_ORGANIZATION_ID);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certifications"
        description="Track issued credentials, issuers, and expiration for compliance readiness."
      />
      <CertificationList
        items={result.data?.items ?? []}
        error={result.error}
      />
    </div>
  );
}
