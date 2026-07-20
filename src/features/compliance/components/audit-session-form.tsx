"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveAuditQuestionResponseAction } from "@/features/compliance/actions";
import { CorEvidencePanel } from "@/features/compliance/components/cor-evidence-panel";
import type { AuditQuestionView } from "@/services/compliance.service";
import type { AuditProgressView } from "@/services/cor-workflow.service";

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "ADEQUATE", label: "Adequate" },
  { value: "NEEDS_IMPROVEMENT", label: "Partial / missing evidence" },
  { value: "FAIL", label: "Inadequate" },
  { value: "NOT_APPLICABLE", label: "Not applicable" },
] as const;

export function AuditProgressBar({ progress }: { progress: AuditProgressView }) {
  const pct =
    progress.totalQuestions > 0
      ? Math.round((progress.answered / progress.totalQuestions) * 100)
      : 0;

  return (
    <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-muted-foreground">Questions completed</p>
        <p className="text-lg font-semibold">
          {progress.answered}/{progress.totalQuestions}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({pct}%)
          </span>
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Score / estimated</p>
        <p className="text-lg font-semibold">
          {progress.overallScore == null
            ? "—"
            : `${Math.round(progress.overallScore)}%`}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            /{" "}
            {progress.predictedScore == null
              ? "—"
              : `${Math.round(progress.predictedScore)}%`}
          </span>
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Evidence / missing</p>
        <p className="text-lg font-semibold">
          {progress.evidenceCount}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            · {progress.missingEvidence} gaps
          </span>
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Open findings</p>
        <p className="text-lg font-semibold">{progress.openFindings}</p>
        {progress.freezeLabel ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            Freeze: {progress.freezeDocumentCount} docs
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AuditSessionForm({
  sessionId,
  questions,
  canManage,
}: {
  sessionId: string;
  questions: AuditQuestionView[];
  canManage: boolean;
}) {
  const byElement = new Map<string, AuditQuestionView[]>();
  for (const q of questions) {
    const key = `${q.elementSortOrder}|${q.elementCode}|${q.elementTitle}`;
    const list = byElement.get(key) ?? [];
    list.push(q);
    byElement.set(key, list);
  }

  return (
    <div className="space-y-8">
      {[...byElement.entries()].map(([key, qs]) => {
        const [, code, title] = key.split("|");
        return (
          <section key={key} className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <h2 className="text-base font-semibold">
                Element {code}: {title}
              </h2>
              <Badge variant="outline">{qs.length} questions</Badge>
            </div>
            <ul className="space-y-4">
              {qs.map((q) => (
                <QuestionRow
                  key={q.questionId}
                  sessionId={sessionId}
                  question={q}
                  canManage={canManage}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function QuestionRow({
  sessionId,
  question,
  canManage,
}: {
  sessionId: string;
  question: AuditQuestionView;
  canManage: boolean;
}) {
  const [status, setStatus] = useState(question.status);
  const [comments, setComments] = useState(question.comments ?? "");
  const [observationNotes, setObservationNotes] = useState(
    question.observationNotes ?? "",
  );
  const [interviewNotes, setInterviewNotes] = useState(
    question.interviewNotes ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveAuditQuestionResponseAction({
        sessionId,
        questionId: question.questionId,
        status,
        comments,
        observationNotes,
        interviewNotes,
      });
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        status === "FAIL" || status === "NEEDS_IMPROVEMENT"
          ? "Saved — finding & corrective action opened"
          : "Saved",
      );
    });
  }

  const docEvidence = question.evidence.filter(
    (e) => !e.kind || e.kind === "DOCUMENTATION",
  );
  const obsEvidence = question.evidence.filter((e) => e.kind === "OBSERVATION");
  const intEvidence = question.evidence.filter((e) => e.kind === "INTERVIEW");

  return (
    <li className="rounded-md border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            <span className="text-muted-foreground">{question.number}</span>{" "}
            {question.description}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Max {question.weight} pts
            {question.requiresDocumentation ? " · Documentation" : ""}
            {question.requiresObservation ? " · Observation" : ""}
            {question.requiresInterview ? " · Interview" : ""}
            {question.evidence.length
              ? ` · ${question.evidence.length} evidence`
              : ""}
          </p>
        </div>
        <Badge variant="secondary">{status.replaceAll("_", " ")}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor={`status-${question.questionId}`}>Result</Label>
          <Select
            value={status}
            onValueChange={setStatus}
            disabled={!canManage}
          >
            <SelectTrigger id={`status-${question.questionId}`}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`comments-${question.questionId}`}>
            Auditor comments / documentation notes
          </Label>
          <Textarea
            id={`comments-${question.questionId}`}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            placeholder="Documentation narrative for BCCSA Excel"
            disabled={!canManage}
          />
        </div>
        {canManage ? (
          <Button type="button" onClick={onSave} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`obs-${question.questionId}`}>Observation notes</Label>
          <Textarea
            id={`obs-${question.questionId}`}
            value={observationNotes}
            onChange={(e) => setObservationNotes(e.target.value)}
            rows={2}
            placeholder="Site / practice observations"
            disabled={!canManage}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`int-${question.questionId}`}>Interview notes</Label>
          <Textarea
            id={`int-${question.questionId}`}
            value={interviewNotes}
            onChange={(e) => setInterviewNotes(e.target.value)}
            rows={2}
            placeholder="Worker / supervisor interview notes"
            disabled={!canManage}
          />
        </div>
      </div>

      {message ? (
        <p
          className={`mt-2 text-sm ${
            message.startsWith("Saved")
              ? "text-muted-foreground"
              : "text-destructive"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="mt-2 space-y-4">
        <CorEvidencePanel
          sessionId={sessionId}
          questionId={question.questionId}
          evidence={docEvidence}
          canManage={canManage}
          title="Documentation evidence"
          evidenceKind="DOCUMENTATION"
        />
        <CorEvidencePanel
          sessionId={sessionId}
          questionId={question.questionId}
          evidence={obsEvidence}
          canManage={canManage}
          title="Observation evidence"
          evidenceKind="OBSERVATION"
        />
        <CorEvidencePanel
          sessionId={sessionId}
          questionId={question.questionId}
          evidence={intEvidence}
          canManage={canManage}
          title="Interview evidence"
          evidenceKind="INTERVIEW"
        />
      </div>
    </li>
  );
}
