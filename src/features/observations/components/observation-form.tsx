"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
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
import { createObservationAction } from "@/features/observations/actions";
import {
  OBSERVATION_FOLLOW_UP_LABELS,
  OBSERVATION_TYPE_LABELS,
} from "@/features/observations/constants";
import type { ObservationEngineOptions } from "@/services/observations.service";

interface ObservationFormProps {
  options: ObservationEngineOptions;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function ObservationForm({ options }: ObservationFormProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [competencyId, setCompetencyId] = useState("");
  const [observationType, setObservationType] = useState("");
  const [location, setLocation] = useState("");
  const [context, setContext] = useState("");
  const [comments, setComments] = useState("");
  const [correctiveActions, setCorrectiveActions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState("NONE");
  const [observedDate, setObservedDate] = useState(todayDate());
  const [observedTime, setObservedTime] = useState(nowTime());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const competencies = useMemo(() => {
    if (!categoryId) return options.competencies;
    const childIds = new Set(
      options.categories
        .filter((category) => category.parentId === categoryId)
        .map((category) => category.id),
    );
    return options.competencies.filter(
      (competency) =>
        competency.categoryId === categoryId ||
        (competency.categoryId
          ? childIds.has(competency.categoryId)
          : false),
    );
  }, [categoryId, options.categories, options.competencies]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createObservationAction({
        employeeId,
        projectId,
        categoryId: categoryId || undefined,
        competencyId: competencyId || undefined,
        observationType,
        location,
        context,
        comments,
        correctiveActions,
        dueDate: dueDate || undefined,
        followUpStatus,
        observedDate,
        observedTime,
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Worker</Label>
          <Select value={employeeId || undefined} onValueChange={setEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select worker" />
            </SelectTrigger>
            <SelectContent>
              {options.employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={projectId || undefined} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {options.projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="observedDate">Date</Label>
          <Input
            id="observedDate"
            type="date"
            value={observedDate}
            onChange={(event) => setObservedDate(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="observedTime">Time</Label>
          <Input
            id="observedTime"
            type="time"
            value={observedTime}
            onChange={(event) => setObservedTime(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Site area, elevation, or map reference"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={categoryId || "none"}
            onValueChange={(value) => {
              setCategoryId(value === "none" ? "" : value);
              setCompetencyId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {options.categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.parentId ? `— ${category.label}` : category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Competency</Label>
          <Select
            value={competencyId || "none"}
            onValueChange={(value) =>
              setCompetencyId(value === "none" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select competency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No competency</SelectItem>
              {competencies.map((competency) => (
                <SelectItem key={competency.id} value={competency.id}>
                  {competency.code} · {competency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Observation type</Label>
          <Select
            value={observationType || undefined}
            onValueChange={setObservationType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OBSERVATION_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="context">Observation summary</Label>
        <Input
          id="context"
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder="Short title for this field observation"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Comments</Label>
        <Textarea
          id="comments"
          rows={4}
          value={comments}
          onChange={(event) => setComments(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="correctiveActions">Corrective actions</Label>
        <Textarea
          id="correctiveActions"
          rows={3}
          value={correctiveActions}
          onChange={(event) => setCorrectiveActions(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Follow-up status</Label>
          <Select value={followUpStatus} onValueChange={setFollowUpStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OBSERVATION_FOLLOW_UP_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        This observation becomes part of the worker&apos;s permanent competency
        history. Photos and videos can be added after saving.
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Record observation"}
      </Button>
    </form>
  );
}
