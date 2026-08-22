import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_INIT_SCRIPT } from "@/lib/theme/theme-init-script";

describe("Content-Security-Policy Configuration", () => {
  const proxyContent = fs.readFileSync(
    path.join(process.cwd(), "proxy.ts"),
    "utf8",
  );
  const layoutContent = fs.readFileSync(
    path.join(process.cwd(), "app", "layout.tsx"),
    "utf8",
  );
  const nextConfigContent = fs.readFileSync(
    path.join(process.cwd(), "next.config.mjs"),
    "utf8",
  );

  it("defines CSP in proxy.ts with object-src, base-uri, frame-ancestors, and form-action", () => {
    expect(proxyContent).toContain("object-src 'none'");
    expect(proxyContent).toContain("base-uri 'self'");
    expect(proxyContent).toContain("frame-ancestors 'none'");
    expect(proxyContent).toContain("form-action 'self'");
  });

  it("uses per-request nonce plus theme-init sha256, without headers() in root layout", () => {
    expect(proxyContent).toMatch(
      /script-src 'self' 'nonce-\$\{nonce\}' 'sha256-\$\{THEME_INIT_SCRIPT_SHA256\}' 'strict-dynamic'/,
    );
    expect(proxyContent).toContain('requestHeaders.set("x-nonce", nonce)');
    expect(proxyContent).toContain("THEME_INIT_SCRIPT");
    // Performance: root layout must stay static-capable (Next CSP guide).
    expect(layoutContent).not.toMatch(/from ["']next\/headers["']/);
    expect(layoutContent).not.toMatch(/\bawait headers\(\)/);
    expect(layoutContent).not.toMatch(/headers\(\)\.get/);
    expect(layoutContent).not.toContain("nonce={nonce}");
    expect(layoutContent).toContain("THEME_INIT_SCRIPT");
  });

  it("theme-init script hash in proxy matches THEME_INIT_SCRIPT bytes", () => {
    const expected = createHash("sha256").update(THEME_INIT_SCRIPT).digest("base64");
    // Sanity: constant used by proxy must stay in sync with layout inline script.
    expect(THEME_INIT_SCRIPT.length).toBeGreaterThan(80);
    expect(expected).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("excludes unsafe-inline from production script-src and keeps unsafe-eval only in development", () => {
    expect(proxyContent).toMatch(
      /`script-src 'self' 'nonce-\$\{nonce\}' 'sha256-\$\{THEME_INIT_SCRIPT_SHA256\}' 'strict-dynamic'\$\{isDev \? " 'unsafe-eval'" : ""\}`/,
    );
    expect(proxyContent).not.toMatch(/script-src[^`]*unsafe-inline/);
  });

  it("restricts connect-src to required origins (self, supabase, google)", () => {
    expect(proxyContent).toContain(
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://accounts.google.com",
    );
  });

  it("does not redefine a conflicting production script-src without nonce in next.config", () => {
    expect(nextConfigContent).not.toMatch(/Content-Security-Policy/);
    expect(nextConfigContent).not.toMatch(/script-src 'self'\$\{isDev/);
  });
});
