import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarUpload } from "@/features/profile/components/avatar-upload";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { requireAuth } from "@/lib/auth/session";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const profile = await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal details and avatar."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="shadow-none h-fit">
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AvatarUpload
              firstName={profile.firstName}
              lastName={profile.lastName}
              avatarUrl={profile.avatarUrl}
            />
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Company</span>
                <span className="truncate text-right">
                  {profile.company?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Member since</span>
                <span>{formatDate(profile.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Personal details</CardTitle>
            <CardDescription>
              Visible to instructors and admins in your company.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              defaultValues={{
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone ?? "",
                title: profile.title ?? "",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
