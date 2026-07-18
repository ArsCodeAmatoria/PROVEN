import { ClipboardCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Assessment } from "@/types";
import { formatDate } from "@/utils/format";

interface AssessmentListProps {
  items: Assessment[];
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
        title="No assessments"
        description="Schedule practical, written, observation, portfolio, and oral assessments tied to verified competencies."
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
              {assessment.type} · {assessment.status} ·{" "}
              {formatDate(assessment.scheduledAt ?? assessment.completedAt)}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
