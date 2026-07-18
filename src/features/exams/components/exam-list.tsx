import { FileText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WrittenExam } from "@/types";

interface ExamListProps {
  items: WrittenExam[];
  error?: string | null;
}

export function ExamList({ items, error }: ExamListProps) {
  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load exams</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No written exams"
        description="Publish written examinations linked to competencies with passing scores and timed attempts."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((exam) => (
        <Card key={exam.id} className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">{exam.title}</CardTitle>
              <CardDescription>
                {exam.code} · Passing score {exam.passingScore}%
                {exam.timeLimitMin ? ` · ${exam.timeLimitMin} min` : ""}
              </CardDescription>
            </div>
            <Badge variant="outline">{exam.status}</Badge>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
