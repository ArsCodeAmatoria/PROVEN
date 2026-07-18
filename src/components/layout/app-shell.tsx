import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <SidebarNav />
      </div>
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <AppHeader />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
