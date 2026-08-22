import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";
import { SECURE_HEADERS } from "@/lib/api/headers";
import { logServerError } from "@/lib/api/logging";

export type RateLimitResult =
  | { limited: false; error: null }
  | { limited: true; error: NextResponse };

interface RateLimitWindow {
  count: number;
  windowStart: number;
}

const memoryStore = new Map<string, RateLimitWindow>();

/**
 * Platform documentation for IP resolution:
 * Vercel / reverse-proxies pass client IP in headers.
 * Priority:
 * 1. `x-real-ip` (Vercel standard client IP header)
 * 2. `cf-connecting-ip` (Cloudflare edge proxy header)
 * 3. `x-forwarded-for` (comma-separated list; first entry is the client IP)
 */
export function getClientIp(request?: Request): string {
  if (!request) return "127.0.0.1";

  const headers = request.headers;
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp && isValidIp(xRealIp.trim())) {
    return xRealIp.trim();
  }

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp.trim())) {
    return cfIp.trim();
  }

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (isValidIp(firstIp)) {
      return firstIp;
    }
  }

  return "127.0.0.1";
}

function isValidIp(ip: string): boolean {
  // Basic IPv4 / IPv6 validation
  const ipv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  return ipv4.test(ip) || ipv6.test(ip);
}

/**
 * Hashes client IP with a server-only secret to avoid storing raw PII.
 */
export function hashIp(ip: string): string {
  const secret =
    process.env.RATE_LIMIT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "internal-rate-limit-secret-salt";

  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 16);
}

/**
 * Checks if a Supabase user is an anonymous / guest session.
 */
export function isAnonymousUser(user: User | null | undefined): boolean {
  if (!user) return true;
  return (
    user.is_anonymous === true ||
    user.app_metadata?.provider === "anonymous" ||
    (Array.isArray(user.identities) &&
      user.identities.length === 1 &&
      user.identities[0].provider === "anonymous")
  );
}

export interface LayeredRateLimitOptions {
  request?: Request;
  user: User;
  endpoint: string;
  maxPermanent?: number;
  maxAnonymous?: number;
  windowMs?: number;
}

type ConsumeResult =
  | { allowed: true; retryAfter: 0 }
  | { allowed: false; retryAfter: number; misconfigured?: boolean };

async function consumeKey(
  key: string,
  max: number,
  windowMs: number,
): Promise<ConsumeResult> {
  const supabase = tryGetSupabaseAdminClient();
  const isProd = process.env.NODE_ENV === "production" && process.env.VITEST !== "true";

  if (!supabase) {
    if (isProd) {
      logServerError("Rate limit unavailable", new Error("Missing database client"), {
        endpoint: "rate-limit",
        operation: "consume",
      });
      return { allowed: false, retryAfter: 60, misconfigured: true };
    }
    return consumeMemory(key, max, windowMs);
  }

  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_ms: windowMs,
  });

  if (error) {
    logServerError("Rate limit database check failed", error, {
      endpoint: "rate-limit",
      operation: "consume",
    });
    if (isProd) {
      // Fail closed in production
      return { allowed: false, retryAfter: 60 };
    }
    return consumeMemory(key, max, windowMs);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.allowed !== "boolean") {
    if (isProd) return { allowed: false, retryAfter: 60 };
    return consumeMemory(key, max, windowMs);
  }

  if (row.allowed) {
    return { allowed: true, retryAfter: 0 };
  }

  return {
    allowed: false,
    retryAfter: typeof row.retry_after_seconds === "number" ? row.retry_after_seconds : 60,
  };
}

function consumeMemory(key: string, max: number, windowMs: number): ConsumeResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    memoryStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

/**
 * Multi-layered rate limiter for AI / Gemini routes:
 * 1. IP-level quota (thwarting session rotation).
 * 2. User-level quota (stricter for anonymous guests).
 * 3. Global emergency budget, consumed only by requests that passed both.
 */
export async function checkLayeredRateLimit({
  request,
  user,
  endpoint,
  maxPermanent = 15,
  maxAnonymous = 3,
  windowMs = 60_000,
}: LayeredRateLimitOptions): Promise<RateLimitResult> {
  const isAnon = isAnonymousUser(user);
  const clientIp = getClientIp(request);
  const ipHashed = hashIp(clientIp);

  // 1. IP-level limit across sessions (blocks anonymous session rotation)
  const ipMax = isAnon ? maxAnonymous * 2 : maxPermanent * 2;
  const ipKey = `gemini:ip:${endpoint}:${ipHashed}`;
  const ipCheck = await consumeKey(ipKey, ipMax, windowMs);
  if (!ipCheck.allowed) {
    if (ipCheck.misconfigured) {
      return {
        limited: true,
        error: NextResponse.json(
          { error: "AI service temporarily unavailable" },
          { status: 503, headers: SECURE_HEADERS },
        ),
      };
    }
    return {
      limited: true,
      error: NextResponse.json(
        { error: "Too many requests from this network. Please wait before retrying." },
        {
          status: 429,
          headers: { ...SECURE_HEADERS, "Retry-After": String(ipCheck.retryAfter) },
        },
      ),
    };
  }

  // 2. IP-level cumulative anonymous cap
  if (isAnon) {
    const anonIpKey = `gemini:ip_anon:${ipHashed}`;
    const anonIpCheck = await consumeKey(anonIpKey, 6, windowMs);
    if (!anonIpCheck.allowed) {
      return {
        limited: true,
        error: NextResponse.json(
          { error: "Guest quota exceeded for this network. Please create an account or wait." },
          {
            status: 429,
            headers: { ...SECURE_HEADERS, "Retry-After": String(anonIpCheck.retryAfter) },
          },
        ),
      };
    }
  }

  // 3. User-level limit (per user, per endpoint)
  const userMax = isAnon ? maxAnonymous : maxPermanent;
  const userKey = `gemini:user:${endpoint}:${user.id}`;
  const userCheck = await consumeKey(userKey, userMax, windowMs);
  if (!userCheck.allowed) {
    if (userCheck.misconfigured) {
      return {
        limited: true,
        error: NextResponse.json(
          { error: "AI service temporarily unavailable" },
          { status: 503, headers: SECURE_HEADERS },
        ),
      };
    }
    return {
      limited: true,
      error: NextResponse.json(
        { error: "Too many requests. Please wait before retrying." },
        {
          status: 429,
          headers: { ...SECURE_HEADERS, "Retry-After": String(userCheck.retryAfter) },
        },
      ),
    };
  }

  // 4. Global emergency limit. It is deliberately last so a client already
  // blocked by a narrower quota cannot consume capacity for every other user.
  const globalCheck = await consumeKey("gemini:global:emergency", 400, windowMs);
  if (!globalCheck.allowed) {
    if (globalCheck.misconfigured) {
      return {
        limited: true,
        error: NextResponse.json(
          { error: "AI service temporarily unavailable" },
          { status: 503, headers: SECURE_HEADERS },
        ),
      };
    }
    return {
      limited: true,
      error: NextResponse.json(
        { error: "System capacity reached. Please wait before retrying." },
        {
          status: 429,
          headers: { ...SECURE_HEADERS, "Retry-After": String(globalCheck.retryAfter) },
        },
      ),
    };
  }

  return { limited: false, error: null };
}

/** Reset memory store — for unit tests */
export function _resetRateLimitMemoryStore(): void {
  memoryStore.clear();
}
