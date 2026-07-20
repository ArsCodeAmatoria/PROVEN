import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completeManagementReviewAction } from "@/features/compliance/actions";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureManagementReview } from "@/services/cor-workflow.service";
import { notDeleted } from "@/types";

export const metadata: Metadata = {
  title: "Management Review",
};

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ManagementReviewPage({ params }: PageProps) {
  await requirePermission("compliance");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { sessionId } = await params;

  const session = await prisma.corAuditSession.findFirst({
    where: { id: sessionId, companyId, ...notDeleted },
    select: { id: true, title: true, overallScore: true, predictedScore: true },
  });
  if (!session) notFound();

  const ensured = await ensureManagementReview(
    companyId,
    sessionId,
    profile.id,
  );
  if (!ensured.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Management Review" />
        <p className="text-sm text-destructive">{ensured.error}</p>
      </div>
    );
  }

  const review = await prisma.corManagementReview.findFirst({
    where: { id: ensured.data.id, ...notDeleted },
    include: {
      attendees: {
        include: {
          employee: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      actionItems: true,
    },
  });
  if (!review) notFound();

  const write = canWrite(profile.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Management Review Meeting"
        description={session.title}
      >
        <Button asChild variant="outline">
          <Link href={`/compliance/audits/${sessionId}`}>Back to audit</Link>
        </Button>
      </PageHeader>
      <ComplianceSubnav activeHref="/compliance/audits" />

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{review.status}</Badge>
        {review.scoreSummary ? (
          <Badge variant="outline">{review.scoreSummary}</Badge>
        ) : null}
      </div>

      <section className="space-y-2 rounded-md border p-4">
        <h2 className="font-semibold">Agenda</h2>
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
          {review.agendaNotes}
        </pre>
        <p className="text-sm text-muted-foreground">
          Findings: {review.findingsSummary ?? "—"}
        </p>
      </section>

      <section className="space-y-2 rounded-md border p-4">
        <h2 className="font-semibold">Attendance & signatures</h2>
        {review.attendees.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add attendees during the live meeting (employee check-in coming
            next). Record decisions and approvals below.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {review.attendees.map((a) => (
              <li key={a.id}>
                {a.employee.user.firstName} {a.employee.user.lastName}
                {a.roleLabel ? ` · ${a.roleLabel}` : ""}
                {a.signedAt ? " · signed" : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {write && review.status !== "COMPLETED" ? (
        <form
          action={async (formData) => {
            "use server";
            await completeManagementReviewAction({
              reviewId: review.id,
              sessionId,
              decisions: String(formData.get("decisions") || ""),
              resourcesNotes: String(formData.get("resourcesNotes") || ""),
            });
          }}
          className="space-y-4 rounded-md border p-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="decisions">Decisions / action items</Label>
            <Textarea
              id="decisions"
              name="decisions"
              rows={4}
              defaultValue={review.decisions ?? ""}
              placeholder="Approvals, owners, due dates…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resourcesNotes">Resources allocated</Label>
            <Textarea
              id="resourcesNotes"
              name="resourcesNotes"
              rows={3}
              defaultValue={review.resourcesNotes ?? ""}
            />
          </div>
          <Button type="submit">Complete management review</Button>
        </form>
      ) : (
        <section className="space-y-2 rounded-md border p-4 text-sm">
          <p>
            <span className="font-medium">Decisions:</span>{" "}
            {review.decisions || "—"}
          </p>
          <p>
            <span className="font-medium">Resources:</span>{" "}
            {review.resourcesNotes || "—"}
          </p>
          {review.completedAt ? (
            <p className="text-muted-foreground">
              Completed {review.completedAt.toISOString().slice(0, 10)}
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
