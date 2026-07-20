"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import {
  formatMessage,
  learningDictionaryEn,
  type LearningDictionary,
} from "./dictionary-en";
import type { Locale } from "./config";

type LocaleContextValue = {
  locale: Locale;
  dictionary: LearningDictionary;
  t: (path: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolvePath(dict: LearningDictionary, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = dict;
  for (const part of parts) {
    if (current == null || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function LearningLocaleProvider({
  locale = "en",
  children,
}: {
  locale?: Locale;
  children: ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(() => {
    const dictionary = learningDictionaryEn;
    return {
      locale,
      dictionary,
      t: (path, vars) => {
        const raw = resolvePath(dictionary, path);
        if (!raw) return path;
        return vars ? formatMessage(raw, vars) : raw;
      },
    };
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useTranslations() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useTranslations must be used within LearningLocaleProvider");
  }
  return ctx;
}

export { LocaleContext as LearningLocaleContext };
