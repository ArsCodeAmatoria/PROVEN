import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import { listCompanyCorEvidence } from "@/services/compliance.service";
import { formatDate } from "@/utils/format";
import { Library } from "lucide-react";

export const metadata: Metadata = {
  title: "Evidence Library",
};

export default async function EvidenceLibraryPage() {
  await requirePermission("compliance");
  const { companyId } = await requireCompanyId();
  const result = await listCompanyCorEvidence(companyId);
  const items = result.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence Library"
        description="Photos, files, and documents attached to COR audit questions."
      >
        <Button asChild variant="outline">
          <Link href="/compliance/audits">Open audits</Link>
        </Button>
      </PageHeader>
      <ComplianceSubnav activeHref="/compliance/evidence" />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No evidence yet"
          description="Attach photos or files while answering questions in an internal audit."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.linkId} className="rounded-md border p-3">
              {item.sourceType === "PHOTO" && item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.title}
                    className="mb-2 h-36 w-full rounded object-cover"
                  />
                </a>
              ) : null}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Q {item.questionNumber ?? "—"} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <Badge variant="outline">{item.sourceType}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
