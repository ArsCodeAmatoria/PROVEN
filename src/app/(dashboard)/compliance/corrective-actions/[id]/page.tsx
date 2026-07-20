import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CorrectiveActionVerifyForm } from "@/features/compliance/components/corrective-action-verify-form";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { fullName } from "@/utils/format";
import { notDeleted } from "@/types";

export const metadata: Metadata = {
  title: "Corrective Action",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CorrectiveActionDetailPage({ params }: PageProps) {
  await requirePermission("compliance");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { id } = await params;

  const action = await prisma.correctiveAction.findFirst({
    where: { id, companyId, ...notDeleted },
    include: {
      owner: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      finding: true,
      events: { orderBy: { createdAt: "desc" }, take: 20 },
      question: { select: { number: true, description: true } },
      session: { select: { id: true, title: true } },
    },
  });
  if (!action) notFound();

  const write = canWrite(profile.role);

  return (
    <div className="space-y-6">
      <PageHeader title={action.title} description={action.description ?? undefined}>
        <Button asChild variant="outline">
          <Link href="/compliance/corrective-actions">All actions</Link>
        </Button>
      </PageHeader>
      <ComplianceSubnav activeHref="/compliance/corrective-actions" />

      <div className="flex flex-wrap gap-2">
        <Badge>{action.status}</Badge>
        <Badge variant="outline">{action.priority}</Badge>
        <Badge variant="secondary">{action.completionPct}% complete</Badge>
      </div>

      <div className="grid gap-3 rounded-md border p-4 text-sm sm:grid-cols-2">
        <p>
          <span className="text-muted-foreground">Owner:</span>{" "}
          {action.owner
            ? fullName(action.owner.user.firstName, action.owner.user.lastName)
            : "Unassigned"}
        </p>
        <p>
          <span className="text-muted-foreground">Department:</span>{" "}
          {action.department ?? "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Due:</span>{" "}
          {action.dueAt ? action.dueAt.toISOString().slice(0, 10) : "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Cost:</span>{" "}
          {action.costAmount != null ? `$${action.costAmount}` : "—"}
        </p>
        <p className="sm:col-span-2">
          <span className="text-muted-foreground">Required evidence:</span>{" "}
          {action.evidenceRequired ?? "—"}
        </p>
        {action.finding ? (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">Finding:</span>{" "}
            {action.finding.findingNumber} · E{action.finding.elementCode} · Q{" "}
            {action.finding.questionNumber} · {action.finding.riskLevel}
          </p>
        ) : null}
        {action.session ? (
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">Audit:</span>{" "}
            <Link
              href={`/compliance/audits/${action.session.id}`}
              className="underline"
            >
              {action.session.title}
            </Link>
          </p>
        ) : null}
      </div>

      <section className="rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Activity</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {action.events.map((e) => (
            <li key={e.id}>
              {e.createdAt.toISOString().slice(0, 16).replace("T", " ")} —{" "}
              {e.message}
            </li>
          ))}
        </ul>
      </section>

      {write &&
      (action.status === "PENDING_VERIFICATION" ||
        action.status === "COMPLETED") ? (
        <CorrectiveActionVerifyForm actionId={action.id} />
      ) : null}
    </div>
  );
}
