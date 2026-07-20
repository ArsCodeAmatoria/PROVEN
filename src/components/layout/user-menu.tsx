"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { signOutAction } from "@/lib/auth/actions";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/roles";
import { fullName, getInitials } from "@/utils/format";

interface UserMenuProps {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  companyName?: string | null;
}

function AccountTriggerButton({
  firstName,
  lastName,
  avatarUrl,
  ...props
}: {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
} & ComponentPropsWithoutRef<typeof Button>) {
  return (
    <Button
      variant="ghost"
      className="h-9 gap-2 px-2"
      aria-label="Open account menu"
      type="button"
      {...props}
    >
      <Avatar className="h-7 w-7">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback className="text-[10px]">
          {getInitials(firstName, lastName)}
        </AvatarFallback>
      </Avatar>
      <span className="hidden max-w-[140px] truncate text-sm font-medium md:inline">
        {fullName(firstName, lastName)}
      </span>
    </Button>
  );
}

export function UserMenu({
  firstName,
  lastName,
  email,
  role,
  avatarUrl,
  companyName,
}: UserMenuProps) {
  const hydrated = useHydrated();

  // Static twin until mount — prevents Radix useId SSR/client mismatches.
  if (!hydrated) {
    return (
      <AccountTriggerButton
        firstName={firstName}
        lastName={lastName}
        avatarUrl={avatarUrl}
        disabled
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AccountTriggerButton
          firstName={firstName}
          lastName={lastName}
          avatarUrl={avatarUrl}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="space-y-1 font-normal">
          <p className="text-sm font-medium">{fullName(firstName, lastName)}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <p className="text-xs text-muted-foreground">
            {ROLE_LABELS[role]}
            {companyName ? ` · ${companyName}` : ""}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void signOutAction();
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
