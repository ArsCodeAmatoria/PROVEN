"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
import { Textarea } from "@/components/ui/textarea";
import { createObservationAction } from "@/features/compliance/field-actions";
import { cn } from "@/lib/utils";
import type {
  CorObservationCategory,
  CorObservationResult,
  CorSampleRiskLevel,
  ObservationListItem,
} from "@/services/cor-field.service";

const CATEGORIES: CorObservationCategory[] = [
  "HOUSEKEEPING",
  "PPE",
  "RIGGING",
  "EQUIPMENT",
  "MOBILE_EQUIPMENT",
  "TOWER_CRANE",
  "FALL_PROTECTION",
  "TRAFFIC_CONTROL",
  "EXCAVATION",
  "CONFINED_SPACE",
  "ELECTRICAL",
  "LADDERS",
  "SCAFFOLDING",
  "MATERIAL_STORAGE",
  "ENVIRONMENTAL",
];

const RESULTS: { value: CorObservationResult; label: string }[] = [
  { value: "PASS", label: "Pass" },
  { value: "FAIL", label: "Fail" },
  { value: "NA", label: "N/A" },
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

export function ObservationForm({
  observations,
  sessions,
  canManage,
}: {
  observations: ObservationListItem[];
  sessions: { id: string; title: string; status: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const [category, setCategory] =
    useState<CorObservationCategory>("HOUSEKEEPING");
  const [result, setResult] = useState<CorObservationResult>("PASS");
  const [riskLevel, setRiskLevel] = useState<CorSampleRiskLevel | "NONE">(
    "MEDIUM",
  );
  const [locationLabel, setLocationLabel] = useState("");
  const [notes, setNotes] = useState("");

  function submit() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await createObservationAction({
        sessionId: sessionId || null,
        category,
        result,
        notes,
        riskLevel: riskLevel === "NONE" ? null : riskLevel,
        locationLabel: locationLabel || null,
      });
      if (response.error) {
        setError(response.error);
        return;
      }
      setNotes("");
      setLocationLabel("");
      setMessage(
        result === "FAIL"
          ? "Observation saved and CAPA opened for Fail result."
          : "Observation saved.",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log worksite observation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Start an internal audit session before logging COR worksite
                observations.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Audit session</Label>
                    <Select value={sessionId} onValueChange={setSessionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {session.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select
                      value={category}
                      onValueChange={(v) =>
                        setCategory(v as CorObservationCategory)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {labelize(item)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Risk</Label>
                    <Select
                      value={riskLevel}
                      onValueChange={(v) =>
                        setRiskLevel(v as CorSampleRiskLevel | "NONE")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        {RISK_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Result</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {RESULTS.map((opt) => {
                        const active = result === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={pending}
                            onClick={() => setResult(opt.value)}
                            className={cn(
                              "min-h-12 rounded-md border px-2 py-2 text-sm font-medium transition-colors",
                              active
                                ? opt.value === "FAIL"
                                  ? "border-destructive bg-destructive text-destructive-foreground"
                                  : "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:bg-muted",
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="locationLabel">Location</Label>
                    <Input
                      id="locationLabel"
                      value={locationLabel}
                      onChange={(e) => setLocationLabel(e.target.value)}
                      placeholder="Building / area / equipment"
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="What was observed on site"
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={pending || !notes.trim() || !sessionId}
                  onClick={submit}
                >
                  Save observation
                </Button>
              </>
            )}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? (
              <p className="text-sm text-muted-foreground">{message}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <ul className="space-y-2">
        {observations.length === 0 ? (
          <li className="rounded-md border px-3 py-6 text-sm text-muted-foreground">
            No worksite observations logged yet.
          </li>
        ) : (
          observations.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-md border px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{labelize(item.category)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.locationLabel ? `${item.locationLabel} · ` : ""}
                  {item.observedAt
                    ? String(item.observedAt).slice(0, 10)
                    : "No date"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={item.result === "FAIL" ? "destructive" : "secondary"}
                >
                  {item.result}
                </Badge>
                {item.riskLevel ? (
                  <Badge variant="outline">{item.riskLevel}</Badge>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
