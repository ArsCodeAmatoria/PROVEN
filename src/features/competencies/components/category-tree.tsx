"use client";

import { useState, useTransition } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCompetencyCategoryAction,
  deleteCompetencyCategoryAction,
  updateCompetencyCategoryAction,
} from "@/features/competencies/actions";
import type { CompetencyCategoryNode } from "@/services/competencies.service";

interface CategoryTreeProps {
  categories: CompetencyCategoryNode[];
  selectedCategoryId?: string;
  canManage: boolean;
  onSelect: (categoryId?: string) => void;
}

type CategoryFormState = {
  id?: string;
  code: string;
  name: string;
  description: string;
  parentId?: string;
  sortOrder: number;
};

const EMPTY_FORM: CategoryFormState = {
  code: "",
  name: "",
  description: "",
  parentId: undefined,
  sortOrder: 0,
};

function flattenOptions(
  nodes: CompetencyCategoryNode[],
  depth = 0,
  excludeId?: string,
): { id: string; label: string }[] {
  const options: { id: string; label: string }[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    options.push({
      id: node.id,
      label: `${"— ".repeat(depth)}${node.name}`,
    });
    options.push(...flattenOptions(node.children, depth + 1, excludeId));
  }
  return options;
}

function CategoryBranch({
  nodes,
  depth,
  selectedCategoryId,
  canManage,
  onSelect,
  onEdit,
  onDelete,
}: {
  nodes: CompetencyCategoryNode[];
  depth: number;
  selectedCategoryId?: string;
  canManage: boolean;
  onSelect: (categoryId?: string) => void;
  onEdit: (node: CompetencyCategoryNode) => void;
  onDelete: (categoryId: string) => void;
}) {
  return (
    <ul className={depth === 0 ? "space-y-1" : "ml-3 space-y-1 border-l border-border pl-3"}>
      {nodes.map((node) => {
        const selected = selectedCategoryId === node.id;
        return (
          <li key={node.id}>
            <div
              className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm ${
                selected ? "bg-accent text-accent-foreground" : "hover:bg-muted/60"
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => onSelect(node.id)}
              >
                {node.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {node.competencyCount}
                </span>
              </button>
              {canManage ? (
                <div className="flex shrink-0 opacity-0 transition group-hover:opacity-100">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onEdit(node)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onDelete(node.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>
            {node.children.length > 0 ? (
              <CategoryBranch
                nodes={node.children}
                depth={depth + 1}
                selectedCategoryId={selectedCategoryId}
                canManage={canManage}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function CategoryTree({
  categories,
  selectedCategoryId,
  canManage,
  onSelect,
}: CategoryTreeProps) {
  const [form, setForm] = useState<CategoryFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const parentOptions = flattenOptions(categories, 0, form?.id);

  const submitForm = () => {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const payload = {
        code: form.code,
        name: form.name,
        description: form.description,
        parentId: form.parentId,
        sortOrder: form.sortOrder,
      };
      const result = form.id
        ? await updateCompetencyCategoryAction(form.id, payload)
        : await createCompetencyCategoryAction(payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      setForm(null);
    });
  };

  const onDelete = (categoryId: string) => {
    if (!confirm("Delete this category?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCompetencyCategoryAction(categoryId);
      if (result.error) setError(result.error);
      if (selectedCategoryId === categoryId) onSelect(undefined);
    });
  };

  return (
    <Card className="shadow-none">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderTree className="h-4 w-4" />
              Categories
            </CardTitle>
            <CardDescription>Nested competency library groups</CardDescription>
          </div>
          {canManage ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setForm({ ...EMPTY_FORM })}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          ) : null}
        </div>
        <Button
          type="button"
          variant={!selectedCategoryId ? "secondary" : "ghost"}
          size="sm"
          className="justify-start"
          onClick={() => onSelect(undefined)}
        >
          All competencies
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <CategoryBranch
          nodes={categories}
          depth={0}
          selectedCategoryId={selectedCategoryId}
          canManage={canManage}
          onSelect={onSelect}
          onEdit={(node) =>
            setForm({
              id: node.id,
              code: node.code,
              name: node.name,
              description: node.description ?? "",
              parentId: node.parentId ?? undefined,
              sortOrder: node.sortOrder,
            })
          }
          onDelete={onDelete}
        />

        {form ? (
          <div className="space-y-3 rounded-md border border-border p-3">
            <p className="text-sm font-medium">
              {form.id ? "Edit category" : "New category"}
            </p>
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-code">Code</Label>
              <Input
                id="category-code"
                value={form.code}
                onChange={(event) =>
                  setForm({ ...form, code: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Parent</Label>
              <Select
                value={form.parentId || "none"}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    parentId: value === "none" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top level)</SelectItem>
                  {parentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-sort">Sort order</Label>
              <Input
                id="category-sort"
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm({
                    ...form,
                    sortOrder: Number(event.target.value || 0),
                  })
                }
              />
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={pending} onClick={submitForm}>
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => setForm(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
        {error && !form ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
