"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompanyAction } from "@/lib/auth/actions";
import {
  companyUpdateSchema,
  type CompanyUpdateInput,
} from "@/lib/validations";

interface CompanySettingsFormProps {
  defaultValues: CompanyUpdateInput;
}

export function CompanySettingsForm({
  defaultValues,
}: CompanySettingsFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyUpdateInput>({
    resolver: zodResolver(companyUpdateSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit((values) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateCompanyAction(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Company updated.");
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company name</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        ) : null}
      </div>
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
        <Input
          id="logoUrl"
          placeholder="https://…"
          {...register("logoUrl")}
        />
        {errors.logoUrl ? (
          <p className="text-xs text-destructive">{errors.logoUrl.message}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Used on professional PDF reports.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save company"}
      </Button>
    </form>
  );
}
