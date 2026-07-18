"use client";

import { useRef, useState, useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  removeEmployeePhotoAction,
  updateEmployeePhotoAction,
} from "@/features/people/actions";
import { getInitials } from "@/utils/format";

interface EmployeePhotoUploadProps {
  employeeId: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  canManage: boolean;
}

export function EmployeePhotoUpload({
  employeeId,
  firstName,
  lastName,
  photoUrl,
  canManage,
}: EmployeePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(photoUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.set("photo", file);

    startTransition(async () => {
      const result = await updateEmployeePhotoAction(employeeId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPreview(result.photoUrl ?? URL.createObjectURL(file));
    });
  };

  const onRemove = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeEmployeePhotoAction(employeeId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar className="h-24 w-24">
        {preview ? <AvatarImage src={preview} alt="Employee photo" /> : null}
        <AvatarFallback className="text-xl">
          {getInitials(firstName, lastName)}
        </AvatarFallback>
      </Avatar>
      {canManage ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              {pending ? "Uploading…" : "Upload photo"}
            </Button>
            {preview ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={onRemove}
              >
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WebP up to 2MB.
          </p>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      ) : null}
    </div>
  );
}
