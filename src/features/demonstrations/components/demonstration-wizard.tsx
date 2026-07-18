"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronRight } from "lucide-react";

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
import { createDemonstrationAction } from "@/features/demonstrations/actions";
import {
  DEMONSTRATION_RATING_LABELS,
  DEMONSTRATION_WIZARD_STEPS,
} from "@/features/demonstrations/constants";
import type { AssessmentEngineOptions } from "@/services/demonstrations.service";

interface DemonstrationWizardProps {
  options: AssessmentEngineOptions;
  defaultInstructorName?: string;
}

export function DemonstrationWizard({
  options,
  defaultInstructorName = "",
}: DemonstrationWizardProps) {
  const [step, setStep] = useState(0);
  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [competencyId, setCompetencyId] = useState("");
  const [rating, setRating] = useState("");
  const [comments, setComments] = useState("");
  const [instructorNotes, setInstructorNotes] = useState("");
  const [workerComments, setWorkerComments] = useState("");
  const [instructorSignatureName, setInstructorSignatureName] = useState(
    defaultInstructorName,
  );
  const [workerSignatureName, setWorkerSignatureName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const projects = useMemo(() => {
    if (!employeeId) return [];
    const matched = options.projects.filter(
      (project) => !project.employeeId || project.employeeId === employeeId,
    );
    const seen = new Set<string>();
    return matched.filter((project) => {
      if (seen.has(project.id)) return false;
      seen.add(project.id);
      return true;
    });
  }, [employeeId, options.projects]);

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

  const selectedCompetency = options.competencies.find(
    (item) => item.id === competencyId,
  );

  const canNext = () => {
    if (step === 0) return Boolean(employeeId);
    if (step === 1) return Boolean(projectId);
    if (step === 2) return Boolean(categoryId);
    if (step === 3) return Boolean(competencyId);
    return Boolean(rating && instructorSignatureName.trim());
  };

  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createDemonstrationAction({
        employeeId,
        projectId,
        categoryId: categoryId || undefined,
        competencyId,
        rating,
        comments,
        instructorNotes,
        workerComments,
        instructorSignatureName,
        workerSignatureName: workerSignatureName || undefined,
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {DEMONSTRATION_WIZARD_STEPS.map((item, index) => (
          <li key={item.id} className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-md px-2 py-1 ${
                index === step
                  ? "bg-accent text-accent-foreground"
                  : index < step
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
              onClick={() => {
                if (index < step) setStep(index);
              }}
            >
              {index + 1}. {item.label}
            </button>
            {index < DEMONSTRATION_WIZARD_STEPS.length - 1 ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : null}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="space-y-2">
          <Label>Worker</Label>
          <Select
            value={employeeId || undefined}
            onValueChange={(value) => {
              setEmployeeId(value);
              setProjectId("");
            }}
          >
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
      ) : null}

      {step === 1 ? (
        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={projectId || undefined} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-2">
          <Label>Competency category</Label>
          <Select
            value={categoryId || undefined}
            onValueChange={(value) => {
              setCategoryId(value);
              setCompetencyId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {options.categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.parentId ? `— ${category.label}` : category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-2">
          <Label>Competency</Label>
          <Select
            value={competencyId || undefined}
            onValueChange={setCompetencyId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select competency" />
            </SelectTrigger>
            <SelectContent>
              {competencies.map((competency) => (
                <SelectItem key={competency.id} value={competency.id}>
                  {competency.code} · {competency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCompetency ? (
            <p className="text-xs text-muted-foreground">
              Evaluating {selectedCompetency.label}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <Select value={rating || undefined} onValueChange={setRating}>
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEMONSTRATION_RATING_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              rows={3}
              value={comments}
              onChange={(event) => setComments(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructorNotes">Instructor notes</Label>
            <Textarea
              id="instructorNotes"
              rows={3}
              value={instructorNotes}
              onChange={(event) => setInstructorNotes(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workerComments">Worker comments</Label>
            <Textarea
              id="workerComments"
              rows={3}
              value={workerComments}
              onChange={(event) => setWorkerComments(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instructorSignature">Instructor signature</Label>
              <Input
                id="instructorSignature"
                value={instructorSignatureName}
                onChange={(event) =>
                  setInstructorSignatureName(event.target.value)
                }
                placeholder="Typed full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workerSignature">Worker signature</Label>
              <Input
                id="workerSignature"
                value={workerSignatureName}
                onChange={(event) => setWorkerSignatureName(event.target.value)}
                placeholder="Optional typed full name"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            This demonstration is stored permanently and never overwrites prior
            evaluations. Photo and video evidence can be added after saving.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || pending}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
        >
          Back
        </Button>
        {step < DEMONSTRATION_WIZARD_STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={!canNext() || pending}
            onClick={() => setStep((value) => value + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canNext() || pending}
            onClick={onSubmit}
          >
            {pending ? "Saving…" : "Record demonstration"}
          </Button>
        )}
      </div>
    </div>
  );
}
