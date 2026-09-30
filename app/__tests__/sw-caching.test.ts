import { afterEach, describe, expect, it, vi } from "vitest";
import { OfflineDownloadsFirst, explicitRuntimeCaching } from "../sw-runtime-caching";

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

  describe("offline downloads for audio", () => {
    afterEach(() => vi.unstubAllGlobals());

    const audioUrl = new URL("https://example.com/sounds/Close%20Front%20Unrounded%20Vowel.ogg");
    const audioRule = () =>
      explicitRuntimeCaching.find((rule) => runMatcher(rule, audioUrl, new Request(audioUrl)));

    function stubCaches(entries: Record<string, Response | undefined>) {
      vi.stubGlobal("caches", {
        keys: async () => Object.keys(entries),
        open: async (name: string) => ({ match: async () => entries[name]?.clone() }),
      });
    }

    it("routes /sounds/ audio through the offline-downloads-first handler", () => {
      expect(audioRule()?.handler.constructor.name).toBe("OfflineDownloadsFirst");
    });

    it("serves audio from a CEFR pack cache without touching the fallback", async () => {
      stubCaches({ "offline-pack-A1-v1-x": new Response("pack-audio"), "unrelated-cache": new Response("nope") });
      const fallback = { handle: vi.fn() };
      const handler = new OfflineDownloadsFirst(fallback);

      const res = await handler.handle({ request: new Request(audioUrl), url: audioUrl, event: {} as never });

      expect(await res.text()).toBe("pack-audio");
      expect(fallback.handle).not.toHaveBeenCalled();
    });

    it("ignores caches that were not filled by explicit downloads", async () => {
      stubCaches({ "unrelated-cache": new Response("nope") });
      const fallback = { handle: vi.fn(async () => new Response("network")) };
      const handler = new OfflineDownloadsFirst(fallback);

      const res = await handler.handle({ request: new Request(audioUrl), url: audioUrl, event: {} as never });

      expect(await res.text()).toBe("network");
    });
  });
});
