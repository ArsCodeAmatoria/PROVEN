"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { StatCard } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInterviewAction } from "@/features/compliance/field-actions";
import type { InterviewDashboardView } from "@/services/cor-field.service";

export function InterviewDashboard({
  data,
  canManage,
}: {
  data: InterviewDashboardView;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"WORKER" | "MANAGER">("WORKER");
  const [sessionId, setSessionId] = useState(data.sessions[0]?.id ?? "");
  const [subjectName, setSubjectName] = useState("");
  const [trade, setTrade] = useState("");
  const [siteLabel, setSiteLabel] = useState("");
  const [supervisorName, setSupervisorName] = useState("");

  function startInterview() {
    setError(null);
    startTransition(async () => {
      const result = await createInterviewAction({
        type,
        sessionId: sessionId || null,
        subjectName: subjectName || null,
        trade: trade || null,
        siteLabel: siteLabel || null,
        supervisorName: supervisorName || null,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Worker required"
          value={data.worker.required}
          description={`${data.worker.completed} completed · ${data.worker.remaining} remaining`}
        />
        <StatCard
          label="Manager required"
          value={data.manager.required}
          description={`${data.manager.completed} completed · ${data.manager.remaining} remaining`}
        />
        <StatCard
          label="Interviews logged"
          value={data.interviews.length}
          description="Worker + manager interviews for this company"
        />
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Start an internal audit first, then create worker or manager
                interviews against that session.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as "WORKER" | "MANAGER")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WORKER">Worker</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Audit session</Label>
                  <Select value={sessionId} onValueChange={setSessionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subjectName">Subject name</Label>
                  <Input
                    id="subjectName"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trade">Trade / role</Label>
                  <Input
                    id="trade"
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="siteLabel">Site</Label>
                  <Input
                    id="siteLabel"
                    value={siteLabel}
                    onChange={(e) => setSiteLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="supervisorName">Supervisor</Label>
                  <Input
                    id="supervisorName"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                  />
                </div>
                <div className="flex items-end sm:col-span-2 lg:col-span-3">
                  <Button
                    type="button"
                    disabled={pending || !sessionId}
                    onClick={startInterview}
                  >
                    Start {type === "WORKER" ? "worker" : "manager"} interview
                  </Button>
                </div>
              </div>
            )}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <ul className="space-y-2">
        {data.interviews.length === 0 ? (
          <li className="rounded-md border px-3 py-6 text-sm text-muted-foreground">
            No interviews yet.
          </li>
        ) : (
          data.interviews.map((interview) => (
            <li
              key={interview.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  <Link
                    href={`/compliance/interviews/${interview.id}`}
                    className="hover:underline"
                  >
                    {interview.subjectName || "Untitled interview"}
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  {interview.type}
                  {interview.siteLabel ? ` · ${interview.siteLabel}` : ""}
                  {interview.trade ? ` · ${interview.trade}` : ""}
                  {interview.compliancePct != null
                    ? ` · ${Math.round(interview.compliancePct)}%`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{interview.status}</Badge>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/compliance/interviews/${interview.id}`}>
                    Open
                  </Link>
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
