import { createBrowserClient } from "@supabase/ssr";

import { hasSupabaseConfig } from "@/lib/env";

const REMEMBER_COOKIE = "proven_remember_me";
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function getRememberMePreference(): boolean {
  if (typeof document === "undefined") return true;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${REMEMBER_COOKIE}=`));
  if (!match) return true;
  return match.split("=")[1] === "1";
}

export function setRememberMePreference(remember: boolean) {
  if (typeof document === "undefined") return;
  if (remember) {
    document.cookie = `${REMEMBER_COOKIE}=1; path=/; max-age=${REMEMBER_MAX_AGE}; SameSite=Lax`;
  } else {
    document.cookie = `${REMEMBER_COOKIE}=0; path=/; SameSite=Lax`;
  }
}

export function createClient(options?: { rememberMe?: boolean }) {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const rememberMe = options?.rememberMe ?? getRememberMePreference();
  if (options?.rememberMe !== undefined) {
    setRememberMePreference(options.rememberMe);
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Persistent cookies when remember-me is on; session cookie otherwise.
        ...(rememberMe
          ? { maxAge: REMEMBER_MAX_AGE }
          : { maxAge: undefined }),
        path: "/",
        sameSite: "lax",
      },
    },
  );
}

export { REMEMBER_COOKIE, REMEMBER_MAX_AGE };
