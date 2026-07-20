import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { FileBrowser } from "@/features/files/components/file-browser";
import { canWrite, isAdminRole } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getFilesBrowser } from "@/services/files.service";
import type { UserRole } from "@/types/roles";

export const metadata: Metadata = {
  title: "Files",
};

type PageProps = {
  searchParams: Promise<{ folderId?: string }>;
};

function canManageFiles(role: UserRole) {
  return (
    canWrite(role) &&
    (isAdminRole(role) || role === "SUPERVISOR" || role === "INSTRUCTOR")
  );
}

export default async function FilesPage({ searchParams }: PageProps) {
  await requirePermission("files");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const params = await searchParams;
  const result = await getFilesBrowser(companyId, params.folderId ?? null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        description="Company folders, documents, and images — policies, forms, photos, and more."
      />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : result.data ? (
        <FileBrowser
          data={result.data}
          canManage={canManageFiles(profile.role)}
        />
      ) : null}
    </div>
  );
}
