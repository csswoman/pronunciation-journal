import { describe, expect, it } from "vitest";
import { explicitRuntimeCaching } from "../sw-runtime-caching";

function runMatcher(
  rule: (typeof explicitRuntimeCaching)[number],
  url: URL,
  request: Request,
  sameOrigin = true,
): boolean {
  if (typeof rule.matcher === "function") {
    return Boolean(
      rule.matcher({
        url,
        request,
        event: {} as never,
        sameOrigin,
      }),
    );
  }
  if (rule.matcher instanceof RegExp) {
    return rule.matcher.test(url.href) || rule.matcher.test(url.pathname);
  }
  return false;
}

describe("Service Worker Runtime Caching Policy", () => {
  it("never caches /api routes and assigns NetworkOnly handler", () => {
    const url = new URL("https://example.com/api/gemini");
    const request = new Request(url);
    const apiRule = explicitRuntimeCaching.find((rule) => runMatcher(rule, url, request));

    expect(apiRule).toBeDefined();
    expect(apiRule?.handler.constructor.name).toBe("NetworkOnly");
  });

  it("never caches React Server Component (RSC) requests and assigns NetworkOnly handler", () => {
    // Via RSC header
    const rscHeaderUrl = new URL("https://example.com/courses");
    const rscHeaderReq = new Request(rscHeaderUrl, { headers: { RSC: "1" } });
    const rscHeaderRule = explicitRuntimeCaching.find((rule) =>
      runMatcher(rule, rscHeaderUrl, rscHeaderReq),
    );
    expect(rscHeaderRule).toBeDefined();
    expect(rscHeaderRule?.handler.constructor.name).toBe("NetworkOnly");

    // Via _rsc query parameter
    const rscQueryUrl = new URL("https://example.com/courses?_rsc=abc123");
    const rscQueryReq = new Request(rscQueryUrl);
    const rscQueryRule = explicitRuntimeCaching.find((rule) =>
      runMatcher(rule, rscQueryUrl, rscQueryReq),
    );
    expect(rscQueryRule).toBeDefined();
    expect(rscQueryRule?.handler.constructor.name).toBe("NetworkOnly");
  });

  it("never caches HTML documents or navigation requests dynamically", () => {
    const docUrl = new URL("https://example.com/dashboard");
    const docReq = new Request(docUrl, {
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    const docRule = explicitRuntimeCaching.find((rule) => runMatcher(rule, docUrl, docReq));
    expect(docRule).toBeDefined();
    expect(docRule?.handler.constructor.name).toBe("NetworkOnly");
  });

  it("only caches static immutable Next.js assets (_next/static/**) and fonts/media", () => {
    const nextUrl = new URL("https://example.com/_next/static/chunks/main.js");
    const nextRule = explicitRuntimeCaching.find((rule) =>
      runMatcher(rule, nextUrl, new Request(nextUrl)),
    );

    expect(nextRule).toBeDefined();
    expect(nextRule?.handler.constructor.name).toBe("CacheFirst");

    const fontUrl = new URL("https://example.com/fonts/andika.woff2");
    const fontRule = explicitRuntimeCaching.find((rule) =>
      runMatcher(rule, fontUrl, new Request(fontUrl)),
    );

    expect(fontRule).toBeDefined();
    expect(fontRule?.handler.constructor.name).toBe("CacheFirst");
  });
});
