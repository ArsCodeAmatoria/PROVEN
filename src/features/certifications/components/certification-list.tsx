import { Award } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Certificate } from "@/types";
import { formatDate } from "@/utils/format";

interface CertificationListProps {
  items: Certificate[];
  error?: string | null;
}

export function CertificationList({ items, error }: CertificationListProps) {
  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load certificates</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No certificates"
        description="Store issued credentials, issuers, credential IDs, and expiration dates for compliance tracking."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id} className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">{item.name}</CardTitle>
              <CardDescription>
                {item.issuer}
                {item.expiresAt ? ` · Expires ${formatDate(item.expiresAt)}` : ""}
              </CardDescription>
            </div>
            <Badge variant="outline">{item.status}</Badge>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
