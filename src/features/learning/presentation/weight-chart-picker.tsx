"use client";

import { useState } from "react";
import { WEIGHT_CHART_CATEGORIES, type WeightChartCategory } from "@/features/learning/data/weight-charts";

export function WeightChartPicker({ initialCategoryId }: { initialCategoryId?: string }) {
  const [categoryId, setCategoryId] = useState(
    initialCategoryId ?? WEIGHT_CHART_CATEGORIES[0]?.id ?? "density",
  );
  const category: WeightChartCategory | undefined = WEIGHT_CHART_CATEGORIES.find(
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
          {WEIGHT_CHART_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      {category ? (
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">{category.description}</p>
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
