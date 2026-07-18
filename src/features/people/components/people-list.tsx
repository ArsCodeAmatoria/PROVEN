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
import type { EmployeeWithUser } from "@/services/people.service";
import { fullName, getInitials } from "@/utils/format";

interface PeopleListProps {
  items: EmployeeWithUser[];
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
        title="No employees in this company"
        description="Employees link authenticated users to a company with a role. Companies can have unlimited employees."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((employee) => (
        <Card key={employee.id} className="shadow-none">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Avatar>
              {employee.user.avatarUrl ? (
                <AvatarImage src={employee.user.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>
                {getInitials(employee.user.firstName, employee.user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">
                  {fullName(employee.user.firstName, employee.user.lastName)}
                </CardTitle>
                <Badge variant="secondary">{ROLE_LABELS[employee.role]}</Badge>
              </div>
              <CardDescription className="truncate">
                {employee.user.email}
                {employee.title ? ` · ${employee.title}` : ""}
                {employee.employeeNumber
                  ? ` · #${employee.employeeNumber}`
                  : ""}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
