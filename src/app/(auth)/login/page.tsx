import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.02_255)_0%,_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.22_0.03_255)_0%,_transparent_55%)]" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-md shadow-none">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl tracking-tight">
              Sign in to Proven
            </CardTitle>
            <CardDescription>
              Competency management for construction teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Suspense fallback={<div className="h-40 animate-pulse rounded-md bg-muted" />}>
              <LoginForm />
            </Suspense>
            <p className="text-center text-xs text-muted-foreground">
              Need access? Ask your company admin, or{" "}
              <Link href="/signup" className="underline underline-offset-4">
                register a company
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
