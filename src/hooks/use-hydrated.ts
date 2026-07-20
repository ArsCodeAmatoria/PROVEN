"use client";

import { useEffect, useState } from "react";

/** True only after client mount — use to avoid SSR/client Radix id mismatches. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
