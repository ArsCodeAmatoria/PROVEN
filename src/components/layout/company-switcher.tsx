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
import { switchCompanyAction } from "@/lib/auth/actions";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { CompanyMembership } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

interface CompanySwitcherProps {
  companyId: string | null;
  companyName: string | null;
  memberships: CompanyMembership[];
}

export function CompanySwitcher({
  companyId,
  companyName,
  memberships,
}: CompanySwitcherProps) {
  const router = useRouter();
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
      router.refresh();
    });
  };

  if (memberships.length <= 1) {
    return (
      <div className="hidden min-w-0 items-center gap-2 md:flex">
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">
          {companyName ?? "No company"}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden h-9 max-w-[220px] gap-2 md:inline-flex"
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
            className="flex items-start justify-between gap-2"
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
