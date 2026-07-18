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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
            remember === "0"
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

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/health") || pathname.startsWith("/callback")) {
    return supabaseResponse;
  }

  if (!user && !isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute(pathname) && pathname !== "/reset-password") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && !isAuthRoute(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, isActive")
      .eq("authUserId", user.id)
      .maybeSingle();

    const role = parseUserRole(
      profile?.role ?? user.app_metadata?.role ?? user.user_metadata?.role,
    );
    const isActive = profile?.isActive !== false;

    if (!isActive) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "inactive");
      return NextResponse.redirect(url);
    }

    const permission = getPermissionForPath(pathname);
    if (permission && !hasPermission(role, permission)) {
      const url = request.nextUrl.clone();
      url.pathname = getDefaultRouteForRole(role);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
