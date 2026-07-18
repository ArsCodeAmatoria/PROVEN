"use client";

import Link from "next/link";
import { useTransition } from "react";
import { History, Pencil, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { deleteCompetencyAction } from "@/features/competencies/actions";
import { CompetencyAttachments } from "@/features/competencies/components/competency-attachments";
import {
  COMPETENCY_DIFFICULTY_LABELS,
  COMPETENCY_STATUS_LABELS,
  COMPETENCY_TABS,
} from "@/features/competencies/constants";
import type { CompetencyDetail } from "@/services/competencies.service";
import { formatDate, formatRelative } from "@/utils/format";

interface CompetencyDetailViewProps {
  competency: CompetencyDetail;
  canManage: boolean;
  defaultTab?: string;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:items-start">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm">{value || "—"}</dd>
    </div>
  );
}

export function CompetencyDetailView({
  competency,
  canManage,
  defaultTab = "overview",
}: CompetencyDetailViewProps) {
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirm("Archive and remove this competency from the library?")) return;
    startTransition(async () => {
      await deleteCompetencyAction(competency.id);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {competency.title}
            </h2>
            <Badge variant="secondary">{competency.code}</Badge>
            <Badge variant="outline">
              {COMPETENCY_STATUS_LABELS[competency.status]}
            </Badge>
            <Badge variant="outline">
              {COMPETENCY_DIFFICULTY_LABELS[competency.difficulty]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {[
              competency.category?.name,
              competency.estimatedTimeMinutes
                ? `${competency.estimatedTimeMinutes} min`
                : null,
              competency.requiredScore != null
                ? `Required score ${competency.requiredScore}%`
                : null,
              `v${competency.version}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/competencies/${competency.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Archive
            </Button>
          </div>
        ) : null}
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {COMPETENCY_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
              <CardDescription>{competency.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <DetailRow
                  label="Category"
                  value={competency.category?.name}
                />
                <DetailRow label="Trade" value={competency.trade} />
                <DetailRow label="Level" value={competency.level} />
                <DetailRow
                  label="Difficulty"
                  value={COMPETENCY_DIFFICULTY_LABELS[competency.difficulty]}
                />
                <DetailRow
                  label="Required score"
                  value={
                    competency.requiredScore != null
                      ? `${competency.requiredScore}%`
                      : null
                  }
                />
                <DetailRow
                  label="Estimated time"
                  value={
                    competency.estimatedTimeMinutes != null
                      ? `${competency.estimatedTimeMinutes} minutes`
                      : null
                  }
                />
                <DetailRow
                  label="Status"
                  value={COMPETENCY_STATUS_LABELS[competency.status]}
                />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demonstrations">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Required demonstrations</CardTitle>
            </CardHeader>
            <CardContent>
              {competency.requiredDemonstrations ? (
                <pre className="whitespace-pre-wrap text-sm">
                  {competency.requiredDemonstrations}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No required demonstrations documented.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="references">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">References</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <DetailRow label="Reference" value={competency.reference} />
                <DetailRow
                  label="CSA reference"
                  value={competency.csaReference}
                />
                <DetailRow
                  label="ASME reference"
                  value={competency.asmeReference}
                />
                <DetailRow
                  label="WorkSafeBC reference"
                  value={competency.workSafeBcReference}
                />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Attachments</CardTitle>
              <CardDescription>
                Standards, checklists, and supporting files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetencyAttachments
                competencyId={competency.id}
                attachments={competency.attachments}
                canManage={canManage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">History</CardTitle>
              <CardDescription>Audit trail for this competency</CardDescription>
            </CardHeader>
            <CardContent>
              {competency.auditLogs.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No history yet"
                  description="Creates and updates are recorded here."
                />
              ) : (
                <ul className="space-y-3">
                  {competency.auditLogs.map((log) => (
                    <li
                      key={log.id}
                      className="border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <p className="text-sm font-medium">
                        {log.action}
                        {log.summary ? ` · ${log.summary}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.createdAt, "MMM d, yyyy p")} ·{" "}
                        {formatRelative(log.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
