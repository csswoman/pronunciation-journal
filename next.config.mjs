import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import withSerwistInit from "@serwist/next";

const __dirname = dirname(fileURLToPath(import.meta.url));

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  exclude: [
    /^\/api\/gemini\//,
    /^\/api\/auth\//,
    /^\/practice\/sounds\//,
  ],
});

/**
 * Next injects `polyfill-module` for all browsers. Those polyfills target
 * browsers older than Next 16's supported set; alias them out so modern
 * clients do not download Legacy JavaScript flagged by Lighthouse.
 * @see https://github.com/vercel/next.js/issues/86785
 */
const emptyNextPolyfill = "./lib/empty-next-polyfill-module.js";
const nextPolyfillModuleIds = [
  "../build/polyfills/polyfill-module",
  "next/dist/build/polyfills/polyfill-module",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: Object.fromEntries(
      nextPolyfillModuleIds.map((id) => [id, emptyNextPolyfill]),
    ),
    rules: {
      // Illustrations come from the koboyo library (koboyo.com/icons), which
      // ships every icon monochrome with fill="currentColor" already — so
      // SVGR only needs to wrap them as components, with no color rewriting.
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              titleProp: false,
            },
          },
        ],
        as: "*.js",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Origin-Agent-Cluster", value: "?1" },
          {
            key: "Permissions-Policy",
            // Pronunciation and spoken-production flows require same-origin
            // microphone capture. Keep camera and geolocation disabled.
            value: "camera=(), microphone=(self), geolocation=()",
          },
        ],
      },
      {
        // Next's manifest.ts file-convention loader hardcodes
        // `max-age=0, must-revalidate` on the generated route, forcing a
        // revalidation round-trip on every navigation even though the
        // content only changes at build time. Lighthouse flagged this
        // request sitting on the critical path (network-dependency-tree
        // audit). Override with a long-lived cache since a new deploy
        // ships a new build and busts any stale client copy anyway.
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy PWA start_url; home lives at `/` (route group, not `/home`).
      { source: "/home", destination: "/", permanent: true },
      { source: "/words", destination: "/dictionary", permanent: true },
      { source: "/lexicon", destination: "/dictionary", permanent: true },
      { source: "/lexicon/:id", destination: "/dictionary/:id", permanent: true },
      {
        source: "/lexicon/:id/practice",
        destination: "/dictionary/:id/practice",
        permanent: true,
      },
      { source: "/courses/mini-lessons", destination: "/mini-lessons", permanent: true },
      {
        source: "/courses/mini-lessons/:slug",
        destination: "/mini-lessons/:slug",
        permanent: true,
      },
      {
        source: "/courses/library/:slug",
        destination: "/courses",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // `false` → empty module (webpack). Turbopack needs a real file (above).
    config.resolve.alias = {
      ...config.resolve.alias,
      ...Object.fromEntries(nextPolyfillModuleIds.map((id) => [id, false])),
    };
    // Keep `*.svg` imports as React components under webpack too — the
    // turbopack.rules entry above only applies to the turbopack pipeline,
    // so without this an `import X from "*.svg"` yields an object (not a
    // component) and rendering it throws "Element type is invalid".
    // Next ships its own `*.svg` asset rule; scope it to `?url` imports and
    // hand everything else to SVGR, otherwise the asset loader wins and the
    // import resolves to an object instead of a component.
    // Next's app-router metadata loader owns `app/icon.svg` /
    // `app/apple-icon.svg` — never route those through SVGR. Only our own
    // illustration imports under `components/illustrations` become React
    // components; everything else keeps Next's default handling.
    const illustrationsDir = join(__dirname, "components", "illustrations");
    for (const rule of config.module.rules) {
      if (!rule || typeof rule !== "object" || !Array.isArray(rule.oneOf)) continue;
      for (const one of rule.oneOf) {
        if (one?.test instanceof RegExp && one.test.test(".svg")) {
          one.exclude = Array.isArray(one.exclude)
            ? [...one.exclude, illustrationsDir]
            : one.exclude
              ? [one.exclude, illustrationsDir]
              : [illustrationsDir];
        }
      }
    }
    config.module.rules.unshift({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      include: [illustrationsDir],
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            titleProp: false,
          },
        },
      ],
    });
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  experimental: {
    optimizePackageImports: ["@tabler/icons-react"],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default process.env.NODE_ENV === "production"
  ? withSerwist(nextConfig)
  : nextConfig;
