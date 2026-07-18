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
import { createEquipmentQualificationAction } from "@/features/equipment-qualifications/actions";
import type { EquipmentQualificationOptions } from "@/services/equipment-qualifications.service";

interface EquipmentQualificationFormProps {
  options: EquipmentQualificationOptions;
  defaultAssessorId?: string;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function EquipmentQualificationForm({
  options,
  defaultAssessorId = "",
}: EquipmentQualificationFormProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [equipmentTypeId, setEquipmentTypeId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [assessorId, setAssessorId] = useState(defaultAssessorId);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [capacity, setCapacity] = useState("");
  const [qualifiedAt, setQualifiedAt] = useState(todayDate());
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [assessmentIds, setAssessmentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const equipment = useMemo(() => {
    if (!equipmentTypeId) return options.equipment;
    return options.equipment.filter(
      (item) => item.equipmentTypeId === equipmentTypeId,
    );
  }, [equipmentTypeId, options.equipment]);

  const assessments = useMemo(() => {
    if (!employeeId) return options.assessments;
    return options.assessments.filter(
      (item) => !item.employeeId || item.employeeId === employeeId,
    );
  }, [employeeId, options.assessments]);

  function toggleAssessment(id: string, checked: boolean) {
    setAssessmentIds((current) =>
      checked
        ? [...current, id]
        : current.filter((assessmentId) => assessmentId !== id),
    );
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createEquipmentQualificationAction({
        employeeId,
        equipmentTypeId,
        equipmentId: equipmentId || undefined,
        assessorId: assessorId || undefined,
        make,
        model,
        capacity: capacity || undefined,
        qualifiedAt,
        expiresAt: expiresAt || undefined,
        notes: notes || undefined,
        assessmentIds,
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
              {options.employees.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Equipment class</Label>
          <Select
            value={equipmentTypeId || undefined}
            onValueChange={(value) => {
              setEquipmentTypeId(value);
              setEquipmentId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {options.equipmentTypes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="make">Equipment make</Label>
          <Input
            id="make"
            value={make}
            onChange={(event) => setMake(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            placeholder="e.g. 90 ton"
          />
        </div>
        <div className="space-y-2">
          <Label>Specific asset (optional)</Label>
          <Select
            value={equipmentId || undefined}
            onValueChange={setEquipmentId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional equipment asset" />
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
          <Label htmlFor="qualifiedAt">Qualification date</Label>
          <Input
            id="qualifiedAt"
            type="date"
            value={qualifiedAt}
            onChange={(event) => setQualifiedAt(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiresAt">Expiry (optional)</Label>
          <Input
            id="expiresAt"
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Assessor</Label>
          <Select
            value={assessorId || undefined}
            onValueChange={setAssessorId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assessor" />
            </SelectTrigger>
            <SelectContent>
              {options.assessors.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Supporting assessments</Label>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
          {assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed assessments available.
            </p>
          ) : (
            assessments.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2 text-sm"
              >
                <Checkbox
                  checked={assessmentIds.includes(item.id)}
                  onCheckedChange={(checked) =>
                    toggleAssessment(item.id, checked === true)
                  }
                />
                <span>{item.label}</span>
              </label>
            ))
          )}
        </div>
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save qualification"}
      </Button>
    </form>
  );
}
