import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanySettingsForm } from "@/features/settings/components/company-settings-form";
import { UserSettingsForm } from "@/features/settings/components/user-settings-form";
import { isAdminRole } from "@/lib/auth/permissions";
import { requireAuth } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const profile = await requireAuth();
  const settings = profile.settings;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="User preferences and company configuration."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">User preferences</CardTitle>
            <CardDescription>
              Notifications, locale, and sign-in defaults.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserSettingsForm
              defaultValues={{
                emailNotifications: settings?.emailNotifications ?? true,
                assessmentReminders: settings?.assessmentReminders ?? true,
                rememberMeDefault: settings?.rememberMeDefault ?? true,
                timezone: settings?.timezone ?? "America/New_York",
                locale: settings?.locale ?? "en-US",
              }}
            />
          </CardContent>
        </Card>

        {isAdminRole(profile.role) && profile.company ? (
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Company</CardTitle>
              <CardDescription>
                Workspace details for {profile.company.name}. Employees can be
                unlimited.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanySettingsForm
                defaultValues={{
                  name: profile.company.name,
                  phone: profile.company.phone ?? "",
                  website: profile.company.website ?? "",
                  address: profile.company.address ?? "",
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Company</CardTitle>
              <CardDescription>
                {profile.company?.name
                  ? `You belong to ${profile.company.name}.`
                  : "No company is linked to this account."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Company settings are managed by Super Admins and Company Admins.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
