import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { ZodSchema } from "zod";
import type { Database } from "@/lib/supabase/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Shared secure response headers
// ---------------------------------------------------------------------------

export const SECURE_HEADERS: Record<string, string> = {
  // Prevent caching at every layer: browser, Vercel edge, shared proxies.
  "Cache-Control": "no-store",
  "CDN-Cache-Control": "no-store",
  "Surrogate-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
};

export function publicErrorResponse(
  status: number,
  message: string,
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: SECURE_HEADERS }
  );
}

// ---------------------------------------------------------------------------
// requireUser
// ---------------------------------------------------------------------------

export type AuthResult =
  | { user: User; error: null; accessToken: string | null }
  | { user: null; error: NextResponse; accessToken: null };

/**
 * Validates the session cookie and returns the authenticated user.
 * Returns a 401 NextResponse if no valid session exists.
 *
 * Usage:
 *   const { user, error } = await requireUser(request);
 *   if (error) return error;
 */
export async function requireUser(request?: Request): Promise<AuthResult> {
  const bearerToken = getBearerToken(request);

  if (bearerToken) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Server misconfiguration" },
          { status: 500, headers: SECURE_HEADERS }
        ),
        accessToken: null,
      };
    }

    const supabase = createClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.getUser(bearerToken);

    if (error || !data.user) {
      console.info("[auth] unauthenticated bearer request rejected");
      return {
        user: null,
        error: NextResponse.json(
          { error: "Unauthorized" },
          { status: 401, headers: SECURE_HEADERS }
        ),
        accessToken: null,
      };
    }

    return { user: data.user, error: null, accessToken: bearerToken };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    console.info("[auth] unauthenticated request rejected");
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURE_HEADERS }),
      accessToken: null,
    };
  }

  return { user: data.user, error: null, accessToken: null };
}

function getBearerToken(request?: Request): string | null {
  const authHeader = request?.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

export function createUserScopedClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase client environment variables are not configured");
  }

  return createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

// ---------------------------------------------------------------------------
// Same-origin guard for cookie-authenticated mutations
// ---------------------------------------------------------------------------

/**
 * Reject cross-site mutation requests when auth is carried by cookies.
 * Bearer-token clients are exempt because they do not rely on ambient auth.
 */
export function requireSameOrigin(request: Request): NextResponse | null {
  if (getBearerToken(request)) return null;

  const origin = request.headers.get("origin");
  if (!origin) {
    return NextResponse.json(
      { error: "Cross-site request blocked" },
      { status: 403, headers: SECURE_HEADERS }
    );
  }

  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(request.url).origin;
  } catch {
    return NextResponse.json(
      { error: "Invalid request URL" },
      { status: 400, headers: SECURE_HEADERS }
    );
  }

  if (origin !== expectedOrigin) {
    return NextResponse.json(
      { error: "Cross-site request blocked" },
      { status: 403, headers: SECURE_HEADERS }
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// rateLimit — in-memory per-user-per-endpoint sliding window
// ---------------------------------------------------------------------------

interface RateLimitWindow {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitWindow>();

interface RateLimitOptions {
  /** Maximum requests allowed within the window. Default: 15 */
  max?: number;
  /** Window duration in milliseconds. Default: 60_000 (1 minute) */
  windowMs?: number;
  /**
   * Extra fields merged into the warning log when a limit is exceeded.
   * Callers should pass `{ endpoint, userId }` for actionable log entries.
   */
  meta?: Record<string, unknown>;
}

export type RateLimitResult =
  | { limited: false; error: null }
  | { limited: true; error: NextResponse };

/**
 * In-memory sliding-window rate limiter keyed by `${endpoint}:${userId}`.
 *
 * Key convention: always pass `endpoint:userId` so limits are independent
 * per route — hitting /api/gemini does not consume the /api/gemini/transcribe
 * budget and vice versa.
 *
 * Not suitable for multi-instance deployments — use Redis/Upstash there.
 *
 * Usage:
 *   const { limited, error } = rateLimit(`/api/gemini:${user.id}`, { meta: { endpoint, userId } });
 *   if (limited) return error;
 */
export function rateLimit(
  key: string,
  { max = 15, windowMs = 60_000, meta }: RateLimitOptions = {}
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { limited: false, error: null };
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    console.warn("[rate-limit] exceeded", {
      key,
      count: entry.count,
      max,
      retryAfterSeconds: retryAfter,
      ...meta,
    });
    return {
      limited: true,
      error: NextResponse.json(
        { error: "Too many requests. Please wait before retrying." },
        {
          status: 429,
          headers: { ...SECURE_HEADERS, "Retry-After": String(retryAfter) },
        }
      ),
    };
  }

  entry.count++;
  return { limited: false, error: null };
}

// ---------------------------------------------------------------------------
// validateBody
// ---------------------------------------------------------------------------

export type ValidationResult<T> =
  | { data: T; error: null }
  | { data: null; error: NextResponse };

/**
 * Parses and validates the request JSON body against a Zod schema.
 * Returns a 400 NextResponse with per-field errors on failure.
 * Schemas should use .strict() to reject unknown keys.
 *
 * Usage:
 *   const { data, error } = await validateBody(request, MySchema);
 *   if (error) return error;
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: SECURE_HEADERS }),
    };
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: "Invalid request body",
          issues: result.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400, headers: SECURE_HEADERS }
      ),
    };
  }

  return { data: result.data, error: null };
}
