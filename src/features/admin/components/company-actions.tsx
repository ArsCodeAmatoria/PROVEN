"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  archiveCompanyAction,
  deactivateCompanyAction,
} from "@/features/admin/actions";

interface CompanyActionsProps {
  companyId: string;
  isActive: boolean;
}

export function CompanyActions({ companyId, isActive }: CompanyActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending || !isActive}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await deactivateCompanyAction(companyId);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        Deactivate
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              "Archive this company? It will be soft-deleted and hidden from lists.",
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await archiveCompanyAction(companyId);
            if (result?.error) {
              setError(result.error);
            }
          });
        }}
      >
        Archive
      </Button>
      {error ? (
        <p className="w-full text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
