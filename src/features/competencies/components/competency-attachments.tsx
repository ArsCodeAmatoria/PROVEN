"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteCompetencyAttachmentAction,
  uploadCompetencyAttachmentAction,
} from "@/features/competencies/actions";
import type { Document } from "@/types";
import { formatDate } from "@/utils/format";

interface CompetencyAttachmentsProps {
  competencyId: string;
  attachments: Document[];
  canManage: boolean;
}

export function CompetencyAttachments({
  competencyId,
  attachments,
  canManage,
}: CompetencyAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onUpload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title || file.name);

    startTransition(async () => {
      const result = await uploadCompetencyAttachmentAction(
        competencyId,
        formData,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setTitle("");
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const onDelete = (documentId: string) => {
    if (!confirm("Remove this attachment?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCompetencyAttachmentAction(
        competencyId,
        documentId,
      );
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-4">
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments yet.</p>
      ) : (
        <ul className="space-y-3">
          {attachments.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {doc.title}
                </a>
                <p className="text-xs text-muted-foreground">
                  {formatDate(doc.createdAt)}
                  {doc.mimeType ? ` · ${doc.mimeType}` : ""}
                  {doc.sizeBytes
                    ? ` · ${(doc.sizeBytes / 1024).toFixed(0)} KB`
                    : ""}
                </p>
              </div>
              {canManage ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => onDelete(doc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <div className="space-y-3 rounded-md border border-border p-3">
          <div className="space-y-2">
            <Label htmlFor="attachment-title">Attachment title</Label>
            <Input
              id="attachment-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional display name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachment-file">File</Label>
            <Input id="attachment-file" ref={inputRef} type="file" />
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <Button type="button" size="sm" disabled={pending} onClick={onUpload}>
            {pending ? "Uploading…" : "Upload attachment"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
