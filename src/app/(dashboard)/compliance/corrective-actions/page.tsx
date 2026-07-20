import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader, StatCard } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  completeCorrectiveActionFormAction,
} from "@/features/compliance/actions";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { listCorrectiveActionsForCompany } from "@/services/compliance.service";
import { getCorrectiveActionDashboard } from "@/services/cor-workflow.service";
import { fullName } from "@/utils/format";
import { ListTodo } from "lucide-react";

export const metadata: Metadata = {
  title: "Corrective Actions",
};

export default async function CorrectiveActionsPage() {
  await requirePermission("compliance");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const [result, dash] = await Promise.all([
    listCorrectiveActionsForCompany(companyId),
    getCorrectiveActionDashboard(companyId),
  ]);
  const items = result.data ?? [];
  const write = canWrite(profile.role);
  const d = dash.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corrective Actions"
        description="Auto-created from inadequate / partial audit findings. Complete, verify, then close."
      />
      <ComplianceSubnav activeHref="/compliance/corrective-actions" />

      {d ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Open findings" value={d.openFindings} />
          <StatCard label="Overdue actions" value={d.overdueActions} />
          <StatCard label="Due this week" value={d.dueThisWeek} />
          <StatCard label="High-risk findings" value={d.highRiskFindings} />
          <StatCard label="Completed actions" value={d.completedActions} />
          <StatCard
            label="Avg closure (days)"
            value={
              d.avgClosureDays == null ? "—" : Math.round(d.avgClosureDays)
            }
          />
          <StatCard
            label="Audit readiness"
            value={
              d.auditReadinessPct == null
                ? "—"
                : `${Math.round(d.auditReadinessPct)}%`
            }
          />
          <StatCard
            label="COR score projection"
            value={
              d.corScoreProjection == null
                ? "—"
                : `${Math.round(d.corScoreProjection)}%`
            }
          />
        </div>
      ) : null}

      {d && d.findingsByElement.length > 0 ? (
        <div className="rounded-md border p-4">
          <p className="mb-2 text-sm font-medium">Findings by element</p>
          <div className="flex flex-wrap gap-2">
            {d.findingsByElement.map((row) => (
              <Badge key={row.element} variant="outline">
                E{row.element}: {row.count}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No corrective actions"
          description="Mark an audit question Inadequate or Partial to open a finding and CAPA automatically."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((action) => (
            <li
              key={action.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  <Link
                    href={`/compliance/corrective-actions/${action.id}`}
                    className="hover:underline"
                  >
                    {action.title}
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  {action.priority} ·{" "}
                  {action.owner
                    ? fullName(
                        action.owner.user.firstName,
                        action.owner.user.lastName,
                      )
                    : "Unassigned"}
                  {action.dueAt
                    ? ` · due ${action.dueAt.toISOString().slice(0, 10)}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{action.status}</Badge>
                {write &&
                !["VERIFIED", "CANCELLED", "PENDING_VERIFICATION"].includes(
                  action.status,
                ) ? (
                  <form action={completeCorrectiveActionFormAction}>
                    <input type="hidden" name="actionId" value={action.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Mark complete
                    </Button>
                  </form>
                ) : null}
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/compliance/corrective-actions/${action.id}`}>
                    Open
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
