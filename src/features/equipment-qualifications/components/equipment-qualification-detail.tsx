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
import { deleteEquipmentQualificationAction } from "@/features/equipment-qualifications/actions";
import { EQUIPMENT_QUALIFICATION_STATUS_LABELS } from "@/features/equipment-qualifications/constants";
import type { EquipmentQualificationDetail } from "@/services/equipment-qualifications.service";
import { formatDate } from "@/utils/format";

interface EquipmentQualificationDetailViewProps {
  qualification: EquipmentQualificationDetail;
  canManage: boolean;
}

export function EquipmentQualificationDetailView({
  qualification,
  canManage,
}: EquipmentQualificationDetailViewProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/equipment-qualifications">
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
                await deleteEquipmentQualificationAction(qualification.id);
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
              <CardTitle>
                {qualification.employee.name} ·{" "}
                {qualification.equipmentType.name}
              </CardTitle>
              <CardDescription>
                {qualification.make} {qualification.model}
                {qualification.capacity ? ` · ${qualification.capacity}` : ""}
              </CardDescription>
            </div>
            <Badge
              variant={
                qualification.displayStatus === "ACTIVE"
                  ? "success"
                  : qualification.displayStatus === "EXPIRED"
                    ? "warning"
                    : "outline"
              }
            >
              {
                EQUIPMENT_QUALIFICATION_STATUS_LABELS[
                  qualification.displayStatus as keyof typeof EQUIPMENT_QUALIFICATION_STATUS_LABELS
                ]
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Detail
            label="Qualification date"
            value={formatDate(qualification.qualifiedAt)}
          />
          <Detail
            label="Expiry"
            value={
              qualification.expiresAt
                ? formatDate(qualification.expiresAt)
                : "None"
            }
          />
          <Detail
            label="Assessor"
            value={qualification.assessor?.name ?? "—"}
          />
          <Detail
            label="Asset"
            value={
              qualification.equipment
                ? `${qualification.equipment.assetTag} · ${qualification.equipment.name}`
                : "—"
            }
          />
          {qualification.notes ? (
            <div className="sm:col-span-2">
              <Detail label="Notes" value={qualification.notes} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Supporting assessments</CardTitle>
          <CardDescription>
            Linked permanent assessments that support this endorsement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {qualification.assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No supporting assessments linked.
            </p>
          ) : (
            <ul className="space-y-2">
              {qualification.assessments.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/assessments/${item.assessmentId}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {item.title}
                    {item.completedAt
                      ? ` · ${formatDate(item.completedAt)}`
                      : ""}
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
