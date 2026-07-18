"use client";

import { useRef, useState, useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  removeAvatarAction,
  updateAvatarAction,
} from "@/lib/auth/actions";
import { getInitials } from "@/utils/format";

interface AvatarUploadProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export function AvatarUpload({
  firstName,
  lastName,
  avatarUrl,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.set("avatar", file);

    startTransition(async () => {
      const result = await updateAvatarAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPreview(result.avatarUrl ?? URL.createObjectURL(file));
    });
  };

  const onRemove = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeAvatarAction();
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
      <Avatar className="h-20 w-20">
        {preview ? <AvatarImage src={preview} alt="Avatar" /> : null}
        <AvatarFallback className="text-lg">
          {getInitials(firstName, lastName)}
        </AvatarFallback>
      </Avatar>
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
    </div>
  );
}
