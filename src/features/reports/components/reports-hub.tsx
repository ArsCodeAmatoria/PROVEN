"use client";

import { FileDown, FileText } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REPORT_TYPE_META } from "@/features/reports/constants";
import type { ReportType } from "@/lib/validations/report";
import type { ReportOptionLists } from "@/services/reports.service";
import { cn } from "@/lib/utils";

interface ReportsHubProps {
  options: ReportOptionLists | null;
  error: string | null;
}

export function ReportsHub({ options, error }: ReportsHubProps) {
  const [type, setType] = useState<ReportType>("worker_competency_profile");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [observationId, setObservationId] = useState<string>("");
  const [supervisorId, setSupervisorId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [includePhotos, setIncludePhotos] = useState(true);

  const meta = useMemo(
    () => REPORT_TYPE_META.find((item) => item.type === type)!,
    [type],
  );

  const canGenerate = useMemo(() => {
    if (!meta.requires) return true;
    if (meta.requires === "employeeId") return Boolean(employeeId);
    if (meta.requires === "assessmentId") return Boolean(assessmentId);
    if (meta.requires === "observationId") return Boolean(observationId);
    if (meta.requires === "supervisorId") return Boolean(supervisorId);
    if (meta.requires === "projectId") return Boolean(projectId);
    return false;
  }, [
    meta.requires,
    employeeId,
    assessmentId,
    observationId,
    supervisorId,
    projectId,
  ]);

  function downloadUrl() {
    const params = new URLSearchParams({
      type,
      includePhotos: String(includePhotos),
    });
    if (employeeId) params.set("employeeId", employeeId);
    if (assessmentId) params.set("assessmentId", assessmentId);
    if (observationId) params.set("observationId", observationId);
    if (supervisorId) params.set("supervisorId", supervisorId);
    if (projectId) params.set("projectId", projectId);
    return `/api/reports/generate?${params.toString()}`;
  }

  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load reports</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="shadow-none h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report types</CardTitle>
          <CardDescription>Select a professional PDF report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {REPORT_TYPE_META.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => setType(item.type)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                type === item.type
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {item.title}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-md border p-2">
              <FileText className="size-5" />
            </div>
            <div>
              <CardTitle>{meta.title}</CardTitle>
              <CardDescription className="mt-1">
                {meta.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {meta.requires === "employeeId" ? (
            <ParamSelect
              label="Worker"
              value={employeeId}
              onChange={setEmployeeId}
              items={options?.employees ?? []}
            />
          ) : null}
          {meta.requires === "assessmentId" ? (
            <ParamSelect
              label="Assessment"
              value={assessmentId}
              onChange={setAssessmentId}
              items={options?.assessments ?? []}
            />
          ) : null}
          {meta.requires === "observationId" ? (
            <ParamSelect
              label="Observation"
              value={observationId}
              onChange={setObservationId}
              items={options?.observations ?? []}
            />
          ) : null}
          {meta.requires === "supervisorId" ? (
            <ParamSelect
              label="Supervisor"
              value={supervisorId}
              onChange={setSupervisorId}
              items={options?.supervisors ?? []}
            />
          ) : null}
          {meta.requires === "projectId" ? (
            <ParamSelect
              label="Project"
              value={projectId}
              onChange={setProjectId}
              items={options?.projects ?? []}
            />
          ) : null}

          <div className="flex items-center gap-2">
            <Checkbox
              id="includePhotos"
              checked={includePhotos}
              onCheckedChange={(checked) => setIncludePhotos(checked === true)}
            />
            <Label htmlFor="includePhotos" className="text-sm font-normal">
              Include photo evidence when available
            </Label>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Reports include company logo (when configured), worker photo,
            assessment history, competency trends, and digital signatures where
            applicable.
          </div>

          {canGenerate ? (
            <Button asChild>
              <a href={downloadUrl()}>
                <FileDown className="size-4" />
                Generate PDF
              </a>
            </Button>
          ) : (
            <Button disabled>
              <FileDown className="size-4" />
              Generate PDF
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ParamSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { id: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
