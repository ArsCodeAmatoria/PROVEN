import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Workspace configuration for your organization."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
            <CardDescription>
              Name, branding, and default trade programs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect Supabase Auth and set{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                PROVEN_DEFAULT_ORG_ID
              </code>{" "}
              to scope data to your organization.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Integrations</CardTitle>
            <CardDescription>
              Database and authentication providers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Supabase Auth + Postgres</li>
              <li>Prisma ORM</li>
              <li>TanStack Query (client cache)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
