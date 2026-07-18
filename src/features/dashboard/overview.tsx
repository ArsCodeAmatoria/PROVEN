import Link from "next/link";

import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardMetrics } from "@/types";

interface DashboardOverviewProps {
  metrics: DashboardMetrics | null;
  error?: string | null;
}

const QUICK_LINKS = [
  {
    title: "Competencies",
    description: "Maintain verified trade competency definitions and criteria.",
    href: "/competencies",
  },
  {
    title: "Assessments",
    description: "Track continuous and practical competency assessments.",
    href: "/assessments",
  },
  {
    title: "Apprenticeships",
    description: "Monitor project assignments, hours, and training matrix progress.",
    href: "/apprenticeships",
  },
  {
    title: "Certifications",
    description: "Manage credential lifecycle and upcoming expirations.",
    href: "/certifications",
  },
] as const;

export function DashboardOverview({ metrics, error }: DashboardOverviewProps) {
  const values = metrics ?? {
    activeCompetencies: 0,
    openAssessments: 0,
    activeProjects: 0,
    expiringCertificates: 0,
    recentObservations: 0,
    publishedExams: 0,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Operational view of competency verification across your organization."
      />

      {error ? (
        <Card className="shadow-none border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-base">Configuration required</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
Connect Supabase Auth and Postgres, then apply the RLS migration in `supabase/migrations`.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Active competencies"
          value={values.activeCompetencies}
          description="Published competency standards"
        />
        <StatCard
          label="Open assessments"
          value={values.openAssessments}
          description="Scheduled or in progress"
        />
        <StatCard
          label="Active projects"
          value={values.activeProjects}
          description="Jobsites with active work"
        />
        <StatCard
          label="Expiring certificates"
          value={values.expiringCertificates}
          description="Within the next 30 days"
        />
        <StatCard
          label="Recent observations"
          value={values.recentObservations}
          description="Instructor observations (7 days)"
        />
        <StatCard
          label="Published exams"
          value={values.publishedExams}
          description="Available written examinations"
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Modules
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {QUICK_LINKS.map((item) => (
            <Card key={item.href} className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href={item.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
