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
import { createAssessmentAction } from "@/features/assessments/actions";
import {
  ASSESSMENT_RATING_LABELS,
  ASSESSMENT_TYPE_LABELS,
  ASSESSMENT_WIZARD_STEPS,
} from "@/features/assessments/constants";
import type { AssessmentEngineOptions } from "@/services/assessments.service";

interface AssessmentWizardProps {
  options: AssessmentEngineOptions;
  defaultInstructorName?: string;
}

export function AssessmentWizard({
  options,
  defaultInstructorName = "",
}: AssessmentWizardProps) {
  const [step, setStep] = useState(0);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [competencyId, setCompetencyId] = useState<string>("");
  const [type, setType] = useState<string>("PRACTICAL");
  const [rating, setRating] = useState<string>("");
  const [comments, setComments] = useState("");
  const [instructorNotes, setInstructorNotes] = useState("");
  const [apprenticeComments, setApprenticeComments] = useState("");
  const [instructorSignatureName, setInstructorSignatureName] = useState(
    defaultInstructorName,
  );
  const [apprenticeSignatureName, setApprenticeSignatureName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const projects = useMemo(() => {
    if (!employeeId) return [];
    const matched = options.projects.filter(
      (project) => !project.employeeId || project.employeeId === employeeId,
    );
    // Deduplicate project ids for shared assignments.
    const seen = new Set<string>();
    return matched.filter((project) => {
      if (seen.has(project.id)) return false;
      seen.add(project.id);
      return true;
    });
  }, [employeeId, options.projects]);

  const categories = options.categories;

  const competencies = useMemo(() => {
    if (!categoryId) return options.competencies;
    const childIds = new Set(
      categories
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
  }, [categoryId, categories, options.competencies]);

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
      const result = await createAssessmentAction({
        employeeId,
        projectId,
        categoryId: categoryId || undefined,
        competencyId,
        type,
        rating,
        comments,
        instructorNotes,
        apprenticeComments,
        instructorSignatureName,
        apprenticeSignatureName: apprenticeSignatureName || undefined,
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {ASSESSMENT_WIZARD_STEPS.map((item, index) => (
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
            {index < ASSESSMENT_WIZARD_STEPS.length - 1 ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : null}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="space-y-2">
          <Label>Employee</Label>
          <Select
            value={employeeId || undefined}
            onValueChange={(value) => {
              setEmployeeId(value);
              setProjectId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
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
          <Select
            value={projectId || undefined}
            onValueChange={setProjectId}
          >
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
          {projects.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No active projects available for this employee.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-2">
          <Label>Category</Label>
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
              {categories.map((category) => (
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
          {competencies.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No competencies in this category yet.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Assessment type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSESSMENT_TYPE_LABELS).map(
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
              <Label>Rating</Label>
              <Select value={rating || undefined} onValueChange={setRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSESSMENT_RATING_LABELS).map(
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
            <Label htmlFor="apprenticeComments">Apprentice comments</Label>
            <Textarea
              id="apprenticeComments"
              rows={3}
              value={apprenticeComments}
              onChange={(event) => setApprenticeComments(event.target.value)}
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
              <Label htmlFor="apprenticeSignature">Apprentice signature</Label>
              <Input
                id="apprenticeSignature"
                value={apprenticeSignatureName}
                onChange={(event) =>
                  setApprenticeSignatureName(event.target.value)
                }
                placeholder="Optional typed full name"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            This record is stored permanently and cannot be overwritten. Photo
            and video evidence can be added after saving.
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
        {step < ASSESSMENT_WIZARD_STEPS.length - 1 ? (
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
            {pending ? "Saving…" : "Record assessment"}
          </Button>
        )}
      </div>
    </div>
  );
}
