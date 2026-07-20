import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import { listAuditSessionsForCompany } from "@/services/compliance.service";
import { History } from "lucide-react";

export const metadata: Metadata = {
  title: "Audit History",
};

export default async function AuditHistoryPage() {
  await requirePermission("compliance");
  const { companyId } = await requireCompanyId();
  const result = await listAuditSessionsForCompany(companyId);
  const items = (result.data ?? []).filter((s) =>
    ["COMPLETED", "ARCHIVED", "SUBMITTED"].includes(s.status),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit History"
        description="Completed and archived COR audit sessions."
      />
      <ComplianceSubnav activeHref="/compliance/audits/history" />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No completed audits"
          description="Finished sessions will be listed here for trend and management review reporting."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between rounded-md border px-3 py-3"
            >
              <div>
                <p className="font-medium">{session.title}</p>
                <p className="text-sm text-muted-foreground">
                  {session.type} · {session.program.title}
                </p>
              </div>
              <Badge variant="secondary">{session.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
