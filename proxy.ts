import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { shouldForwardRootOAuthToCallback } from "@/lib/auth/oauth-identity";

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  // Some hosted OAuth configurations use the Supabase Site URL (`/`) as the
  // final redirect, even when the client asks for `/auth/callback`. Forward
  // the authorization code (and identity-link errors) before the authenticated
  // layout can discard them.
  if (
    request.nextUrl.pathname === "/" &&
    shouldForwardRootOAuthToCallback(request.nextUrl.searchParams)
  ) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validates JWT / refreshes when needed (local JWKS when asymmetric keys).
  // Prefer getClaims over getUser — getUser always hits the Auth API and adds TTFB.
  await supabase.auth.getClaims();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/auth/callback",
    "/courses/:path*",
    "/daily/:path*",
    "/dictionary/:path*",
    "/ipa/:path*",
    "/lexicon/:path*",
    "/mini-lessons/:path*",
    "/practice/:path*",
    "/profile/:path*",
    "/progress/:path*",
    "/review/:path*",
    "/test/:path*",
    "/vocabulary/:path*",
    "/words/:path*",
  ],
};
