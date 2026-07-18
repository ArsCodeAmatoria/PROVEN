import type { Metadata } from "next";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Create company",
};

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.02_255)_0%,_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.22_0.03_255)_0%,_transparent_55%)]" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-lg shadow-none">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl tracking-tight">
              Create your company
            </CardTitle>
            <CardDescription>
              Register as a Company Admin. You can invite unlimited employees
              afterward.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
