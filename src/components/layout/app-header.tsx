import { CompanySwitcher } from "@/components/layout/company-switcher";
import { GlobalSearch } from "@/components/layout/global-search";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { SessionProfile } from "@/lib/auth/session";
import type { DashboardNotificationItem } from "@/services/dashboard.service";

interface AppHeaderProps {
  profile: SessionProfile;
  notifications?: DashboardNotificationItem[];
}

export function AppHeader({
  profile,
  notifications = [],
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-4 md:gap-3 md:px-6">
        <MobileNav role={profile.role} />

        <CompanySwitcher
          companyId={profile.companyId}
          companyName={profile.company?.name ?? null}
          memberships={profile.memberships}
        />

        <div className="hidden flex-1 md:block md:max-w-md lg:max-w-lg">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <div className="md:hidden">
            <GlobalSearch compact />
          </div>
          <NotificationsMenu items={notifications} />
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
