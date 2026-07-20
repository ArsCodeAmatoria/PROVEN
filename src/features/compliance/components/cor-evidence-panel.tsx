"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, FileUp, ImagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteCorEvidenceAction,
  uploadCorEvidenceAction,
} from "@/features/compliance/actions";
import { CorAttachFromFilesDialog } from "@/features/compliance/components/cor-attach-from-files-dialog";
import type { CorEvidenceItem } from "@/services/compliance.service";
import { formatDate } from "@/utils/format";

export function CorEvidencePanel({
  sessionId,
  questionId,
  evidence,
  canManage,
  title = "Evidence",
  evidenceKind = "DOCUMENTATION",
}: {
  sessionId: string;
  questionId: string;
  evidence: CorEvidenceItem[];
  canManage: boolean;
  title?: string;
  evidenceKind?: "DOCUMENTATION" | "OBSERVATION" | "INTERVIEW";
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function upload(kind: "photo" | "document", file: File | undefined) {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", kind);
    formData.set("evidenceKind", evidenceKind);
    formData.set("title", file.name);
    startTransition(async () => {
      const result = await uploadCorEvidenceAction(
        sessionId,
        questionId,
        formData,
      );
      if (result.error) setError(result.error);
      if (cameraRef.current) cameraRef.current.value = "";
      if (photoRef.current) photoRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function onDelete(linkId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteCorEvidenceAction(sessionId, linkId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="mt-4 space-y-3 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          Photos, uploads, or company Files
        </p>
      </div>

      {evidence.length === 0 ? (
        <p className="text-sm text-muted-foreground">No evidence attached yet.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {evidence.map((item) => (
            <li
              key={item.linkId}
              className="flex items-start gap-2 rounded-md border p-2"
            >
              {item.sourceType === "PHOTO" && item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.title}
                    className="h-14 w-14 rounded object-cover"
                  />
                </a>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  {item.sourceType === "VIDEO" ? "Video" : "File"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={item.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {item.title}
                </a>
                <p className="text-xs text-muted-foreground">
                  {item.sourceType} · {formatDate(item.createdAt)}
                </p>
              </div>
              {canManage ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  disabled={pending}
                  onClick={() => onDelete(item.linkId)}
                  aria-label="Remove evidence"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <div className="flex flex-wrap gap-2">
          <Input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => upload("photo", e.target.files?.[0])}
          />
          <Input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => upload("photo", e.target.files?.[0])}
          />
          <Input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt,.csv,application/pdf,image/*"
            className="hidden"
            onChange={(e) => upload("document", e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={pending}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="mr-2 h-4 w-4" />
            Take picture
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={pending}
            onClick={() => photoRef.current?.click()}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Upload photo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Upload file
          </Button>
          <CorAttachFromFilesDialog
            sessionId={sessionId}
            questionId={questionId}
            disabled={pending}
            evidenceKind={evidenceKind}
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {pending ? (
        <p className="text-xs text-muted-foreground">Uploading…</p>
      ) : null}
    </div>
  );
}
