import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  checkLayeredRateLimit,
  getClientIp,
  hashIp,
  isAnonymousUser,
  _resetRateLimitMemoryStore,
} from "../rate-limit";

describe("Layered Rate Limiting and Anonymous Abuse Mitigation", () => {
  beforeEach(() => {
    _resetRateLimitMemoryStore();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    _resetRateLimitMemoryStore();
    vi.unstubAllEnvs();
  });

  const permanentUser: User = {
    id: "perm-user-123",
    app_metadata: { provider: "email" },
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };

  const anonymousUserA: User = {
    id: "anon-user-aaa",
    is_anonymous: true,
    app_metadata: { provider: "anonymous" },
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };

  const anonymousUserB: User = {
    id: "anon-user-bbb",
    is_anonymous: true,
    app_metadata: { provider: "anonymous" },
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };

  it("identifies anonymous vs permanent users reliably", () => {
    expect(isAnonymousUser(anonymousUserA)).toBe(true);
    expect(isAnonymousUser(anonymousUserB)).toBe(true);
    expect(isAnonymousUser(permanentUser)).toBe(false);
  });

  it("extracts client IP from proxy headers according to priority without trusting whole list blindly", () => {
    const reqRealIp = new Request("https://example.com/api/gemini", {
      headers: { "x-real-ip": "203.0.113.19" },
    });
    expect(getClientIp(reqRealIp)).toBe("203.0.113.19");

    const reqCf = new Request("https://example.com/api/gemini", {
      headers: { "cf-connecting-ip": "198.51.100.42" },
    });
    expect(getClientIp(reqCf)).toBe("198.51.100.42");

    const reqForwarded = new Request("https://example.com/api/gemini", {
      headers: { "x-forwarded-for": "192.0.2.1, 10.0.0.1, 172.16.0.1" },
    });
    expect(getClientIp(reqForwarded)).toBe("192.0.2.1");
  });

  it("hashes IP addresses using HMAC and never stores raw IP in cleartext", () => {
    const ip = "203.0.113.19";
    const hashed = hashIp(ip);
    expect(hashed).not.toContain(ip);
    expect(hashed).toHaveLength(16);
    expect(hashIp(ip)).toBe(hashed); // deterministic per salt
  });

  it("enforces reduced quota for anonymous users", async () => {
    const request = new Request("https://example.com/api/gemini", {
      headers: { "x-real-ip": "198.51.100.1" },
    });

    // Anonymous limit is 3 requests
    const res1 = await checkLayeredRateLimit({
      request,
      user: anonymousUserA,
      endpoint: "/api/gemini",
      maxPermanent: 15,
      maxAnonymous: 3,
    });
    expect(res1.limited).toBe(false);

    const res2 = await checkLayeredRateLimit({
      request,
      user: anonymousUserA,
      endpoint: "/api/gemini",
      maxPermanent: 15,
      maxAnonymous: 3,
    });
    expect(res2.limited).toBe(false);

    const res3 = await checkLayeredRateLimit({
      request,
      user: anonymousUserA,
      endpoint: "/api/gemini",
      maxPermanent: 15,
      maxAnonymous: 3,
    });
    expect(res3.limited).toBe(false);

    // 4th request exceeds anonymous quota
    const res4 = await checkLayeredRateLimit({
      request,
      user: anonymousUserA,
      endpoint: "/api/gemini",
      maxPermanent: 15,
      maxAnonymous: 3,
    });
    expect(res4.limited).toBe(true);
    expect(res4.error?.status).toBe(429);
  });

  it("blocks anonymous session rotation from the same IP address", async () => {
    const request = new Request("https://example.com/api/gemini", {
      headers: { "x-real-ip": "198.51.100.55" },
    });

    // Exhaust 3 requests with User A
    for (let i = 0; i < 3; i++) {
      const res = await checkLayeredRateLimit({
        request,
        user: anonymousUserA,
        endpoint: "/api/gemini",
        maxPermanent: 15,
        maxAnonymous: 3,
      });
      expect(res.limited).toBe(false);
    }

    // Now attacker spawns User B on the same IP and tries to get more quota
    for (let i = 0; i < 3; i++) {
      await checkLayeredRateLimit({
        request,
        user: anonymousUserB,
        endpoint: "/api/gemini",
        maxPermanent: 15,
        maxAnonymous: 3,
      });
    }

    // A third user on the same IP is blocked by the cumulative IP limit
    const anonymousUserC: User = {
      id: "anon-user-ccc",
      is_anonymous: true,
      app_metadata: { provider: "anonymous" },
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };

    const resBlocked = await checkLayeredRateLimit({
      request,
      user: anonymousUserC,
      endpoint: "/api/gemini",
      maxPermanent: 15,
      maxAnonymous: 3,
    });
    expect(resBlocked.limited).toBe(true);
    expect(resBlocked.error?.status).toBe(429);
  });

  it("allows higher quota for permanent registered users", async () => {
    const request = new Request("https://example.com/api/gemini", {
      headers: { "x-real-ip": "198.51.100.99" },
    });

    // Permanent user gets full maxPermanent (e.g. 10)
    for (let i = 0; i < 10; i++) {
      const res = await checkLayeredRateLimit({
        request,
        user: permanentUser,
        endpoint: "/api/gemini",
        maxPermanent: 10,
        maxAnonymous: 3,
      });
      expect(res.limited).toBe(false);
    }

    const resBlocked = await checkLayeredRateLimit({
      request,
      user: permanentUser,
      endpoint: "/api/gemini",
      maxPermanent: 10,
      maxAnonymous: 3,
    });
    expect(resBlocked.limited).toBe(true);
    expect(resBlocked.error?.status).toBe(429);
  });

  it("does not consume the global emergency budget when IP quota already rejects", async () => {
    const request = new Request("https://example.com/api/gemini", {
      headers: { "x-real-ip": "198.51.100.200" },
    });

    // With maxAnonymous=3: user max=3, IP endpoint max=6. Exhaust both.
    for (let i = 0; i < 3; i++) {
      const res = await checkLayeredRateLimit({
        request,
        user: anonymousUserA,
        endpoint: "/api/gemini/global-order",
        maxPermanent: 15,
        maxAnonymous: 3,
      });
      expect(res.limited).toBe(false);
    }
    for (let i = 0; i < 3; i++) {
      const res = await checkLayeredRateLimit({
        request,
        user: anonymousUserB,
        endpoint: "/api/gemini/global-order",
        maxPermanent: 15,
        maxAnonymous: 3,
      });
      expect(res.limited).toBe(false);
    }

    // Further attempts must be rejected by the IP layers without burning global quota.
    for (let i = 0; i < 50; i++) {
      const blocked = await checkLayeredRateLimit({
        request,
        user: anonymousUserA,
        endpoint: "/api/gemini/global-order",
        maxPermanent: 15,
        maxAnonymous: 3,
      });
      expect(blocked.limited).toBe(true);
      expect(blocked.error?.status).toBe(429);
    }

    // A different IP must still be able to consume capacity (global budget intact).
    const otherRequest = new Request("https://example.com/api/gemini", {
      headers: { "x-real-ip": "198.51.100.201" },
    });
    const stillAllowed = await checkLayeredRateLimit({
      request: otherRequest,
      user: permanentUser,
      endpoint: "/api/gemini/global-order",
      maxPermanent: 15,
      maxAnonymous: 3,
    });
    expect(stillAllowed.limited).toBe(false);
  });

  it("fails closed with 503 in production when the distributed limiter client is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VITEST", "false");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const request = new Request("https://example.com/api/gemini", {
      headers: { "x-real-ip": "203.0.113.50" },
    });

    const res = await checkLayeredRateLimit({
      request,
      user: permanentUser,
      endpoint: "/api/gemini/fail-closed",
      maxPermanent: 15,
      maxAnonymous: 3,
    });

    expect(res.limited).toBe(true);
    expect(res.error?.status).toBe(503);
  });
});
