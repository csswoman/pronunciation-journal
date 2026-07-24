import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  // Some hosted OAuth configurations use the Supabase Site URL (`/`) as the
  // final redirect, even when the client asks for `/auth/callback`. Forward
  // the authorization code before the authenticated layout can discard it.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
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

  // Refreshes the session token — do not remove this call
  await supabase.auth.getUser();

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
