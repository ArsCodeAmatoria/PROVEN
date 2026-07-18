import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { SessionProfile } from "@/lib/auth/session";

interface AppShellProps {
  profile: SessionProfile;
  children: React.ReactNode;
}

export function AppShell({ profile, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <SidebarNav role={profile.role} />
      </div>
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <AppHeader profile={profile} />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
