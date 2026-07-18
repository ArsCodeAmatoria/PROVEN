import { Eye } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Observation } from "@/types";
import { formatDate } from "@/utils/format";

interface ObservationListProps {
  items: Observation[];
  error?: string | null;
}

export function ObservationList({ items, error }: ObservationListProps) {
  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load observations</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="No instructor observations"
        description="Capture field observations with ratings and notes to support competency verification decisions."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id} className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">{item.context}</CardTitle>
              <CardDescription>{formatDate(item.observedAt)}</CardDescription>
            </div>
            <Badge variant="secondary">{item.rating}</Badge>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
