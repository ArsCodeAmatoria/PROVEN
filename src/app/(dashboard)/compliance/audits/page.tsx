import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createInternalAuditAction } from "@/features/compliance/actions";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import { listAuditSessionsForCompany } from "@/services/compliance.service";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "Internal Audits",
};

export default async function ComplianceAuditsPage() {
  await requirePermission("compliance");
  const { companyId } = await requireCompanyId();
  const result = await listAuditSessionsForCompany(companyId);
  const items = (result.data ?? []).filter((s) => s.type === "INTERNAL");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Audits"
        description="Start Internal Audit freezes the Safety Program, then walk every BCCSA element with D/O/I evidence."
      >
        <form action={createInternalAuditAction}>
          <Button type="submit">Start Internal Audit</Button>
        </form>
      </PageHeader>
      <ComplianceSubnav activeHref="/compliance/audits" />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No internal audits yet"
          description="Start Internal Audit to lock the Safety Program version and begin scoring."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  <Link
                    href={`/compliance/audits/${session.id}`}
                    className="hover:underline"
                  >
                    {session.title}
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.program.title} · {session._count.responses} responses
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{session.status}</Badge>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/compliance/audits/${session.id}`}>Open</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
