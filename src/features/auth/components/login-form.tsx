"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { touchLastLoginAction } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations";

const PLATFORM_ADMIN_ALIASES = new Set(["entopy", "entropy"]);
const PLATFORM_ADMIN_EMAIL = "entopy@arscodeamatoria.com";

function resolveLoginEmail(identifier: string): { email?: string; error?: string } {
  const trimmed = identifier.trim();
  if (!trimmed) return { error: "Enter your email." };
  if (!trimmed.includes("@")) {
    if (!PLATFORM_ADMIN_ALIASES.has(trimmed.toLowerCase())) {
      return { error: "Enter a valid email address." };
    }
    return { email: PLATFORM_ADMIN_EMAIL };
  }
  return { email: trimmed.toLowerCase() };
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(() => {
    const error = searchParams.get("error");
    if (error === "inactive") {
      return "Your account is inactive. Contact your company administrator.";
    }
    if (error === "no_profile") {
      return "No profile was found for this account. Contact support.";
    }
    if (error === "config") {
      return "Supabase is not configured. Add your project keys to .env.local.";
    }
    if (error === "auth_callback") {
      return "Authentication link is invalid or expired.";
    }
    return null;
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const resolved = resolveLoginEmail(values.identifier);
      if (resolved.error || !resolved.email) {
        setFormError(resolved.error ?? "Unable to sign in.");
        return;
      }

      const supabase = createClient({ rememberMe: values.rememberMe });
      const { error } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password: values.password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      try {
        await touchLastLoginAction();
      } catch {
        // Non-fatal — session is already established client-side.
      }

      const next = searchParams.get("next") || "/";
      router.push(next);
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Check Supabase configuration.",
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="identifier">Email</Label>
        <Input
          id="identifier"
          type="text"
          autoComplete="username"
          inputMode="email"
          placeholder="you@company.com"
          {...register("identifier")}
        />
        {errors.identifier ? (
          <p className="text-xs text-destructive">{errors.identifier.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((open) => !open)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <Controller
        control={control}
        name="rememberMe"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            Remember me for 30 days
          </label>
        )}
      />

      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        New company?{" "}
        <Link href="/signup" className="underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}
