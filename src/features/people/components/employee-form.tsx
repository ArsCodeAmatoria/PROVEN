"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

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
import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/features/people/actions";
import { EMPLOYEE_STATUS_LABELS } from "@/features/people/constants";
import { ROLE_LABELS, USER_ROLES } from "@/lib/auth/permissions";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  type CreateEmployeeInput,
} from "@/lib/validations/employee";

type EmployeeFormValues = CreateEmployeeInput;

interface EmployeeFormProps {
  mode: "create" | "edit";
  employeeId?: string;
  supervisors: { id: string; label: string }[];
  defaultValues?: Partial<EmployeeFormValues>;
}

const EMPTY_VALUES: EmployeeFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  employeeNumber: "",
  title: "",
  trade: "",
  level: 1,
  department: "",
  role: "OPERATOR",
  status: "ACTIVE",
  supervisorId: undefined,
  hireDate: undefined,
  notes: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
};

export function EmployeeForm({
  mode,
  employeeId,
  supervisors,
  defaultValues,
}: EmployeeFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const schema = mode === "create" ? createEmployeeSchema : updateEmployeeSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createEmployeeAction(values)
          : await updateEmployeeAction(employeeId!, values);

      if (result?.error) {
        setError(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-medium">Identity</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName ? (
              <p className="text-xs text-destructive">
                {errors.firstName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName ? (
              <p className="text-xs text-destructive">
                {errors.lastName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              disabled={mode === "edit"}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeNumber">Employee number</Label>
            <Input id="employeeNumber" {...register("employeeNumber")} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium">Employment</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="trade">Trade</Label>
            <Input id="trade" {...register("trade")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Input
              id="level"
              type="number"
              min={1}
              max={10}
              {...register("level")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" {...register("department")} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMPLOYEE_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Supervisor</Label>
            <Controller
              control={control}
              name="supervisorId"
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No supervisor</SelectItem>
                    {supervisors.map((supervisor) => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire date</Label>
            <Input id="hireDate" type="date" {...register("hireDate")} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium">Emergency contact</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Name</Label>
            <Input
              id="emergencyContactName"
              {...register("emergencyContactName")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Phone</Label>
            <Input
              id="emergencyContactPhone"
              {...register("emergencyContactPhone")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelation">Relation</Label>
            <Input
              id="emergencyContactRelation"
              {...register("emergencyContactRelation")}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={4} {...register("notes")} />
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create employee"
              : "Save changes"}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={employeeId ? `/people/${employeeId}` : "/people"}>
            Cancel
          </Link>
        </Button>
      </div>
    </form>
  );
}
