"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { CategoryTree } from "@/features/competencies/components/category-tree";
import { CompetencyList } from "@/features/competencies/components/competency-list";
import type {
  CompetencyCategoryNode,
  CompetencyListItem,
} from "@/services/competencies.service";
import type { PaginatedResult } from "@/types";

interface CompetencyLibraryProps {
  result: PaginatedResult<CompetencyListItem> | null;
  error?: string | null;
  categories: CompetencyCategoryNode[];
  categoryOptions: { id: string; label: string }[];
  canManage: boolean;
  filters: {
    q?: string;
    status?: string;
    difficulty?: string;
    categoryId?: string;
  };
}

export function CompetencyLibrary({
  result,
  error,
  categories,
  categoryOptions,
  canManage,
  filters,
}: CompetencyLibraryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const onSelectCategory = (categoryId?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!categoryId) params.delete("categoryId");
    else params.set("categoryId", categoryId);
    params.delete("page");
    startTransition(() => {
      router.push(`/competencies?${params.toString()}`);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <CategoryTree
        categories={categories}
        selectedCategoryId={filters.categoryId}
        canManage={canManage}
        onSelect={onSelectCategory}
      />
      <CompetencyList
        result={result}
        error={error}
        categoryOptions={categoryOptions}
        canManage={canManage}
        filters={filters}
      />
    </div>
  );
}
