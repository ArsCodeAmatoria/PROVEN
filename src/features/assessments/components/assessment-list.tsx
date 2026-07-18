import { ClipboardCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ContinuousAssessment } from "@/types";
import { formatDate } from "@/utils/format";

interface AssessmentListProps {
  items: ContinuousAssessment[];
  error?: string | null;
}

export function AssessmentList({ items, error }: AssessmentListProps) {
  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load assessments</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No continuous assessments"
        description="Record practical, written, observation, portfolio, and oral assessments against verified competencies."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((assessment) => (
        <Card key={assessment.id} className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{assessment.title}</CardTitle>
            <CardDescription>
              {assessment.type} · {assessment.outcome} ·{" "}
              {formatDate(assessment.assessedAt)}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
