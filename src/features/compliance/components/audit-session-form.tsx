"use client";

import { ChevronLeft, ChevronRight, List, Focus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveAuditQuestionResponseAction } from "@/features/compliance/actions";
import { CorEvidencePanel } from "@/features/compliance/components/cor-evidence-panel";
import { cn } from "@/lib/utils";
import type { AuditQuestionView } from "@/services/compliance.service";
import type { AuditProgressView } from "@/services/cor-workflow.service";

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not started", short: "Open" },
  { value: "IN_PROGRESS", label: "In progress", short: "WIP" },
  { value: "ADEQUATE", label: "Adequate", short: "OK" },
  {
    value: "NEEDS_IMPROVEMENT",
    label: "Partial / missing evidence",
    short: "Partial",
  },
  { value: "FAIL", label: "Inadequate", short: "Fail" },
  { value: "NOT_APPLICABLE", label: "Not applicable", short: "N/A" },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];

export function AuditProgressBar({ progress }: { progress: AuditProgressView }) {
  const pct =
    progress.totalQuestions > 0
      ? Math.round((progress.answered / progress.totalQuestions) * 100)
      : 0;

  return (
    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
      <div>
        <p className="text-xs text-muted-foreground">Questions completed</p>
        <p className="text-lg font-semibold">
          {progress.answered}/{progress.totalQuestions}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({pct}%)
          </span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
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
  const [mode, setMode] = useState<"focus" | "list">("focus");
  const [index, setIndex] = useState(0);

  const didJump = useRef(false);
  useEffect(() => {
    if (didJump.current) return;
    const firstOpen = questions.findIndex((q) => q.status === "NOT_STARTED");
    if (firstOpen >= 0) setIndex(firstOpen);
    didJump.current = true;
  }, [questions]);

  const byElement = useMemo(() => {
    const map = new Map<string, AuditQuestionView[]>();
    for (const q of questions) {
      const key = `${q.elementSortOrder}|${q.elementCode}|${q.elementTitle}`;
      const list = map.get(key) ?? [];
      list.push(q);
      map.set(key, list);
    }
    return map;
  }, [questions]);

  const current = questions[index] ?? null;
  const canPrev = index > 0;
  const canNext = index < questions.length - 1;

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={mode === "focus" ? "secondary" : "ghost"}
              className="h-11 gap-1.5 px-3"
              onClick={() => setMode("focus")}
            >
              <Focus className="h-4 w-4" />
              Field
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "list" ? "secondary" : "ghost"}
              className="h-11 gap-1.5 px-3"
              onClick={() => setMode("list")}
            >
              <List className="h-4 w-4" />
              All
            </Button>
          </div>
          {mode === "focus" && current ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {index + 1}
              </span>{" "}
              of {questions.length}
              <span className="hidden sm:inline">
                {" "}
                · Element {current.elementCode}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {questions.length} questions
            </p>
          )}
        </div>
      </div>

      {mode === "focus" && current ? (
        <>
          <QuestionCard
            key={current.questionId}
            sessionId={sessionId}
            question={current}
            canManage={canManage}
            defaultExpanded
            showElement
          />
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:mt-4 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <div className="mx-auto flex max-w-5xl items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 sm:flex-none"
                disabled={!canPrev}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 sm:flex-none"
                disabled={!canNext}
                onClick={() =>
                  setIndex((i) => Math.min(questions.length - 1, i + 1))
                }
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8">
          {[...byElement.entries()].map(([key, qs]) => {
            const [, code, title] = key.split("|");
            return (
              <section key={key} className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <h2 className="text-base font-semibold">
                    Element {code}: {title}
                  </h2>
                  <Badge variant="outline">{qs.length}</Badge>
                </div>
                <ul className="space-y-3">
                  {qs.map((q) => (
                    <li key={q.questionId}>
                      <QuestionCard
                        sessionId={sessionId}
                        question={q}
                        canManage={canManage}
                        defaultExpanded={false}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  sessionId,
  question,
  canManage,
  defaultExpanded,
  showElement = false,
}: {
  sessionId: string;
  question: AuditQuestionView;
  canManage: boolean;
  defaultExpanded: boolean;
  showElement?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [status, setStatus] = useState<StatusValue>(
    question.status as StatusValue,
  );
  const [comments, setComments] = useState(question.comments ?? "");
  const [observationNotes, setObservationNotes] = useState(
    question.observationNotes ?? "",
  );
  const [interviewNotes, setInterviewNotes] = useState(
    question.interviewNotes ?? "",
  );
  const [showEvidence, setShowEvidence] = useState(defaultExpanded);
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

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex min-h-14 w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0">
          <p className="font-medium">
            <span className="text-muted-foreground">{question.number}</span>{" "}
            <span className="line-clamp-2">{question.description}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {question.evidence.length
              ? `${question.evidence.length} evidence`
              : "No evidence"}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {status.replaceAll("_", " ")}
        </Badge>
      </button>
    );
  }

  return (
    <div className="rounded-md border p-3 sm:p-4">
      {!defaultExpanded ? (
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => setExpanded(false)}
          >
            Collapse
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {showElement ? (
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Element {question.elementCode}: {question.elementTitle}
            </p>
          ) : null}
          <p className="text-base font-medium leading-snug sm:text-[1.05rem]">
            <span className="text-muted-foreground">{question.number}</span>{" "}
            {question.description}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Max {question.weight} pts
            {question.requiresDocumentation ? " · Documentation" : ""}
            {question.requiresObservation ? " · Observation" : ""}
            {question.requiresInterview ? " · Interview" : ""}
          </p>
        </div>
        <Badge variant="secondary">{status.replaceAll("_", " ")}</Badge>
      </div>

      <div className="mt-4 space-y-2">
        <Label>Result</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={!canManage}
                onClick={() => setStatus(opt.value)}
                className={cn(
                  "min-h-11 rounded-md border px-2 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                  !canManage && "opacity-60",
                )}
                title={opt.label}
              >
                <span className="sm:hidden">{opt.short}</span>
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor={`comments-${question.questionId}`}>
          Auditor comments
        </Label>
        <Textarea
          id={`comments-${question.questionId}`}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          placeholder="Documentation narrative for BCCSA Excel"
          disabled={!canManage}
          className="min-h-20 text-base sm:text-sm"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`obs-${question.questionId}`}>Observation notes</Label>
          <Textarea
            id={`obs-${question.questionId}`}
            value={observationNotes}
            onChange={(e) => setObservationNotes(e.target.value)}
            rows={2}
            placeholder="Site / practice observations"
            disabled={!canManage}
            className="text-base sm:text-sm"
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
            className="text-base sm:text-sm"
          />
        </div>
      </div>

      {canManage ? (
        <Button
          type="button"
          className="mt-4 h-11 w-full sm:w-auto"
          onClick={onSave}
          disabled={pending}
        >
          {pending ? "Saving…" : "Save response"}
        </Button>
      ) : null}

      {message ? (
        <p
          className={cn(
            "mt-2 text-sm",
            message.startsWith("Saved")
              ? "text-muted-foreground"
              : "text-destructive",
          )}
        >
          {message}
        </p>
      ) : null}

      <div className="mt-4 border-t pt-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-between sm:w-auto"
          onClick={() => setShowEvidence((v) => !v)}
        >
          Evidence
          <Badge variant="secondary">
            {question.evidence.length}
          </Badge>
        </Button>
        {showEvidence ? (
          <div className="mt-3 space-y-4">
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
        ) : null}
      </div>
    </div>
  );
}
