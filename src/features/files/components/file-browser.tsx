"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  FileIcon,
  FilePlus,
  Folder,
  FolderPlus,
  ImageIcon,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createFolderAction,
  deleteCompanyFileAction,
  deleteFolderAction,
  uploadCompanyFileAction,
} from "@/features/files/actions";
import type { FilesBrowserView } from "@/services/files.service";
import { formatDate } from "@/utils/format";

function formatBytes(size: number | null | undefined) {
  if (size == null || size <= 0) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string | null | undefined) {
  return Boolean(mime?.startsWith("image/"));
}

export function FileBrowser({
  data,
  canManage,
}: {
  data: FilesBrowserView;
  canManage: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [folderName, setFolderName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function folderHref(id: string | null) {
    return id ? `/files?folderId=${id}` : "/files";
  }

  function onCreateFolder() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createFolderAction({
        name: folderName,
        parentId: data.folderId,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setFolderName("");
      setMessage("Folder created");
    });
  }

  function onUpload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadCompanyFileAction(data.folderId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Uploaded");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function onDeleteFolder(folderId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteFolderAction(folderId);
      if (result.error) setError(result.error);
    });
  }

  function onDeleteFile(documentId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteCompanyFileAction(documentId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {data.breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.id ?? "root"}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <span>/</span> : null}
            <Link
              href={folderHref(crumb.id)}
              className="hover:text-foreground hover:underline"
            >
              {crumb.name}
            </Link>
          </span>
        ))}
      </nav>

      {canManage ? (
        <div className="flex flex-wrap items-end gap-3 rounded-md border p-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="new-folder">
              New folder
            </label>
            <Input
              id="new-folder"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-56"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={pending || !folderName.trim()}
            onClick={onCreateFolder}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Create folder
          </Button>
          <Input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0])}
          />
          <Button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Upload file
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Folders</h2>
        {data.folders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No folders here.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {data.folders.map((folder) => (
              <li
                key={folder.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <Link
                  href={folderHref(folder.id)}
                  className="flex min-w-0 items-center gap-2 font-medium hover:underline"
                >
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{folder.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {folder._count.children} folders · {folder._count.documents}{" "}
                    files
                  </span>
                </Link>
                {canManage ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    disabled={pending}
                    onClick={() => onDeleteFolder(folder.id)}
                    aria-label={`Delete ${folder.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Files</h2>
        {data.files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files in this folder.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.files.map((file) => (
              <li key={file.id} className="rounded-md border p-3">
                {isImage(file.mimeType) ? (
                  <a href={file.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.url}
                      alt={file.title}
                      className="mb-2 h-32 w-full rounded object-cover"
                    />
                  </a>
                ) : (
                  <div className="mb-2 flex h-32 items-center justify-center rounded bg-muted">
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {isImage(file.mimeType) ? (
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="h-3.5 w-3.5" />
                          {file.title}
                        </span>
                      ) : (
                        file.title
                      )}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.sizeBytes)} · {formatDate(file.createdAt)}
                    </p>
                  </div>
                  {canManage ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      disabled={pending}
                      onClick={() => onDeleteFile(file.id)}
                      aria-label={`Delete ${file.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
