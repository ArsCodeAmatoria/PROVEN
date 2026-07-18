"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
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
import { createExperienceLogAction } from "@/features/experience-log/actions";
import { LIFT_TYPE_LABELS } from "@/features/experience-log/constants";
import type { ExperienceEngineOptions } from "@/services/experience-log.service";

interface ExperienceLogFormProps {
  options: ExperienceEngineOptions;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ExperienceLogForm({ options }: ExperienceLogFormProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [competencyId, setCompetencyId] = useState("");
  const [employerName, setEmployerName] = useState(options.companyName);
  const [liftType, setLiftType] = useState("NONE");
  const [taskPerformed, setTaskPerformed] = useState("");
  const [hours, setHours] = useState("");
  const [startDate, setStartDate] = useState(todayDate());
  const [endDate, setEndDate] = useState(todayDate());
  const [isApprenticeship, setIsApprenticeship] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const competencies = useMemo(() => {
    if (!categoryId) return options.competencies;
    return options.competencies.filter(
      (item) => item.categoryId === categoryId,
    );
  }, [categoryId, options.competencies]);

  const equipment = useMemo(() => {
    if (!projectId) return options.equipment;
    return options.equipment.filter(
      (item) => !item.projectId || item.projectId === projectId,
    );
  }, [options.equipment, projectId]);

  function onEmployeeChange(value: string) {
    setEmployeeId(value);
    const employee = options.employees.find((item) => item.id === value);
    if (employee?.supervisorId) {
      setSupervisorId(employee.supervisorId);
    }
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createExperienceLogAction({
        employeeId,
        projectId,
        supervisorId: supervisorId || undefined,
        equipmentId: equipmentId || undefined,
        categoryId: categoryId || undefined,
        competencyId: competencyId || undefined,
        employerName,
        liftType,
        taskPerformed,
        hours: Number(hours),
        startDate,
        endDate,
        isApprenticeship,
        notes: notes || undefined,
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Worker</Label>
          <Select value={employeeId || undefined} onValueChange={onEmployeeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select worker" />
            </SelectTrigger>
            <SelectContent>
              {options.employees.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
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
              {options.projects.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employerName">Employer</Label>
          <Input
            id="employerName"
            value={employerName}
            onChange={(event) => setEmployerName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Supervisor</Label>
          <Select
            value={supervisorId || undefined}
            onValueChange={setSupervisorId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select supervisor" />
            </SelectTrigger>
            <SelectContent>
              {options.supervisors.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Equipment</Label>
          <Select
            value={equipmentId || undefined}
            onValueChange={setEquipmentId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional equipment" />
            </SelectTrigger>
            <SelectContent>
              {equipment.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Lift type</Label>
          <Select value={liftType} onValueChange={setLiftType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LIFT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Competency category</Label>
          <Select value={categoryId || undefined} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Optional category" />
            </SelectTrigger>
            <SelectContent>
              {options.categories.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Competency</Label>
          <Select
            value={competencyId || undefined}
            onValueChange={setCompetencyId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional competency" />
            </SelectTrigger>
            <SelectContent>
              {competencies.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hours">Hours worked</Label>
          <Input
            id="hours"
            type="number"
            min={0.25}
            step={0.25}
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="taskPerformed">Task performed</Label>
        <Input
          id="taskPerformed"
          value={taskPerformed}
          onChange={(event) => setTaskPerformed(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isApprenticeship"
          checked={isApprenticeship}
          onCheckedChange={(checked) => setIsApprenticeship(checked === true)}
        />
        <Label htmlFor="isApprenticeship" className="font-normal">
          Count toward apprenticeship hours
        </Label>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save experience log"}
      </Button>
    </form>
  );
}
