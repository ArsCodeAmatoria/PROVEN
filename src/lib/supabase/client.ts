import { createBrowserClient } from "@supabase/ssr";

const REMEMBER_COOKIE = "proven_remember_me";
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getBrowserSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey),
  };
}

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
  const { url, anonKey, configured } = getBrowserSupabaseConfig();
  if (!configured || !url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the Vercel project (Production).",
    );
  }

  const rememberMe = options?.rememberMe ?? getRememberMePreference();
  if (options?.rememberMe !== undefined) {
    setRememberMePreference(options.rememberMe);
  }

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";

  return createBrowserClient(url, anonKey, {
    cookieOptions: {
      ...(rememberMe
        ? { maxAge: REMEMBER_MAX_AGE }
        : { maxAge: undefined }),
      path: "/",
      sameSite: "lax",
      secure,
    },
  });
}

export { REMEMBER_COOKIE, REMEMBER_MAX_AGE };
