"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  uploadAssessmentMediaAction,
  uploadAssessmentSignatureAction,
} from "@/features/assessments/actions";
import {
  ASSESSMENT_SIGNER_ROLE_LABELS,
} from "@/features/assessments/constants";
import type { AssessmentSignature, Photo, Video as VideoModel } from "@/types";
import { formatDate } from "@/utils/format";

interface AssessmentMediaPanelProps {
  assessmentResultId: string;
  photos: Photo[];
  videos: VideoModel[];
  signatures: AssessmentSignature[];
  canManage: boolean;
}

export function AssessmentMediaPanel({
  assessmentResultId,
  photos,
  videos,
  signatures,
  canManage,
}: AssessmentMediaPanelProps) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const uploadMedia = (kind: "photo" | "video", file: File | undefined) => {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", kind);

    startTransition(async () => {
      const result = await uploadAssessmentMediaAction(
        assessmentResultId,
        formData,
      );
      if (result.error) setError(result.error);
      if (kind === "photo" && photoRef.current) photoRef.current.value = "";
      if (kind === "video" && videoRef.current) videoRef.current.value = "";
    });
  };

  const uploadSignature = (signatureId: string, file: File | undefined) => {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("signature", file);
    startTransition(async () => {
      const result = await uploadAssessmentSignatureAction(
        signatureId,
        formData,
      );
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium">Photos</h3>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No photos attached.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-md border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || "Assessment photo"}
                  className="h-36 w-full object-cover"
                />
                <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">
                  {photo.caption || formatDate(photo.createdAt)}
                </p>
              </a>
            ))}
          </div>
        )}
        {canManage ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="max-w-xs"
              onChange={(event) =>
                uploadMedia("photo", event.target.files?.[0])
              }
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => photoRef.current?.click()}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              Add photo
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">Videos</h3>
        {videos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No videos attached.</p>
        ) : (
          <ul className="space-y-3">
            {videos.map((video) => (
              <li key={video.id} className="space-y-2">
                <video
                  controls
                  src={video.url}
                  className="max-h-64 w-full rounded-md border border-border"
                />
                <p className="text-xs text-muted-foreground">
                  {video.caption || formatDate(video.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {canManage ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              ref={videoRef}
              type="file"
              accept="video/*"
              className="max-w-xs"
              onChange={(event) =>
                uploadMedia("video", event.target.files?.[0])
              }
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => videoRef.current?.click()}
            >
              <Video className="mr-2 h-4 w-4" />
              Add video
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">Signatures</h3>
        <ul className="space-y-3">
          {signatures.map((signature) => (
            <li
              key={signature.id}
              className="rounded-md border border-border p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {ASSESSMENT_SIGNER_ROLE_LABELS[signature.role]} ·{" "}
                    {signature.signerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Signed {formatDate(signature.signedAt, "MMM d, yyyy p")}
                  </p>
                </div>
                {canManage ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Signature image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-xs"
                      onChange={(event) =>
                        uploadSignature(signature.id, event.target.files?.[0])
                      }
                    />
                  </div>
                ) : null}
              </div>
              {signature.signatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signature.signatureUrl}
                  alt={`${signature.signerName} signature`}
                  className="mt-3 max-h-24 rounded border border-border bg-white p-2"
                />
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
