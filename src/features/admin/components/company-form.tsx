"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCompanyAction,
  createCompanySchema,
  updateCompanyAction,
  updateCompanySchema,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from "@/features/admin/actions";

type CompanyFormValues = UpdateCompanyInput;

interface CompanyFormProps {
  mode: "create" | "edit";
  companyId?: string;
  defaultValues?: Partial<CompanyFormValues>;
}

export function CompanyForm({
  mode,
  companyId,
  defaultValues,
}: CompanyFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const schema = mode === "create" ? createCompanySchema : updateCompanySchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      website: "",
      address: "",
      logoUrl: "",
      primaryColor: "",
      secondaryColor: "",
      isActive: true,
      ...defaultValues,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      if (mode === "create") {
        const result = await createCompanyAction(values as CreateCompanyInput);
        if (result?.error) {
          setError(result.error);
        }
        return;
      }

      if (!companyId) {
        setError("Missing company id.");
        return;
      }

      const result = await updateCompanyAction(companyId, values);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Company updated.");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company name</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      {mode === "edit" ? (
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register("slug")} />
          {errors.slug ? (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register("phone")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input id="website" {...register("website")} />
        {errors.website ? (
          <p className="text-xs text-destructive">{errors.website.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("address")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" placeholder="https://…" {...register("logoUrl")} />
        {errors.logoUrl ? (
          <p className="text-xs text-destructive">{errors.logoUrl.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary color</Label>
          <Input
            id="primaryColor"
            placeholder="#1e3a5f"
            {...register("primaryColor")}
          />
          {errors.primaryColor ? (
            <p className="text-xs text-destructive">
              {errors.primaryColor.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondaryColor">Secondary color</Label>
          <Input
            id="secondaryColor"
            placeholder="#c4a35a"
            {...register("secondaryColor")}
          />
          {errors.secondaryColor ? (
            <p className="text-xs text-destructive">
              {errors.secondaryColor.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          className="h-4 w-4 rounded border border-input"
          {...register("isActive")}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create company"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
