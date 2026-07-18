import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { SessionProfile } from "@/lib/auth/session";
import { MobileNav } from "@/components/layout/mobile-nav";

interface AppHeaderProps {
  profile: SessionProfile;
}

export function AppHeader({ profile }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <MobileNav role={profile.role} />

        <div className="hidden min-w-0 flex-1 lg:block">
          <p className="truncate text-sm text-muted-foreground">
            {profile.company?.name ?? "Proven"}
            <span className="mx-2 text-border">·</span>
            Competency Management System
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <UserMenu
            firstName={profile.firstName}
            lastName={profile.lastName}
            email={profile.email}
            role={profile.role}
            avatarUrl={profile.avatarUrl}
            companyName={profile.company?.name}
          />
        </div>
      </div>
    </header>
  );
}
