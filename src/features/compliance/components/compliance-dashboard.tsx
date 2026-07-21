import Link from "next/link";

import { StatCard } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComplianceDashboardView } from "@/services/compliance.service";
import type { ReadinessBreakdown } from "@/services/cor-workflow.service";

const SUBNAV = [
  { href: "/compliance", label: "COR Dashboard" },
  { href: "/compliance/audits", label: "Internal Audits" },
  { href: "/compliance/audits/external", label: "External Audits" },
  { href: "/compliance/audits/history", label: "Audit History" },
  { href: "/compliance/corrective-actions", label: "Corrective Actions" },
  { href: "/compliance/site-sampling", label: "Site Sampling" },
  { href: "/compliance/interviews", label: "Interviews" },
  { href: "/compliance/observations", label: "Worksite Observations" },
  { href: "/compliance/evidence", label: "Evidence Library" },
  { href: "/compliance/reports", label: "Reports" },
] as const;

export function ComplianceSubnav({ activeHref }: { activeHref: string }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b pb-3">
      {SUBNAV.map((item) => {
        const active = activeHref === item.href;
        return (
          <Button
            key={item.href}
            asChild
            variant={active ? "secondary" : "ghost"}
            size="sm"
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}

function bandColor(band: ReadinessBreakdown["band"]) {
  if (band === "ready") return "text-emerald-600";
  if (band === "needs_improvement") return "text-amber-600";
  return "text-destructive";
}

export function ComplianceDashboardView({
  data,
  readiness,
}: {
  data: ComplianceDashboardView;
  readiness?: ReadinessBreakdown | null;
}) {
  const pct = readiness?.readinessPct ?? data.readinessPct;
  const band = readiness?.band ?? "not_ready";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="COR readiness"
          value={pct == null ? "—" : `${Math.round(pct)}%`}
          description={
            readiness
              ? band === "ready"
                ? "Ready"
                : band === "needs_improvement"
                  ? "Needs improvement"
                  : "Not ready"
              : "Calculated from audit + CAPA progress"
          }
        />
        <StatCard
          label="Predicted audit score"
          value={
            data.predictedScore == null
              ? "—"
              : `${Math.round(data.predictedScore)}%`
          }
          description={data.programTitle}
        />
        <StatCard
          label="Open corrective actions"
          value={data.openCorrectiveActions}
        />
        <StatCard
          label="Audits in progress"
          value={data.draftAudits}
          description={`${data.completedAudits} completed`}
        />
      </div>

      {readiness ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Readiness breakdown</CardTitle>
            <p className={`text-sm font-medium ${bandColor(band)}`}>
              {band === "ready"
                ? "Green — Ready"
                : band === "needs_improvement"
                  ? "Yellow — Needs improvement"
                  : "Red — Not ready"}
            </p>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ["Documentation", readiness.documentation],
                ["Interviews", readiness.interviews],
                ["Training", readiness.training],
                ["Inspections", readiness.inspections],
                ["Toolbox talks", readiness.toolboxTalks],
                ["Orientation", readiness.orientation],
                ["Corrective actions", readiness.correctiveActions],
                ["Safety meetings", readiness.safetyMeetings],
                ["Equipment inspections", readiness.equipmentInspections],
                ["Incident management", readiness.incidentManagement],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-md border px-3 py-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-base font-semibold">{Math.round(value)}%</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {readiness?.gate ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">External audit gate</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {readiness.gate.ready
                  ? "You are ready to schedule your BCCSA External COR Audit."
                  : "Complete the checklist before enabling Ready for External Audit."}
              </p>
            </div>
            <Badge variant={readiness.gate.ready ? "default" : "secondary"}>
              {readiness.gate.ready ? "READY" : "BLOCKED"}
            </Badge>
          </CardHeader>
          {!readiness.gate.ready ? (
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {readiness.gate.blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Elements" value={data.elementCount} />
        <StatCard label="Questions" value={data.questionCount} />
        <StatCard
          label="Evidence links"
          value={data.outstandingEvidence}
          description="Linked to Proven records"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Element scores</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Program {data.programVersion} — Start Internal Audit freezes the
              Safety Program, then score D/O/I evidence per BCCSA element.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">BCCSA R13</Badge>
            <Button asChild size="sm">
              <Link href="/compliance/audits">Internal audits</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.elements.map((el) => (
            <div
              key={el.id}
              className="flex items-start justify-between gap-3 rounded-md border px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  <span className="text-muted-foreground">{el.code}.</span>{" "}
                  {el.title}
                </p>
                {el.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {el.description}
                  </p>
                ) : null}
              </div>
              <Badge variant="outline">{el.questionCount} Qs</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
