import { Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { Profile } from "@/types";
import { fullName, getInitials } from "@/utils/format";

interface PeopleListProps {
  items: Profile[];
  error?: string | null;
}

export function PeopleList({ items, error }: PeopleListProps) {
  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load people</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No people in this company"
        description="Profiles link Supabase Auth users to roles such as instructor, supervisor, apprentice, and operator. Companies can have unlimited employees."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((person) => (
        <Card key={person.id} className="shadow-none">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Avatar>
              {person.avatarUrl ? (
                <AvatarImage src={person.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>
                {getInitials(person.firstName, person.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">
                  {fullName(person.firstName, person.lastName)}
                </CardTitle>
                <Badge variant="secondary">{ROLE_LABELS[person.role]}</Badge>
              </div>
              <CardDescription className="truncate">
                {person.email}
                {person.title ? ` · ${person.title}` : ""}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
