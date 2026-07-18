"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  Award,
  ClipboardCheck,
  Clock3,
  Eye,
  FileText,
  Hammer,
  History,
  Pencil,
  Trash2,
  BadgeCheck,
  FolderOpen,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { deleteEmployeeAction } from "@/features/people/actions";
import { EmployeePhotoUpload } from "@/features/people/components/employee-photo-upload";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TABS,
  employeePhotoUrl,
} from "@/features/people/constants";
import {
  OBSERVATION_FOLLOW_UP_LABELS,
  OBSERVATION_TYPE_LABELS,
} from "@/features/observations/constants";
import { DEMONSTRATION_RATING_LABELS } from "@/features/demonstrations/constants";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { EmployeeDetail } from "@/services/people.service";
import { formatDate, formatRelative, fullName } from "@/utils/format";

interface DemonstrationProgressItem {
  competencyId: string;
  competencyTitle: string;
  competencyCode: string;
  requiredCount: number | null;
  successfulCount: number;
  totalCount: number;
  remainingCount: number | null;
  isComplete: boolean;
  latestRating: string | null;
  latestAssessedAt: Date | null;
}

interface EmployeeDetailViewProps {
  employee: EmployeeDetail;
  canManage: boolean;
  defaultTab?: string;
  demonstrationProgress?: DemonstrationProgressItem[];
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr] sm:items-start">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

function ListCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function EmployeeDetailView({
  employee,
  canManage,
  defaultTab = "overview",
  demonstrationProgress = [],
}: EmployeeDetailViewProps) {
  const [pending, startTransition] = useTransition();
  const photo = employeePhotoUrl(employee);

  const onDelete = () => {
    if (!confirm("Remove this employee from the company?")) return;
    startTransition(async () => {
      await deleteEmployeeAction(employee.id);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <EmployeePhotoUpload
            employeeId={employee.id}
            firstName={employee.user.firstName}
            lastName={employee.user.lastName}
            photoUrl={photo}
            canManage={canManage}
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {fullName(employee.user.firstName, employee.user.lastName)}
              </h2>
              <Badge variant="secondary">
                {EMPLOYEE_STATUS_LABELS[employee.status]}
              </Badge>
              <Badge variant="outline">{ROLE_LABELS[employee.role]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {[
                employee.employeeNumber
                  ? `#${employee.employeeNumber}`
                  : null,
                employee.trade,
                `Level ${employee.level}`,
                employee.company.name,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/people/${employee.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>
        ) : null}
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {EMPLOYEE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ListCard title="Profile">
            <dl className="space-y-3">
              <DetailRow label="Email" value={employee.user.email} />
              <DetailRow label="Phone" value={employee.user.phone} />
              <DetailRow label="Title" value={employee.title} />
              <DetailRow label="Department" value={employee.department} />
              <DetailRow label="Trade" value={employee.trade} />
              <DetailRow label="Level" value={employee.level} />
              <DetailRow label="Company" value={employee.company.name} />
              <DetailRow
                label="Supervisor"
                value={
                  employee.supervisor
                    ? fullName(
                        employee.supervisor.user.firstName,
                        employee.supervisor.user.lastName,
                      )
                    : null
                }
              />
              <DetailRow
                label="Hire date"
                value={formatDate(employee.hireDate)}
              />
              <DetailRow
                label="Hours"
                value={`${employee.totalHours.toLocaleString()} hrs`}
              />
              <DetailRow
                label="Certificates"
                value={employee.certificates.length}
              />
              <DetailRow
                label="Emergency contact"
                value={
                  employee.emergencyContactName
                    ? [
                        employee.emergencyContactName,
                        employee.emergencyContactPhone,
                        employee.emergencyContactRelation,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : null
                }
              />
              <DetailRow label="Notes" value={employee.notes} />
            </dl>
          </ListCard>

          {employee.certificates.length > 0 ? (
            <ListCard title="Certificates">
              <ul className="space-y-3">
                {employee.certificates.map((cert) => (
                  <li
                    key={cert.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cert.issuer}
                        {cert.expiresAt
                          ? ` · Expires ${formatDate(cert.expiresAt)}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{cert.status}</Badge>
                  </li>
                ))}
              </ul>
            </ListCard>
          ) : null}
        </TabsContent>

        <TabsContent value="competencies">
          <ListCard
            title="Competencies"
            description="Training matrix entries for this employee"
          >
            {employee.trainingMatrixEntries.length === 0 ? (
              <EmptyState
                icon={BadgeCheck}
                title="No competencies tracked"
                description="Competency progress appears when this employee is on a training matrix."
              />
            ) : (
              <ul className="space-y-3">
                {employee.trainingMatrixEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {entry.competency.code} · {entry.competency.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          entry.competency.trade,
                          `Level ${entry.competency.level}`,
                          entry.dueDate
                            ? `Due ${formatDate(entry.dueDate)}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <Badge variant="secondary">{entry.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </ListCard>
        </TabsContent>

        <TabsContent value="assessments">
          <ListCard title="Assessments">
            {employee.assessmentResults.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No assessments"
                description="Assessment results for this employee will show here."
              />
            ) : (
              <ul className="space-y-3">
                {employee.assessmentResults.map((result) => (
                  <li
                    key={result.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {result.assessment.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.assessment.type}
                        {result.assessedAt
                          ? ` · ${formatDate(result.assessedAt)}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{result.outcome}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </ListCard>
        </TabsContent>

        <TabsContent value="demonstrations">
          <ListCard
            title="Practical demonstrations"
            description="Successful demonstrations completed versus required count"
          >
            {demonstrationProgress.length === 0 ? (
              <EmptyState
                icon={Hammer}
                title="No demonstrations yet"
                description="Practical demonstrations for this worker will track progression here."
              />
            ) : (
              <ul className="space-y-3">
                {demonstrationProgress.map((item) => (
                  <li
                    key={item.competencyId}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.competencyCode} · {item.competencyTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          `${item.successfulCount}${item.requiredCount != null ? ` / ${item.requiredCount}` : ""} successful`,
                          `${item.totalCount} total`,
                          item.latestAssessedAt
                            ? `Latest ${formatDate(item.latestAssessedAt)}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.isComplete ? (
                        <Badge>Complete</Badge>
                      ) : item.remainingCount != null ? (
                        <Badge variant="outline">
                          {item.remainingCount} remaining
                        </Badge>
                      ) : null}
                      {item.latestRating &&
                      item.latestRating in DEMONSTRATION_RATING_LABELS ? (
                        <Badge variant="secondary">
                          {
                            DEMONSTRATION_RATING_LABELS[
                              item.latestRating as keyof typeof DEMONSTRATION_RATING_LABELS
                            ]
                          }
                        </Badge>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ListCard>
        </TabsContent>

        <TabsContent value="observations">
          <ListCard
            title="Field observations"
            description="Chronological competency history from normal work"
          >
            {employee.observationsReceived.length === 0 ? (
              <EmptyState
                icon={Eye}
                title="No observations"
                description="Field observations recorded for this worker will appear here in chronological order."
              />
            ) : (
              <ul className="space-y-3">
                {employee.observationsReceived.map((observation) => (
                  <li
                    key={observation.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/observations/${observation.id}`}
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {observation.context}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {[
                          formatDate(observation.observedAt, "MMM d, yyyy p"),
                          observation.project?.name,
                          observation.location,
                          observation.competency?.title,
                          `By ${fullName(
                            observation.observer.user.firstName,
                            observation.observer.user.lastName,
                          )}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {
                          OBSERVATION_TYPE_LABELS[
                            observation.observationType
                          ]
                        }
                      </Badge>
                      <Badge variant="outline">
                        {
                          OBSERVATION_FOLLOW_UP_LABELS[
                            observation.followUpStatus
                          ]
                        }
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ListCard>
        </TabsContent>

        <TabsContent value="exams">
          <ListCard title="Written exams">
            {employee.examResults.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No written exams"
                description="Exam attempts and scores will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {employee.examResults.map((result) => (
                  <li
                    key={result.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {result.exam.code} · {result.exam.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Started {formatDate(result.startedAt)}
                        {result.score != null
                          ? ` · Score ${result.score}${result.maxScore != null ? `/${result.maxScore}` : ""}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{result.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </ListCard>
        </TabsContent>

        <TabsContent value="hours">
          <ListCard
            title="Hours"
            description={`Total ${employee.totalHours.toLocaleString()} hrs`}
          >
            {employee.employeeHours.length === 0 ? (
              <EmptyState
                icon={Clock3}
                title="No hours logged"
                description="Work hour entries for this employee will show here."
              />
            ) : (
              <ul className="space-y-3">
                {employee.employeeHours.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {Number(entry.hours)} hrs · {entry.entryType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.workDate)}
                        {entry.project
                          ? ` · ${entry.project.code} ${entry.project.name}`
                          : ""}
                        {entry.description ? ` · ${entry.description}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ListCard>
        </TabsContent>

        <TabsContent value="documents">
          <ListCard title="Documents">
            {employee.documents.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No documents"
                description="Employee documents linked to this profile will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {employee.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {doc.title}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(doc.createdAt)}
                        {doc.mimeType ? ` · ${doc.mimeType}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ListCard>
        </TabsContent>

        <TabsContent value="history">
          <ListCard
            title="History"
            description="Audit trail for this employee record"
          >
            {employee.auditLogs.length === 0 ? (
              <EmptyState
                icon={History}
                title="No history yet"
                description="Creates, updates, and deletions are recorded here."
              />
            ) : (
              <ul className="space-y-3">
                {employee.auditLogs.map((log) => (
                  <li
                    key={log.id}
                    className="border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <p className="text-sm font-medium">
                      {log.action}
                      {log.summary ? ` · ${log.summary}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt, "MMM d, yyyy p")} ·{" "}
                      {formatRelative(log.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </ListCard>
        </TabsContent>

        <TabsContent value="timeline">
          <ListCard
            title="Timeline"
            description="Assessments, exams, hours, certificates, and observations"
          >
            {employee.timeline.length === 0 ? (
              <EmptyState
                icon={Award}
                title="Timeline is empty"
                description="Activity across competency workflows will collect here."
              />
            ) : (
              <ol className="space-y-4">
                {employee.timeline.map((item) => (
                  <li key={item.id} className="relative pl-4">
                    <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-foreground/40" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {item.type}
                      </Badge>
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.occurredAt, "MMM d, yyyy p")}
                      {item.summary ? ` · ${item.summary}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </ListCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
