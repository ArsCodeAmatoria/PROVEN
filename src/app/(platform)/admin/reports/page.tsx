import type { Metadata } from "next";

import { PageHeader, StatCard } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlatformReportsSummary } from "@/services/admin.service";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = {
  title: "Reports · Platform Admin",
};

export default async function AdminReportsPage() {
  const result = await getPlatformReportsSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Platform-wide counts and recent completed assessments."
      />
      {result.error || !result.data ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Unable to load reports</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Companies" value={result.data.companies} />
            <StatCard label="Workers" value={result.data.workers} />
            <StatCard label="Assessments" value={result.data.assessments} />
            <StatCard label="Observations" value={result.data.observations} />
            <StatCard label="Projects" value={result.data.projects} />
            <StatCard label="Certificates" value={result.data.certificates} />
            <StatCard label="Competencies" value={result.data.competencies} />
            <StatCard label="Documents" value={result.data.documents} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Top companies by workers
                </CardTitle>
                <CardDescription>Largest tenant workforces</CardDescription>
              </CardHeader>
              <CardContent>
                {result.data.topCompaniesByWorkers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {result.data.topCompaniesByWorkers.map((company) => (
                      <li
                        key={company.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="font-medium">{company.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {company.workerCount}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Recent completed assessments
                </CardTitle>
                <CardDescription>Latest completions platform-wide</CardDescription>
              </CardHeader>
              <CardContent>
                {result.data.recentCompletions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No completions yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {result.data.recentCompletions.map((item) => (
                      <li key={item.id} className="space-y-1 py-2 text-sm">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.companyName} · {formatDate(item.completedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
