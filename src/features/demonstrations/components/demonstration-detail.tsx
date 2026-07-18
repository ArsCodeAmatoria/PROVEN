"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssessmentMediaPanel } from "@/features/assessments/components/assessment-media-panel";
import { AssessmentTrendsChart } from "@/features/assessments/components/assessment-trends-chart";
import { DEMONSTRATION_RATING_LABELS } from "@/features/demonstrations/constants";
import type { DemonstrationDetail } from "@/services/demonstrations.service";
import { formatDate, fullName } from "@/utils/format";

interface DemonstrationDetailViewProps {
  demonstration: DemonstrationDetail;
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
    <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:items-start">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm">{value || "—"}</dd>
    </div>
  );
}

export function DemonstrationDetailView({
  demonstration,
  canManage,
}: DemonstrationDetailViewProps) {
  const result = demonstration.result;
  const employee = result?.employee;
  const progression = demonstration.progression;
  const rating = result?.rating;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {demonstration.title}
          </h2>
          {rating && rating in DEMONSTRATION_RATING_LABELS ? (
            <Badge variant="secondary">
              {
                DEMONSTRATION_RATING_LABELS[
                  rating as keyof typeof DEMONSTRATION_RATING_LABELS
                ]
              }
            </Badge>
          ) : null}
          {result?.lockedAt ? (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              Permanent
            </Badge>
          ) : null}
          {progression.isComplete ? (
            <Badge>Requirement met</Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {[
            employee
              ? fullName(employee.user.firstName, employee.user.lastName)
              : null,
            demonstration.project?.name,
            demonstration.competency?.category?.name,
            demonstration.competency?.title,
            formatDate(demonstration.completedAt ?? demonstration.createdAt),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Successful demos</CardDescription>
            <CardTitle className="text-3xl">
              {progression.successfulCount}
              {progression.requiredCount != null
                ? ` / ${progression.requiredCount}`
                : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Competent or Exceeds Standard
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Total recorded</CardDescription>
            <CardTitle className="text-3xl">{progression.totalCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Permanent evaluations for this competency
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className="text-3xl">
              {progression.remainingCount ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {progression.requiredCount == null
              ? "Set required count on the competency"
              : progression.isComplete
                ? "Requirement complete"
                : "Successful demos still needed"}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Demonstration record</CardTitle>
            <CardDescription>
              Locked historical evaluation — never overwritten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <DetailRow
                label="Worker"
                value={
                  employee
                    ? fullName(employee.user.firstName, employee.user.lastName)
                    : null
                }
              />
              <DetailRow
                label="Project"
                value={demonstration.project?.name}
              />
              <DetailRow
                label="Category"
                value={demonstration.competency?.category?.name}
              />
              <DetailRow
                label="Competency"
                value={demonstration.competency?.title}
              />
              <DetailRow
                label="Rating"
                value={
                  rating && rating in DEMONSTRATION_RATING_LABELS
                    ? DEMONSTRATION_RATING_LABELS[
                        rating as keyof typeof DEMONSTRATION_RATING_LABELS
                      ]
                    : rating
                }
              />
              <DetailRow label="Comments" value={result?.comments} />
              <DetailRow
                label="Instructor notes"
                value={result?.instructorNotes}
              />
              <DetailRow
                label="Worker comments"
                value={result?.apprenticeComments}
              />
              <DetailRow
                label="Assessor"
                value={
                  demonstration.assessor
                    ? fullName(
                        demonstration.assessor.user.firstName,
                        demonstration.assessor.user.lastName,
                      )
                    : null
                }
              />
            </dl>
          </CardContent>
        </Card>

        <AssessmentTrendsChart
          trends={progression.trends}
          competencyTitle={demonstration.competency?.title}
        />
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
          <CardDescription>
            Prior permanent demonstrations for this worker and competency
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demonstration.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This is the first recorded demonstration for this pairing.
            </p>
          ) : (
            <ul className="space-y-3">
              {demonstration.history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/demonstrations/${item.assessmentId}`}
                      className="text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {[
                        formatDate(item.assessedAt),
                        item.projectName,
                        item.assessorName,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {item.rating && item.rating in DEMONSTRATION_RATING_LABELS ? (
                    <Badge variant="outline">
                      {
                        DEMONSTRATION_RATING_LABELS[
                          item.rating as keyof typeof DEMONSTRATION_RATING_LABELS
                        ]
                      }
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {result ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Evidence, media & signatures
            </CardTitle>
            <CardDescription>
              Photos and videos are appended; historical ratings stay locked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssessmentMediaPanel
              assessmentResultId={result.id}
              photos={demonstration.photos}
              videos={demonstration.videos}
              signatures={result.signatures}
              canManage={canManage}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
