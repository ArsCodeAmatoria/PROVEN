"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeInterviewAction,
  saveInterviewResponsesAction,
} from "@/features/compliance/field-actions";
import { cn } from "@/lib/utils";
import type {
  CorInterviewAnswer,
  InterviewDetailView,
} from "@/services/cor-field.service";

const ANSWER_OPTIONS: {
  value: CorInterviewAnswer;
  label: string;
  short: string;
}[] = [
  { value: "PASS", label: "Pass", short: "P" },
  { value: "FAIL", label: "Fail", short: "F" },
  { value: "NA", label: "N/A", short: "NA" },
];

export function InterviewForm({
  interview,
  canManage,
}: {
  interview: InterviewDetailView;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState(interview.subjectName ?? "");
  const [summary, setSummary] = useState(interview.summary ?? "");
  const [signatureDataUrl, setSignatureDataUrl] = useState(
    interview.signatureDataUrl ?? "",
  );
  const [answers, setAnswers] = useState<
    Record<string, { answer: CorInterviewAnswer; comments: string }>
  >(() =>
    Object.fromEntries(
      interview.responses.map((r) => [
        r.id,
        { answer: r.answer, comments: r.comments ?? "" },
      ]),
    ),
  );

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { title: string; items: typeof interview.responses }
    >();
    for (const response of interview.responses) {
      const key = response.elementCode;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(response);
      } else {
        map.set(key, {
          title: response.elementTitle,
          items: [response],
        });
      }
    }
    return [...map.entries()];
  }, [interview]);

  const readOnly = !canManage || interview.status === "COMPLETED";

  function setAnswer(id: string, answer: CorInterviewAnswer) {
    setAnswers((prev) => ({
      ...prev,
      [id]: { answer, comments: prev[id]?.comments ?? "" },
    }));
  }

  function setComments(id: string, comments: string) {
    setAnswers((prev) => ({
      ...prev,
      [id]: {
        answer: prev[id]?.answer ?? "NOT_ASKED",
        comments,
      },
    }));
  }

  function save(complete = false) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const payload = {
        interviewId: interview.id,
        subjectName: subjectName || null,
        summary: summary || null,
        signatureDataUrl: signatureDataUrl || null,
        responses: Object.entries(answers).map(([id, value]) => ({
          id,
          answer: value.answer,
          comments: value.comments || null,
          isRedFlag: value.answer === "FAIL",
        })),
      };

      const saveResult = await saveInterviewResponsesAction(payload);
      if (saveResult.error) {
        setError(saveResult.error);
        return;
      }

      if (!complete) {
        setMessage("Interview saved.");
        router.refresh();
        return;
      }

      const done = await completeInterviewAction({
        interviewId: interview.id,
        summary: summary || null,
        signatureDataUrl: signatureDataUrl || null,
      });
      if (done.error) {
        setError(done.error);
        return;
      }
      setMessage(
        done.capaCreated
          ? `Interview completed. ${done.capaCreated} CAPA(s) opened from Fail answers.`
          : "Interview completed.",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{interview.type}</Badge>
        <Badge variant="outline">{interview.status}</Badge>
        {interview.compliancePct != null ? (
          <Badge variant="outline">
            {Math.round(interview.compliancePct)}% pass
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="subjectName">Subject</Label>
          <Input
            id="subjectName"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            disabled={readOnly}
            className="text-base sm:text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Site / trade</Label>
          <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            {[interview.siteLabel, interview.trade].filter(Boolean).join(" · ") ||
              "—"}
          </p>
        </div>
      </div>

      {grouped.map(([elementCode, group]) => (
        <section key={elementCode} className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            Element {elementCode} — {group.title}
          </h2>
          <ul className="space-y-3">
            {group.items.map((response) => {
              const state = answers[response.id] ?? {
                answer: response.answer,
                comments: response.comments ?? "",
              };
              return (
                <li
                  key={response.id}
                  className="rounded-md border px-3 py-3 sm:px-4"
                >
                  <p className="text-base font-medium leading-snug sm:text-sm">
                    {response.prompt}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {ANSWER_OPTIONS.map((opt) => {
                      const active = state.answer === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={readOnly || pending}
                          onClick={() => setAnswer(response.id, opt.value)}
                          className={cn(
                            "min-h-12 rounded-md border px-2 py-2 text-sm font-medium transition-colors",
                            active
                              ? opt.value === "FAIL"
                                ? "border-destructive bg-destructive text-destructive-foreground"
                                : "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:bg-muted",
                            (readOnly || pending) && "opacity-60",
                          )}
                        >
                          <span className="sm:hidden">{opt.short}</span>
                          <span className="hidden sm:inline">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label htmlFor={`c-${response.id}`}>Comments</Label>
                    <Textarea
                      id={`c-${response.id}`}
                      value={state.comments}
                      onChange={(e) =>
                        setComments(response.id, e.target.value)
                      }
                      rows={2}
                      disabled={readOnly}
                      className="text-base sm:text-sm"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="space-y-3 rounded-md border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="summary">Interview summary</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            disabled={readOnly}
            className="text-base sm:text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signature">Signature (optional data URL / notes)</Label>
          <Textarea
            id="signature"
            value={signatureDataUrl}
            onChange={(e) => setSignatureDataUrl(e.target.value)}
            rows={2}
            placeholder="Paste signature data URL or type acknowledgement"
            disabled={readOnly}
            className="text-base sm:text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!readOnly ? (
          <>
            <Button
              type="button"
              disabled={pending}
              onClick={() => save(false)}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => save(true)}
            >
              Complete interview
            </Button>
          </>
        ) : null}
        <Button asChild variant="ghost">
          <Link href="/compliance/interviews">Back</Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
