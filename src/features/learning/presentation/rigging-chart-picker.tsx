"use client";

import { useState } from "react";
import { RIGGING_CHART_CATEGORIES, type RiggingChartCategory } from "@/features/learning/data/rigging-charts";
import { RiggingDiagram } from "@/features/learning/diagrams";

export function RiggingChartPicker({ initialCategoryId }: { initialCategoryId?: string }) {
  const [categoryId, setCategoryId] = useState(
    initialCategoryId ?? RIGGING_CHART_CATEGORIES[0]?.id ?? "sine-angle",
  );
  const category: RiggingChartCategory | undefined = RIGGING_CHART_CATEGORIES.find(
    (c) => c.id === categoryId,
  );

  return (
    <div className="space-y-6">
      <label className="block space-y-2">
        <span className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Chart type
        </span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full min-h-[52px] bg-foreground/5 px-4 py-3 text-lg text-foreground"
        >
          {RIGGING_CHART_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      {category ? (
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">{category.description}</p>
          {categoryId === "sine-angle" || categoryId === "two-leg-tension" ? (
            <RiggingDiagram
              id="tension-multiplier-chart"
              caption="Leg angle from horizontal — lower angle means higher tension per leg"
            />
          ) : null}
          {categoryId === "basket-inclined" ? (
            <RiggingDiagram
              id="basket-vertical-vs-inclined"
              caption="Vertical basket legs vs inclined legs — derate when legs are not plumb"
            />
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-lg">
              <thead>
                <tr className="border-b border-foreground/20">
                  <th className="py-3 pr-4 font-display text-sm font-semibold uppercase tracking-wide">
                    Item
                  </th>
                  <th className="py-3 font-display text-sm font-semibold uppercase tracking-wide">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {category.rows.map((row) => (
                  <tr key={row.label} className="border-b border-foreground/10">
                    <td className="py-3 pr-4 align-top font-medium">{row.label}</td>
                    <td className="py-3 align-top">
                      <span className="font-semibold">{row.value}</span>
                      {row.note ? (
                        <span className="mt-1 block text-sm text-muted-foreground">{row.note}</span>
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
