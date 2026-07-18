import { GraduationCap } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "@/types";
import { formatDate } from "@/utils/format";

interface ApprenticeshipListProps {
  items: Project[];
  error?: string | null;
}

/** Lists company projects (replaces legacy apprenticeship list UI). */
export function ApprenticeshipList({
  items,
  error,
}: ApprenticeshipListProps) {
  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load projects</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No projects"
        description="Create projects to assign employees, track hours, and scope training matrices and assessments."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id} className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">{item.name}</CardTitle>
              <CardDescription>
                {item.code}
                {item.location ? ` · ${item.location}` : ""}
                {item.startDate ? ` · ${formatDate(item.startDate)}` : ""}
              </CardDescription>
            </div>
            <Badge variant="outline">{item.status}</Badge>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
