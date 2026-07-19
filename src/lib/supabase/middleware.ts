import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  AUTH_ROUTES,
  getDefaultRouteForRole,
  getPermissionForPath,
  hasPermission,
  parseUserRole,
} from "@/lib/auth/permissions";

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isPublicAsset(pathname: string) {
  return (
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico"
  );
}

/** Preserve Supabase cookie mutations when returning a redirect. */
function redirectWithSession(url: URL, sessionResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach(({ name, value }) => {
    redirectResponse.cookies.set(name, value);
  });
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          const remember = request.cookies.get("proven_remember_me")?.value;
          const maxAge =
            options?.maxAge === 0
              ? 0
              : remember === "0"
                ? undefined
                : (options?.maxAge ?? 60 * 60 * 24 * 30);
          supabaseResponse.cookies.set(name, value, {
            ...options,
            maxAge,
          });
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/api/health") || pathname.startsWith("/callback")) {
    return supabaseResponse;
  }

  if (!user && !isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return redirectWithSession(url, supabaseResponse);
  }

  // Only redirect signed-in users away from auth pages on normal navigations.
  // Server Actions POST to the current route; redirecting those breaks the
  // action with "An unexpected response was received from the server."
  if (
    user &&
    isAuthRoute(pathname) &&
    pathname !== "/reset-password" &&
    request.method === "GET"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return redirectWithSession(url, supabaseResponse);
  }

  if (user && !isAuthRoute(pathname)) {
    const { data: appUser } = await supabase
      .from("users")
      .select("id, is_active")
      .eq("auth_user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    const { data: employee } = appUser?.id
      ? await supabase
          .from("employees")
          .select("role, status")
          .eq("user_id", appUser.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : { data: null };

    const role = parseUserRole(
      employee?.role ?? user.app_metadata?.role ?? user.user_metadata?.role,
    );
    const isActive =
      appUser?.is_active !== false &&
      (!employee || employee.status === "ACTIVE");

    if (!isActive) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "inactive");
      return redirectWithSession(url, supabaseResponse);
    }

    const permission = getPermissionForPath(pathname);
    if (permission && !hasPermission(role, permission)) {
      const url = request.nextUrl.clone();
      url.pathname = getDefaultRouteForRole(role);
      return redirectWithSession(url, supabaseResponse);
    }
  }

  return supabaseResponse;
}
