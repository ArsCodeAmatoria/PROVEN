"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserSettingsAction } from "@/lib/auth/actions";
import {
  userSettingsSchema,
  type UserSettingsInput,
} from "@/lib/validations";

interface UserSettingsFormProps {
  defaultValues: UserSettingsInput;
}

export function UserSettingsForm({ defaultValues }: UserSettingsFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { register, control, handleSubmit } = useForm<UserSettingsInput>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit((values) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateUserSettingsAction(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Settings saved.");
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Controller
        control={control}
        name="emailNotifications"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            Email notifications
          </label>
        )}
      />
      <Controller
        control={control}
        name="assessmentReminders"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            Assessment reminders
          </label>
        )}
      />
      <Controller
        control={control}
        name="rememberMeDefault"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            Remember me by default on sign in
          </label>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" {...register("timezone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locale">Locale</Label>
          <Input id="locale" {...register("locale")} />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
