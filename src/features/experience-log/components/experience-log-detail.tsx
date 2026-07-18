"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteExperienceLogAction } from "@/features/experience-log/actions";
import { LIFT_TYPE_LABELS } from "@/features/experience-log/constants";
import { formatDate } from "@/utils/format";

interface ExperienceLogDetailProps {
  entry: {
    id: string;
    employerName: string;
    liftType: string;
    taskPerformed: string;
    hours: number;
    startDate: Date;
    endDate: Date;
    isApprenticeship: boolean;
    notes: string | null;
    competencyTitle: string | null;
    employee: { id: string; name: string };
    project: { id: string; code: string; name: string };
    supervisor: { id: string; name: string } | null;
    equipment: { id: string; name: string; assetTag: string } | null;
    category: { id: string; name: string } | null;
  };
  canManage: boolean;
}

export function ExperienceLogDetail({
  entry,
  canManage,
}: ExperienceLogDetailProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/experience-log">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        {canManage ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteExperienceLogAction(entry.id);
              })
            }
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        ) : null}
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{entry.employee.name}</CardTitle>
              <CardDescription>
                {entry.project.code} · {entry.project.name}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{entry.hours.toFixed(1)} hrs</Badge>
              {entry.isApprenticeship ? <Badge>Apprenticeship</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Detail label="Employer" value={entry.employerName} />
          <Detail
            label="Date range"
            value={`${formatDate(entry.startDate)} – ${formatDate(entry.endDate)}`}
          />
          <Detail
            label="Supervisor"
            value={entry.supervisor?.name ?? "—"}
          />
          <Detail
            label="Lift type"
            value={
              LIFT_TYPE_LABELS[
                entry.liftType as keyof typeof LIFT_TYPE_LABELS
              ] ?? entry.liftType
            }
          />
          <Detail
            label="Equipment"
            value={
              entry.equipment
                ? `${entry.equipment.assetTag} · ${entry.equipment.name}`
                : "—"
            }
          />
          <Detail label="Category" value={entry.category?.name ?? "—"} />
          <Detail label="Competency" value={entry.competencyTitle ?? "—"} />
          <Detail label="Task performed" value={entry.taskPerformed} />
          {entry.notes ? (
            <div className="sm:col-span-2">
              <Detail label="Notes" value={entry.notes} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
