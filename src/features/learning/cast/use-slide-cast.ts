"use client";

import { useEffect, useRef } from "react";
import type { SlideCastMessage } from "@/features/learning/cast/slide-cast";
import { slideCastChannelId } from "@/features/learning/cast/slide-cast";

export function useSlideCastPublisher(lessonSlug: string, enabled: boolean, index: number, total: number) {
  const chRef = useRef<BroadcastChannel | null>(null);
  const idxRef = useRef(index);
  const totRef = useRef(total);

  useEffect(() => {
    idxRef.current = index;
    totRef.current = total;
  }, [index, total]);

  useEffect(() => {
    if (!enabled) {
      chRef.current?.close();
      chRef.current = null;
      return;
    }
    if (typeof BroadcastChannel === "undefined") return;

    const ch = new BroadcastChannel(slideCastChannelId(lessonSlug));
    chRef.current = ch;

    const broadcast = () => {
      const msg: SlideCastMessage = { type: "sync", index: idxRef.current, total: totRef.current };
      ch.postMessage(msg);
    };

    const onMessage = (ev: MessageEvent<SlideCastMessage>) => {
      if (ev.data?.type === "request-sync") broadcast();
    };

    ch.addEventListener("message", onMessage as EventListener);
    broadcast();

    return () => {
      ch.removeEventListener("message", onMessage as EventListener);
      ch.close();
      chRef.current = null;
    };
  }, [lessonSlug, enabled]);

  useEffect(() => {
    if (!enabled || !chRef.current) return;
    chRef.current.postMessage({ type: "sync", index, total } satisfies SlideCastMessage);
  }, [enabled, index, total]);
}

export function useSlideCastSubscriber(
  lessonSlug: string,
  enabled: boolean,
  totalSlides: number,
  onIndex: (i: number) => void
) {
  const onIndexRef = useRef(onIndex);

  useEffect(() => {
    onIndexRef.current = onIndex;
  }, [onIndex]);

  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === "undefined") return;

    const ch = new BroadcastChannel(slideCastChannelId(lessonSlug));

    const onMessage = (ev: MessageEvent<SlideCastMessage>) => {
      const d = ev.data;
      if (d?.type !== "sync") return;
      const max = Math.max(0, totalSlides - 1);
      const i = Number.isFinite(d.index) ? Math.max(0, Math.min(max, Math.floor(d.index))) : 0;
      onIndexRef.current(i);
    };

    ch.addEventListener("message", onMessage as EventListener);
    ch.postMessage({ type: "request-sync" } satisfies SlideCastMessage);

    return () => {
      ch.removeEventListener("message", onMessage as EventListener);
      ch.close();
    };
  }, [lessonSlug, enabled, totalSlides]);
}
