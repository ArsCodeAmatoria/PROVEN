"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  runSamplingRecommendationsAction,
  saveSamplingPlanAction,
  toggleSiteSelectedAction,
  upsertSampleSiteAction,
} from "@/features/compliance/field-actions";
import type {
  CorSampleProjectType,
  CorSampleRiskLevel,
  SamplingPlanView,
} from "@/services/cor-field.service";

const PROJECT_TYPES: CorSampleProjectType[] = [
  "TOWER_CRANE",
  "MOBILE_CRANE",
  "CIVIL",
  "INDUSTRIAL",
  "COMMERCIAL",
  "RESIDENTIAL",
  "FABRICATION_SHOP",
  "YARD",
  "MAINTENANCE",
  "WAREHOUSE",
  "OFFICE",
];

const RISK_LEVELS: CorSampleRiskLevel[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

export function SiteSamplingPanel({
  plan,
  canManage,
}: {
  plan: SamplingPlanView | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState(plan?.companyName ?? "");
  const [auditYear, setAuditYear] = useState(
    String(plan?.auditYear ?? new Date().getFullYear()),
  );
  const [employeeCount, setEmployeeCount] = useState(
    String(plan?.employeeCount ?? 0),
  );
  const [activeSiteCount, setActiveSiteCount] = useState(
    String(plan?.activeSiteCount ?? plan?.sites.length ?? 0),
  );
  const [notes, setNotes] = useState(plan?.notes ?? "");

  const [siteName, setSiteName] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [address, setAddress] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [projectType, setProjectType] =
    useState<CorSampleProjectType>("COMMERCIAL");
  const [workerCount, setWorkerCount] = useState("0");
  const [riskLevel, setRiskLevel] = useState<CorSampleRiskLevel>("MEDIUM");

  const sites = plan?.sites ?? [];
  const selectedCount = sites.filter((s) => s.selectedForAudit).length;

  function savePlan() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveSamplingPlanAction({
        companyName,
        auditYear: Number(auditYear) || new Date().getFullYear(),
        employeeCount: Number(employeeCount) || 0,
        activeSiteCount: Number(activeSiteCount) || 0,
        notes: notes || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Sampling plan saved.");
      router.refresh();
    });
  }

  function addSite() {
    if (!plan?.id) {
      setError("Save the sampling plan first.");
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await upsertSampleSiteAction({
        planId: plan.id,
        siteName,
        projectNumber: projectNumber || null,
        address: address || null,
        supervisorName: supervisorName || null,
        projectType,
        workerCount: Number(workerCount) || 0,
        riskLevel,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSiteName("");
      setProjectNumber("");
      setAddress("");
      setSupervisorName("");
      setWorkerCount("0");
      setMessage("Site added.");
      router.refresh();
    });
  }

  function toggleSelected(siteId: string, selected: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleSiteSelectedAction({ siteId, selected });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function recommend() {
    if (!plan?.id) {
      setError("Save the sampling plan first.");
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await runSamplingRecommendationsAction(plan.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Recommended sample updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sampling plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="companyName">Company</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auditYear">Audit year</Label>
              <Input
                id="auditYear"
                type="number"
                value={auditYear}
                onChange={(e) => setAuditYear(e.target.value)}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employeeCount">Employees</Label>
              <Input
                id="employeeCount"
                type="number"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activeSiteCount">Active sites</Label>
              <Input
                id="activeSiteCount"
                type="number"
                value={activeSiteCount}
                onChange={(e) => setActiveSiteCount(e.target.value)}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                disabled={!canManage}
              />
            </div>
          </div>
          {canManage ? (
            <Button type="button" disabled={pending} onClick={savePlan}>
              Save plan
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Sites</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedCount} selected for audit
              {plan ? ` · ${sites.length} listed` : ""}
            </p>
          </div>
          {canManage && plan ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending || sites.length === 0}
              onClick={recommend}
            >
              Recommend sample
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && plan ? (
            <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="siteName">Site name</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Project / worksite"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="projectNumber">Project #</Label>
                <Input
                  id="projectNumber"
                  value={projectNumber}
                  onChange={(e) => setProjectNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Project type</Label>
                <Select
                  value={projectType}
                  onValueChange={(v) =>
                    setProjectType(v as CorSampleProjectType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {labelize(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supervisorName">Supervisor</Label>
                <Input
                  id="supervisorName"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workerCount">Workers</Label>
                <Input
                  id="workerCount"
                  type="number"
                  value={workerCount}
                  onChange={(e) => setWorkerCount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Risk</Label>
                <Select
                  value={riskLevel}
                  onValueChange={(v) => setRiskLevel(v as CorSampleRiskLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || !siteName.trim()}
                  onClick={addSite}
                >
                  Add site
                </Button>
              </div>
            </div>
          ) : null}

          {sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sites yet. Add active worksites, then run Recommend sample.
            </p>
          ) : (
            <ul className="space-y-2">
              {sites.map((site) => (
                <li
                  key={site.id}
                  className="flex flex-wrap items-start gap-3 rounded-md border px-3 py-3"
                >
                  <label className="mt-1 flex items-center gap-2">
                    <Checkbox
                      checked={site.selectedForAudit}
                      disabled={!canManage || pending}
                      onCheckedChange={(checked) =>
                        toggleSelected(site.id, checked === true)
                      }
                    />
                    <span className="sr-only">Select {site.siteName}</span>
                  </label>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{site.siteName}</p>
                    <p className="text-sm text-muted-foreground">
                      {labelize(site.projectType)}
                      {site.supervisorName
                        ? ` · ${site.supervisorName}`
                        : ""}
                      {site.workerCount > 0
                        ? ` · ${site.workerCount} workers`
                        : ""}
                      {site.address ? ` · ${site.address}` : ""}
                    </p>
                    {site.recommendationReason ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {site.recommendationReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        site.riskLevel === "HIGH" ||
                        site.riskLevel === "CRITICAL"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {site.riskLevel}
                    </Badge>
                    {site.recommended ? (
                      <Badge variant="outline">Recommended</Badge>
                    ) : null}
                    {site.selectedForAudit ? (
                      <Badge variant="default">Selected</Badge>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
