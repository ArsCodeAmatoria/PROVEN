import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import { getExternalAuditGate } from "@/services/cor-workflow.service";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/types";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "External Audits",
};

export default async function ExternalAuditsPage() {
  await requirePermission("compliance");
  const { companyId } = await requireCompanyId();

  const session = await prisma.corAuditSession.findFirst({
    where: { companyId, type: "INTERNAL", ...notDeleted },
    orderBy: { updatedAt: "desc" },
  });
  const gate = await getExternalAuditGate(companyId, session?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="External Audits"
        description="Enabled only when the internal COR workflow gate is fully green."
      />
      <ComplianceSubnav activeHref="/compliance/audits/external" />

      {!session ? (
        <EmptyState
          icon={ShieldCheck}
          title="No internal audit yet"
          description="Complete an internal audit first."
        />
      ) : gate.data?.ready ? (
        <div className="space-y-4 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-6">
          <p className="text-lg font-semibold">
            You are ready to schedule your BCCSA External COR Audit.
          </p>
          <p className="text-sm text-muted-foreground">
            Internal session “{session.title}” passed all readiness checks.
            Invite external auditors from this page in a later release — for now
            download the filled BCCSA workbook from the audit.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/compliance/audits/${session.id}`}>
                Open internal audit
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a
                href={`/api/compliance/audits/${session.id}/export/bccsa-xlsx`}
              >
                Download BCCSA Excel
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-md border p-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Not ready</Badge>
            <p className="font-medium">External audit gate blocked</p>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {(gate.data?.blockers ?? ["Unable to evaluate readiness."]).map(
              (b) => (
                <li key={b}>{b}</li>
              ),
            )}
          </ul>
          <Button asChild variant="outline">
            <Link href={session ? `/compliance/audits/${session.id}` : "/compliance/audits"}>
              Continue internal audit
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
