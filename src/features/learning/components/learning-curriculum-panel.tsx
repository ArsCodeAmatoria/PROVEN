"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CheckCircle2, Circle, CircleDot, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  markUnitCompletedAction,
  markUnitInProgressAction,
} from "@/features/learning/actions";
import type { LearningHubView } from "@/services/learning.service";
import { cn } from "@/lib/utils";

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />;
  }
  if (status === "IN_PROGRESS") {
    return <CircleDot className="h-5 w-5 text-warning" aria-hidden />;
  }
  return <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />;
}

function statusLabel(status: string) {
  if (status === "COMPLETED") return "Completed";
  if (status === "IN_PROGRESS") return "In Progress";
  return "Not Started";
}

export function LearningCurriculumPanel({ hub }: { hub: LearningHubView }) {
  const [pending, startTransition] = useTransition();

  function startUnit(lessonId: string, href: string) {
    if (!hub.enrolmentId) {
      window.location.assign(href);
      return;
    }
    startTransition(async () => {
      await markUnitInProgressAction({
        enrolmentId: hub.enrolmentId!,
        lessonId,
      });
      window.location.assign(href);
    });
  }

  function completeUnit(lessonId: string) {
    if (!hub.enrolmentId) return;
    startTransition(async () => {
      await markUnitCompletedAction({
        enrolmentId: hub.enrolmentId!,
        lessonId,
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{hub.curriculumTitle}</p>
          <h2 className="text-xl font-semibold tracking-tight">
            {hub.moduleTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hub.completedCount} completed · {hub.inProgressCount} in progress ·{" "}
            {hub.notStartedCount} not started
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild>
            <Link href={hub.slideCourseHref}>
              <Play className="mr-2 h-4 w-4" />
              Open lesson slides
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/learning/weight-charts">Weight charts</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/learning/rigging-charts">Rigging charts</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Curriculum units</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {hub.lessons.map((lesson) => (
            <div
              key={lesson.lessonId}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-3",
                lesson.status === "COMPLETED" && "border-success/30 bg-success/5",
              )}
            >
              <StatusIcon status={lesson.status} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium leading-tight">{lesson.title}</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{statusLabel(lesson.status)}</Badge>
                  {lesson.estimatedMinutes ? (
                    <span className="text-xs text-muted-foreground">
                      ~{lesson.estimatedMinutes} min
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {lesson.status !== "COMPLETED" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending || !hub.enrolmentId}
                    onClick={() => completeUnit(lesson.lessonId)}
                  >
                    Mark done
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => startUnit(lesson.lessonId, lesson.presentHref)}
                >
                  Present
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
