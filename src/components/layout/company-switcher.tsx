"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHydrated } from "@/hooks/use-hydrated";
import { switchCompanyAction } from "@/lib/auth/actions";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { CompanyMembership } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

interface CompanySwitcherProps {
  companyId: string | null;
  companyName: string | null;
  memberships: CompanyMembership[];
  /** dropdown = header control; panel = full-width list for mobile nav sheet */
  variant?: "dropdown" | "panel";
  className?: string;
  onSwitched?: () => void;
}

export function CompanySwitcher({
  companyId,
  companyName,
  memberships,
  variant = "dropdown",
  className,
  onSwitched,
}: CompanySwitcherProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSelect = (nextCompanyId: string) => {
    if (nextCompanyId === companyId) return;
    setError(null);
    startTransition(async () => {
      const result = await switchCompanyAction(nextCompanyId);
      if (result.error) {
        setError(result.error);
        return;
      }
      onSwitched?.();
      router.refresh();
    });
  };

  if (variant === "panel") {
    if (memberships.length <= 1) {
      return (
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5",
            className,
          )}
        >
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">
            {companyName ?? "No company"}
          </span>
        </div>
      );
    }

    return (
      <div className={cn("space-y-2", className)}>
        <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Company
        </p>
        <div className="space-y-1">
          {memberships.map((membership) => {
            const active = membership.companyId === companyId;
            return (
              <button
                key={membership.companyId}
                type="button"
                disabled={pending}
                onClick={() => onSelect(membership.companyId)}
                className={cn(
                  "flex min-h-11 w-full items-start justify-between gap-2 rounded-md border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {membership.companyName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[membership.role]}
                  </p>
                </div>
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>
        {error ? (
          <p className="px-1 text-xs text-destructive">{error}</p>
        ) : null}
      </div>
    );
  }

  if (memberships.length <= 1) {
    return (
      <div
        className={cn(
          "flex min-w-0 max-w-[10rem] items-center gap-2 sm:max-w-[14rem] md:max-w-[220px]",
          className,
        )}
      >
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">
          {companyName ?? "No company"}
        </span>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "inline-flex h-11 max-w-[10rem] gap-2 sm:max-w-[14rem] md:max-w-[220px]",
          className,
        )}
        type="button"
        disabled
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="truncate">{companyName ?? "Select company"}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "inline-flex h-11 max-w-[10rem] gap-2 sm:max-w-[14rem] md:max-w-[220px]",
            className,
          )}
          disabled={pending}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{companyName ?? "Select company"}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.companyId}
            onSelect={() => onSelect(membership.companyId)}
            className="flex min-h-11 items-start justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {membership.companyName}
              </p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[membership.role]}
              </p>
            </div>
            <Check
              className={cn(
                "mt-0.5 h-4 w-4",
                membership.companyId === companyId
                  ? "opacity-100"
                  : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
        {error ? (
          <p className="px-2 py-1.5 text-xs text-destructive">{error}</p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
