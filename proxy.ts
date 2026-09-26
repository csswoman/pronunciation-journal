import { createHash } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { shouldForwardRootOAuthToCallback } from "@/lib/auth/oauth-identity";
import { THEME_INIT_SCRIPT } from "@/lib/theme/theme-init-script";

/** Hash for the theme boot script in `app/layout.tsx`. */
const THEME_INIT_SCRIPT_SHA256 = createHash("sha256")
  .update(THEME_INIT_SCRIPT)
  .digest("base64");

function createContentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://accounts.google.com",
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: data: blob:",
    "font-src 'self'",
    "worker-src 'self'",
    // The root layout is dynamically rendered so Next can apply this nonce to
    // its inline RSC payloads and framework scripts. The hash also keeps the
    // blocking theme script independently verifiable.
    // 'wasm-unsafe-eval' only allows compiling WebAssembly modules (Kokoro's
    // ONNX Runtime, Plan 039) — it is not 'unsafe-eval' and does not enable
    // string-based JS eval.
    `script-src 'self' 'nonce-${nonce}' 'sha256-${THEME_INIT_SCRIPT_SHA256}' 'strict-dynamic' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
    // Styles: keep 'unsafe-inline' — runtime style attributes and CSS tooling still need it.
    // A style nonce alone would ignore unsafe-inline in modern browsers and break them.
    "style-src 'self' 'unsafe-inline'",
    // https://huggingface.co + https://*.hf.co: on-demand download of the
    // Kokoro TTS model weights (Plan 039). The .wasm runtime itself ships
    // from public/wasm/ (same-origin), so worker-src stays 'self'.
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://accounts.google.com https://api.dictionaryapi.dev https://huggingface.co https://*.hf.co",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const nextResponse = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return response;
  };

  if (!isSupabaseConfigured()) {
    return nextResponse();
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
    const response = NextResponse.redirect(callbackUrl);
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return response;
  }

  let supabaseResponse = nextResponse();

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
          supabaseResponse = nextResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validates JWT / refreshes when needed (local JWKS when asymmetric keys).
  // Prefer getClaims over getUser — getUser always hits the Auth API and adds TTFB.
  try {
    await supabase.auth.getClaims();
  } catch (error) {
    // A stale/rotated refresh token in the cookie makes Supabase throw
    // `refresh_token_not_found`. That just means "no session" — drop the dead
    // cookies so we stop retrying the same doomed refresh on every request.
    const code = (error as { code?: string } | null)?.code;
    if (code === "refresh_token_not_found" || code === "refresh_token_already_used") {
      await supabase.auth.signOut({ scope: "local" }).catch(() => { });
    } else {
      console.error("[auth] proxy getClaims failed", error);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
