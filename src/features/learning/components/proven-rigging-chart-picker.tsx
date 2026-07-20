"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RIGGING_CHART_CATEGORIES,
  type RiggingChartCategory,
} from "@/features/learning/data/rigging-charts";
import { RiggingDiagram } from "@/features/learning/diagrams";
import { cn } from "@/lib/utils";

export function ProvenRiggingChartPicker({
  initialCategoryId,
  className,
}: {
  initialCategoryId?: string;
  className?: string;
}) {
  const [categoryId, setCategoryId] = useState(
    initialCategoryId ?? RIGGING_CHART_CATEGORIES[0]?.id ?? "sine-angle",
  );
  const category: RiggingChartCategory | undefined =
    RIGGING_CHART_CATEGORIES.find((c) => c.id === categoryId);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <label
          htmlFor="rigging-chart-type"
          className="text-sm font-medium text-foreground"
        >
          Chart type
        </label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="rigging-chart-type" className="w-full max-w-md">
            <SelectValue placeholder="Select a chart" />
          </SelectTrigger>
          <SelectContent>
            {RIGGING_CHART_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{category.description}</p>
          {categoryId === "sine-angle" || categoryId === "two-leg-tension" ? (
            <div className="rounded-md border bg-card p-4">
              <RiggingDiagram
                id="tension-multiplier-chart"
                caption="Leg angle from horizontal — lower angle means higher tension per leg"
              />
            </div>
          ) : null}
          {categoryId === "basket-inclined" ? (
            <div className="rounded-md border bg-card p-4">
              <RiggingDiagram
                id="basket-vertical-vs-inclined"
                caption="Vertical basket legs vs inclined legs — derate when legs are not plumb"
              />
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {category.rows.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="px-4 py-3 align-top font-medium">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="tabular-nums">{row.value}</span>
                      {row.note ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {row.note}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
