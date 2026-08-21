import withSerwistInit from "@serwist/next";

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
