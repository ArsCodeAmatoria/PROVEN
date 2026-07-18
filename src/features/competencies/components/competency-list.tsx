import { BadgeCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Competency } from "@/types";

interface CompetencyListProps {
  items: Competency[];
  error?: string | null;
}

export function CompetencyList({ items, error }: CompetencyListProps) {
  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load competencies</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BadgeCheck}
        title="No competencies yet"
        description="Define trade competencies with measurable criteria so assessors can verify practical capability in the field."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((competency) => (
        <Card key={competency.id} className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{competency.title}</CardTitle>
                <Badge variant="secondary">{competency.code}</Badge>
                <Badge variant="outline">{competency.status}</Badge>
              </div>
              <CardDescription>
                {competency.trade ?? "General"} · Level {competency.level} · v
                {competency.version}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {competency.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
