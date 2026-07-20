"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, ChevronRight, Folder, FolderOpen, Library } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  attachCompanyFilesToCorEvidenceAction,
  browseCompanyFilesForCorAction,
} from "@/features/compliance/actions";
import { cn } from "@/lib/utils";

type BrowserFolder = {
  id: string;
  name: string;
  childCount: number;
  fileCount: number;
};

type BrowserFile = {
  id: string;
  title: string;
  mimeType: string | null;
  sizeBytes: number | null;
  url: string;
};

type BrowserView = {
  folderId: string | null;
  breadcrumbs: { id: string | null; name: string }[];
  folders: BrowserFolder[];
  files: BrowserFile[];
};

export function CorAttachFromFilesDialog({
  sessionId,
  questionId,
  disabled,
  evidenceKind = "DOCUMENTATION",
}: {
  sessionId: string;
  questionId: string;
  disabled?: boolean;
  evidenceKind?: "DOCUMENTATION" | "OBSERVATION" | "INTERVIEW";
}) {
  const [open, setOpen] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [view, setView] = useState<BrowserView | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback((nextFolderId: string | null) => {
    setError(null);
    startTransition(async () => {
      const result = await browseCompanyFilesForCorAction(nextFolderId);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (!("data" in result) || !result.data) {
        setError("Unable to load company files.");
        return;
      }
      setFolderId(result.data.folderId);
      setView(result.data);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setFolderId(null);
    setView(null);
    load(null);
  }, [open, load]);

  function toggleFile(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function attach() {
    if (selected.size === 0) {
      setError("Select at least one file.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await attachCompanyFilesToCorEvidenceAction(
        sessionId,
        questionId,
        [...selected],
        evidenceKind,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={disabled}>
          <Library className="mr-2 h-4 w-4" />
          Attach from Files
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Attach from company Files</DialogTitle>
          <DialogDescription>
            Browse your Files library and link documents to this audit question.
            Files stay in place — they are not re-uploaded.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {view ? (
            <>
              <nav className="flex flex-wrap items-center gap-1 text-sm">
                {view.breadcrumbs.map((crumb, index) => {
                  const isLast = index === view.breadcrumbs.length - 1;
                  return (
                    <span key={crumb.id ?? "root"} className="flex items-center gap-1">
                      {index > 0 ? (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : null}
                      {isLast ? (
                        <span className="font-medium">{crumb.name}</span>
                      ) : (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground hover:underline"
                          disabled={pending}
                          onClick={() => load(crumb.id)}
                        >
                          {crumb.name}
                        </button>
                      )}
                    </span>
                  );
                })}
              </nav>

              {view.folders.length === 0 && view.files.length === 0 ? (
                <p className="text-sm text-muted-foreground">This folder is empty.</p>
              ) : (
                <ul className="space-y-1">
                  {view.folders.map((folder) => (
                    <li key={folder.id}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => load(folder.id)}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
                      >
                        {folderId === folder.id ? (
                          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {folder.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {folder.fileCount} files
                          {folder.childCount > 0
                            ? ` · ${folder.childCount} folders`
                            : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                  {view.files.map((file) => {
                    const isSelected = selected.has(file.id);
                    return (
                      <li key={file.id}>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => toggleFile(file.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md border px-2 py-2 text-left",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40",
                            )}
                          >
                            {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {file.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {pending ? "Loading files…" : "Open a folder to begin."}
            </p>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selected.size === 0
              ? "No files selected"
              : `${selected.size} file${selected.size === 1 ? "" : "s"} selected`}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || selected.size === 0}
              onClick={attach}
            >
              Attach
              {selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
