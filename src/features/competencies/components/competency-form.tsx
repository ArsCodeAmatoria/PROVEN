"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
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
  createCompetencyAction,
  updateCompetencyAction,
} from "@/features/competencies/actions";
import {
  COMPETENCY_DIFFICULTY_LABELS,
  COMPETENCY_STATUS_LABELS,
} from "@/features/competencies/constants";
import {
  createCompetencySchema,
  type CreateCompetencyInput,
} from "@/lib/validations/competency";

interface CompetencyFormProps {
  mode: "create" | "edit";
  competencyId?: string;
  categoryOptions: { id: string; label: string }[];
  defaultValues?: Partial<CreateCompetencyInput>;
}

const EMPTY_VALUES: CreateCompetencyInput = {
  code: "",
  title: "",
  description: "",
  categoryId: undefined,
  reference: "",
  csaReference: "",
  asmeReference: "",
  workSafeBcReference: "",
  requiredDemonstrations: "",
  requiredDemonstrationCount: undefined,
  requiredScore: undefined,
  difficulty: "INTERMEDIATE",
  estimatedTimeMinutes: undefined,
  trade: "",
  level: 1,
  status: "DRAFT",
};

export function CompetencyForm({
  mode,
  competencyId,
  categoryOptions,
  defaultValues,
}: CompetencyFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateCompetencyInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCompetencySchema as any),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCompetencyAction(values)
          : await updateCompetencyAction(competencyId!, values);
      if (result?.error) setError(result.error);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-medium">Basics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" {...register("code")} />
            {errors.code ? (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={5} {...register("description")} />
            {errors.description ? (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium">Assessment requirements</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Controller
              control={control}
              name="difficulty"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMPETENCY_DIFFICULTY_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMPETENCY_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requiredDemonstrationCount">
              Required successful demos
            </Label>
            <Input
              id="requiredDemonstrationCount"
              type="number"
              min={1}
              max={100}
              {...register("requiredDemonstrationCount")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requiredScore">Required score (%)</Label>
            <Input
              id="requiredScore"
              type="number"
              min={0}
              max={100}
              {...register("requiredScore")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedTimeMinutes">Estimated time (minutes)</Label>
            <Input
              id="estimatedTimeMinutes"
              type="number"
              min={1}
              {...register("estimatedTimeMinutes")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trade">Trade</Label>
            <Input id="trade" {...register("trade")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Input id="level" type="number" min={1} max={10} {...register("level")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="requiredDemonstrations">Required demonstrations</Label>
            <Textarea
              id="requiredDemonstrations"
              rows={5}
              placeholder="One demonstration per line"
              {...register("requiredDemonstrations")}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium">References</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" {...register("reference")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="csaReference">CSA reference</Label>
            <Input id="csaReference" {...register("csaReference")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asmeReference">ASME reference</Label>
            <Input id="asmeReference" {...register("asmeReference")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="workSafeBcReference">WorkSafeBC reference</Label>
            <Input
              id="workSafeBcReference"
              {...register("workSafeBcReference")}
            />
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create competency"
              : "Save changes"}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link
            href={competencyId ? `/competencies/${competencyId}` : "/competencies"}
          >
            Cancel
          </Link>
        </Button>
      </div>
    </form>
  );
}
