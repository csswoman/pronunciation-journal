import { describe, it, expect } from "vitest";
import {
  parseRscManifest,
  extractRouteChunks,
  classifyChunkContent,
  assertBudget,
  calculateRouteGzip,
  findRouteExclusiveChunks,
} from "../analyze-bundle.mjs";

describe("analyze-bundle", () => {
  describe("parseRscManifest", () => {
    it("correctly parses valid RSC manifest code", () => {
      const sampleCode = `
        globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};
        globalThis.__RSC_MANIFEST["/test/page"] = {"moduleLoading":{"prefix":"","crossOrigin":"none"},"clientModules":{"mod-1":{"id":1,"chunks":["/_next/static/chunks/chunk-a.js"]}}};
      `;
      const parsed = parseRscManifest(sampleCode);
      expect(parsed).toBeDefined();
      expect(parsed?.clientModules["mod-1"]).toBeDefined();
      expect(parsed?.clientModules["mod-1"].chunks).toEqual([
        "/_next/static/chunks/chunk-a.js",
      ]);
    });

    it("returns null on malformed or empty manifest code", () => {
      expect(parseRscManifest("console.log('no manifest');")).toBeNull();
      expect(parseRscManifest("globalThis.__RSC_MANIFEST['x'] = { invalid json;")).toBeNull();
    });
  });

  describe("extractRouteChunks", () => {
    it("unions and dedupes all chunks from clientModules only (ignoring dynamic imports not in clientModules)", () => {
      const manifestData = {
        clientModules: {
          "component-a": {
            id: 1,
            chunks: [
              "/_next/static/chunks/shared.js",
              "/_next/static/chunks/a.js",
            ],
          },
          "component-b": {
            id: 2,
            chunks: [
              "/_next/static/chunks/shared.js",
              "/_next/static/chunks/b.js",
            ],
          },
        },
      };

      const chunks = extractRouteChunks(manifestData);
      expect(Array.from(chunks).sort()).toEqual([
        "/_next/static/chunks/a.js",
        "/_next/static/chunks/b.js",
        "/_next/static/chunks/shared.js",
      ]);
    });
  });

  describe("findRouteExclusiveChunks", () => {
    it("returns only chunks exclusive to the target route", () => {
      const routes = [
        {
          route: "(authenticated)/practice/review",
          chunks: ["chunk-shared-1", "chunk-shared-2", "chunk-exclusive-review"],
        },
        {
          route: "(authenticated)/daily",
          chunks: ["chunk-shared-1", "chunk-exclusive-daily"],
        },
        {
          route: "(authenticated)/words",
          chunks: ["chunk-shared-2", "chunk-exclusive-words"],
        },
      ];

      const exclusive = findRouteExclusiveChunks(
        "(authenticated)/practice/review",
        routes,
      );
      expect(exclusive).toEqual(["chunk-exclusive-review"]);
    });

    it("returns empty array when route is not found", () => {
      expect(findRouteExclusiveChunks("non-existent", [])).toEqual([]);
    });
  });

  describe("calculateRouteGzip", () => {
    it("computes total gzip KB across unique chunks of a route", () => {
      const chunks = new Set([
        "/_next/static/chunks/a.js",
        "/_next/static/chunks/b.js",
      ]);
      const sizes: Record<string, number> = {
        "/_next/static/chunks/a.js": 1024,
        "/_next/static/chunks/b.js": 2048,
      };

      const totalKb = calculateRouteGzip(chunks, (url) => sizes[url] ?? 0);
      expect(totalKb).toBe(3); // (1024 + 2048) / 1024 = 3.0 KB
    });
  });

  describe("classifyChunkContent", () => {
    const probes = [
      { label: "cmu-pronouncing-dictionary", probe: 'aaberg:"AA1 B ER0 G"' },
    ];

    it("identifies deferred chunk by probe content", () => {
      const content = '... some vendor code ... aaberg:"AA1 B ER0 G" ... more code';
      expect(classifyChunkContent(content, probes)).toBe("cmu-pronouncing-dictionary");
    });

    it("returns null if probe does not match", () => {
      const content = "function hello() { return 'world'; }";
      expect(classifyChunkContent(content, probes)).toBeNull();
    });
  });

  describe("assertBudget", () => {
    it("passes when all configured limits are within threshold", () => {
      const summary = {
        metrics: {
          rootMainGzipKB: 160,
          maxRouteGzipKB: 500,
          publishedChunksGzipKB: 2400,
        },
      };
      const budget = {
        tolerancePct: 10,
        limitsKb: {
          rootMainGzipKB: 168,
          maxRouteGzipKB: 575,
        },
      };

      expect(() => assertBudget(summary, budget, { exitOnError: false })).not.toThrow();
    });

    it("throws when a metric in limitsKb exceeds budget including tolerance", () => {
      const summary = {
        metrics: {
          rootMainGzipKB: 200,
          maxRouteGzipKB: 500,
        },
      };
      const budget = {
        tolerancePct: 10,
        limitsKb: {
          rootMainGzipKB: 168, // max: 184.8
          maxRouteGzipKB: 575,
        },
      };

      expect(() => assertBudget(summary, budget, { exitOnError: false })).toThrow(
        /rootMainGzipKB: 200 KB gzip exceeds budget 168 KB/,
      );
    });

    it("does not fail for metrics not present in limitsKb (diagnostic metrics)", () => {
      const summary = {
        metrics: {
          rootMainGzipKB: 150,
          maxRouteGzipKB: 400,
          publishedChunksGzipKB: 3000,
        },
      };
      const budget = {
        tolerancePct: 10,
        limitsKb: {
          rootMainGzipKB: 168,
          maxRouteGzipKB: 575,
        },
      };

      expect(() => assertBudget(summary, budget, { exitOnError: false })).not.toThrow();
    });

    it("throws when publishedChunksGzipKB is in limitsKb and exceeds budget", () => {
      const summary = {
        metrics: {
          rootMainGzipKB: 150,
          maxRouteGzipKB: 300,
          publishedChunksGzipKB: 2900,
        },
      };
      const budget = {
        tolerancePct: 10,
        limitsKb: {
          rootMainGzipKB: 168,
          maxRouteGzipKB: 575,
          publishedChunksGzipKB: 2550, // max: 2805
        },
      };

      expect(() => assertBudget(summary, budget, { exitOnError: false })).toThrow(
        /publishedChunksGzipKB: 2900 KB gzip exceeds budget 2550 KB/,
      );
    });
  });
});
