import Link from "next/link";
import {
  Award,
  BadgeCheck,
  ClipboardCheck,
  Eye,
  Plus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ACTIONS = [
  {
    title: "New assessment",
    description: "Schedule a competency evaluation",
    href: "/assessments/new",
    icon: ClipboardCheck,
  },
  {
    title: "Record observation",
    description: "Capture instructor field notes",
    href: "/observations",
    icon: Eye,
  },
  {
    title: "Add competency",
    description: "Define a trade standard",
    href: "/competencies/new",
    icon: BadgeCheck,
  },
  {
    title: "Issue certificate",
    description: "Register a credential",
    href: "/certifications",
    icon: Award,
  },
  {
    title: "Add employee",
    description: "Create a company employment record",
    href: "/people/new",
    icon: Users,
  },
] as const;

export function QuickActions() {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Quick actions</CardTitle>
          <CardDescription>Common competency workflows</CardDescription>
        </div>
        <Plus className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {ACTIONS.map((action) => (
          <Button
            key={action.href + action.title}
            asChild
            variant="outline"
            className="h-auto justify-start gap-3 px-3 py-3 text-left"
          >
            <Link href={action.href}>
              <action.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{action.title}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {action.description}
                </span>
              </span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
