import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  markExternalAuditReadyFormAction,
  signOffInternalAuditFormAction,
  startManagementReviewFormAction,
} from "@/features/compliance/actions";
import {
  AuditProgressBar,
  AuditSessionForm,
} from "@/features/compliance/components/audit-session-form";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getAuditSessionDetail } from "@/services/compliance.service";
import {
  getAuditProgress,
  getExternalAuditGate,
} from "@/services/cor-workflow.service";

export const metadata: Metadata = {
  title: "COR Audit Session",
};

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ComplianceAuditSessionPage({ params }: PageProps) {
  await requirePermission("compliance");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { sessionId } = await params;
  const result = await getAuditSessionDetail(companyId, sessionId);

  if (!result.data) {
    notFound();
  }

  const { session, questions } = result.data;
  const progress = await getAuditProgress(companyId, sessionId);
  const gate = await getExternalAuditGate(companyId, sessionId);
  const write = canWrite(profile.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title={session.title}
        description={`${session.program.title} · ${session.program.version}`}
      >
        <Button asChild variant="outline">
          <Link href="/compliance/audits">All audits</Link>
        </Button>
        <Button asChild>
          <a href={`/api/compliance/audits/${session.id}/export/bccsa-xlsx`}>
            Download BCCSA Excel
          </a>
        </Button>
      </PageHeader>
      <ComplianceSubnav activeHref="/compliance/audits" />

      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{session.status}</Badge>
        {session.signedOffAt ? <Badge>Signed off</Badge> : null}
        {session.externalReadyAt ? (
          <Badge variant="outline">External-ready</Badge>
        ) : null}
      </div>

      {progress.data ? <AuditProgressBar progress={progress.data} /> : null}

      {write ? (
        <div className="flex flex-wrap gap-2">
          <form action={startManagementReviewFormAction}>
            <input type="hidden" name="sessionId" value={session.id} />
            <Button type="submit" variant="outline">
              Management review
            </Button>
          </form>
          <form action={signOffInternalAuditFormAction}>
            <input type="hidden" name="sessionId" value={session.id} />
            <Button type="submit" variant="outline">
              Sign off internal audit
            </Button>
          </form>
          <form action={markExternalAuditReadyFormAction}>
            <input type="hidden" name="sessionId" value={session.id} />
            <Button type="submit" disabled={!gate.data?.ready}>
              Ready for external audit
            </Button>
          </form>
        </div>
      ) : null}

      {gate.data && !gate.data.ready ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          <p className="font-medium">External audit gate — not ready yet</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {gate.data.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {gate.data?.ready ? (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
          You are ready to schedule your BCCSA External COR Audit.
        </p>
      ) : null}

      <AuditSessionForm
        sessionId={session.id}
        questions={questions}
        canManage={write}
      />
    </div>
  );
}
