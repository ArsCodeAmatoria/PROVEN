import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import { listAuditSessionsForCompany } from "@/services/compliance.service";

export const metadata: Metadata = {
  title: "Compliance Reports",
};

export default async function ComplianceReportsPage() {
  await requirePermission("compliance");
  const { companyId } = await requireCompanyId();
  const sessions = await listAuditSessionsForCompany(companyId);
  const items = sessions.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Reports"
        description="Download the official BCCSA COR audit workbook filled from your audit session answers."
      >
        <Button asChild variant="outline">
          <Link href="/compliance/audits">Open Internal Audits</Link>
        </Button>
      </PageHeader>
      <ComplianceSubnav activeHref="/compliance/reports" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">BCCSA Excel export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Exports the official BCCSA .xlsm (macros preserved) with company
            header fields and Y/N/N/A plus comments mapped into Element sheets.
            Email the downloaded file to BCCSA after review.
          </p>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No audit sessions yet.{" "}
              <Link href="/compliance/audits" className="underline">
                Start an internal audit
              </Link>{" "}
              first.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.status} · {session._count.responses} responses
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/compliance/audits/${session.id}`}>
                        Edit answers
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <a
                        href={`/api/compliance/audits/${session.id}/export/bccsa-xlsx`}
                      >
                        Download BCCSA Excel
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
