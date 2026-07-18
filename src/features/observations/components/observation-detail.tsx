"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteObservationAction,
  updateObservationFollowUpAction,
} from "@/features/observations/actions";
import { ObservationMediaPanel } from "@/features/observations/components/observation-media-panel";
import {
  OBSERVATION_FOLLOW_UP_LABELS,
  OBSERVATION_TYPE_LABELS,
} from "@/features/observations/constants";
import type { ObservationDetail } from "@/services/observations.service";
import { formatDate, fullName } from "@/utils/format";

interface ObservationDetailViewProps {
  observation: ObservationDetail;
  canManage: boolean;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr] sm:items-start">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm">{value || "—"}</dd>
    </div>
  );
}

export function ObservationDetailView({
  observation,
  canManage,
}: ObservationDetailViewProps) {
  const [comments, setComments] = useState(observation.comments ?? "");
  const [correctiveActions, setCorrectiveActions] = useState(
    observation.correctiveActions ?? "",
  );
  const [dueDate, setDueDate] = useState(
    observation.dueDate
      ? observation.dueDate.toISOString().slice(0, 10)
      : "",
  );
  const [followUpStatus, setFollowUpStatus] = useState(
    observation.followUpStatus,
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSaveFollowUp = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateObservationFollowUpAction(observation.id, {
        comments,
        correctiveActions,
        dueDate: dueDate || undefined,
        followUpStatus,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Follow-up updated.");
    });
  };

  const onDelete = () => {
    if (!confirm("Remove this observation from active lists?")) return;
    startTransition(async () => {
      await deleteObservationAction(observation.id);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {observation.context}
            </h2>
            <Badge variant="secondary">
              {OBSERVATION_TYPE_LABELS[observation.observationType]}
            </Badge>
            <Badge variant="outline">
              {OBSERVATION_FOLLOW_UP_LABELS[observation.followUpStatus]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {[
              fullName(
                observation.employee.user.firstName,
                observation.employee.user.lastName,
              ),
              observation.project?.name,
              observation.location,
              formatDate(observation.observedAt, "MMM d, yyyy p"),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/people/${observation.employeeId}?tab=observations`}>
              Worker profile
            </Link>
          </Button>
          {canManage ? (
            <Button
              variant="destructive"
              disabled={pending}
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Observation record</CardTitle>
            <CardDescription>
              Permanent competency history entry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <DetailRow
                label="Worker"
                value={fullName(
                  observation.employee.user.firstName,
                  observation.employee.user.lastName,
                )}
              />
              <DetailRow label="Project" value={observation.project?.name} />
              <DetailRow
                label="Date / time"
                value={formatDate(observation.observedAt, "MMM d, yyyy p")}
              />
              <DetailRow label="Location" value={observation.location} />
              <DetailRow
                label="Category"
                value={observation.category?.name}
              />
              <DetailRow
                label="Competency"
                value={observation.competency?.title}
              />
              <DetailRow
                label="Type"
                value={OBSERVATION_TYPE_LABELS[observation.observationType]}
              />
              <DetailRow
                label="Observer"
                value={fullName(
                  observation.observer.user.firstName,
                  observation.observer.user.lastName,
                )}
              />
              <DetailRow label="Comments" value={observation.comments} />
            </dl>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Follow-up</CardTitle>
            <CardDescription>
              Corrective actions, due dates, and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canManage ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="follow-comments">Comments</Label>
                  <Textarea
                    id="follow-comments"
                    rows={3}
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="follow-actions">Corrective actions</Label>
                  <Textarea
                    id="follow-actions"
                    rows={3}
                    value={correctiveActions}
                    onChange={(event) =>
                      setCorrectiveActions(event.target.value)
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="follow-due">Due date</Label>
                    <Input
                      id="follow-due"
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={followUpStatus}
                      onValueChange={(value) =>
                        setFollowUpStatus(
                          value as typeof observation.followUpStatus,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OBSERVATION_FOLLOW_UP_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
                {message ? (
                  <p className="text-sm text-muted-foreground">{message}</p>
                ) : null}
                <Button
                  type="button"
                  disabled={pending}
                  onClick={onSaveFollowUp}
                >
                  {pending ? "Saving…" : "Save follow-up"}
                </Button>
              </>
            ) : (
              <dl className="space-y-3">
                <DetailRow
                  label="Corrective actions"
                  value={observation.correctiveActions}
                />
                <DetailRow
                  label="Due date"
                  value={formatDate(observation.dueDate)}
                />
                <DetailRow
                  label="Status"
                  value={
                    OBSERVATION_FOLLOW_UP_LABELS[observation.followUpStatus]
                  }
                />
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Photos & videos</CardTitle>
          <CardDescription>
            Field evidence attached to this permanent observation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ObservationMediaPanel
            observationId={observation.id}
            photos={observation.photos}
            videos={observation.videos}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
