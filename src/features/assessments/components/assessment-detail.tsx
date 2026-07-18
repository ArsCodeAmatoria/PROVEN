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
import {
  ASSESSMENT_RATING_LABELS,
  ASSESSMENT_STATUS_LABELS,
  ASSESSMENT_TYPE_LABELS,
} from "@/features/assessments/constants";
import type { AssessmentDetail } from "@/services/assessments.service";
import { formatDate, fullName } from "@/utils/format";

interface AssessmentDetailViewProps {
  assessment: AssessmentDetail;
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

export function AssessmentDetailView({
  assessment,
  canManage,
}: AssessmentDetailViewProps) {
  const result = assessment.result;
  const employee = result?.employee;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {assessment.title}
          </h2>
          <Badge variant="outline">
            {ASSESSMENT_STATUS_LABELS[assessment.status]}
          </Badge>
          {result?.rating ? (
            <Badge variant="secondary">
              {ASSESSMENT_RATING_LABELS[result.rating]}
            </Badge>
          ) : null}
          {result?.lockedAt ? (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              Permanent
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {[
            employee
              ? fullName(employee.user.firstName, employee.user.lastName)
              : null,
            assessment.project?.name,
            assessment.competency?.category?.name,
            assessment.competency?.title,
            ASSESSMENT_TYPE_LABELS[assessment.type],
            formatDate(assessment.completedAt ?? assessment.createdAt),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Assessment record</CardTitle>
            <CardDescription>
              Locked historical evaluation — never overwritten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <DetailRow
                label="Employee"
                value={
                  employee
                    ? fullName(employee.user.firstName, employee.user.lastName)
                    : null
                }
              />
              <DetailRow label="Project" value={assessment.project?.name} />
              <DetailRow
                label="Category"
                value={assessment.competency?.category?.name}
              />
              <DetailRow
                label="Competency"
                value={assessment.competency?.title}
              />
              <DetailRow
                label="Rating"
                value={
                  result?.rating
                    ? ASSESSMENT_RATING_LABELS[result.rating]
                    : null
                }
              />
              <DetailRow label="Comments" value={result?.comments} />
              <DetailRow
                label="Instructor notes"
                value={result?.instructorNotes}
              />
              <DetailRow
                label="Apprentice comments"
                value={result?.apprenticeComments}
              />
              <DetailRow
                label="Assessor"
                value={
                  assessment.assessor
                    ? fullName(
                        assessment.assessor.user.firstName,
                        assessment.assessor.user.lastName,
                      )
                    : null
                }
              />
              <DetailRow
                label="Locked at"
                value={formatDate(result?.lockedAt, "MMM d, yyyy p")}
              />
            </dl>
          </CardContent>
        </Card>

        <AssessmentTrendsChart
          trends={assessment.trends}
          competencyTitle={assessment.competency?.title}
        />
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
          <CardDescription>
            Prior permanent assessments for this employee and competency
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessment.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This is the first recorded assessment for this pairing.
            </p>
          ) : (
            <ul className="space-y-3">
              {assessment.history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/assessments/${item.assessmentId}`}
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
                  {item.rating ? (
                    <Badge variant="outline">
                      {ASSESSMENT_RATING_LABELS[item.rating]}
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
              photos={assessment.photos}
              videos={assessment.videos}
              signatures={result.signatures}
              canManage={canManage}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
