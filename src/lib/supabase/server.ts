import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { hasSupabaseConfig } from "@/lib/env";

export async function createClient() {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can be called from a Server Component where cookies
            // are read-only. Middleware will refresh the session instead.
          }
        },
      },
    },
  );
}

export async function tryCreateClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }
  return createClient();
}
