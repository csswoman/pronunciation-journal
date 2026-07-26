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

const isDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "img-src 'self' https: data:",
              "media-src 'self' https: data:",
              // 'unsafe-eval' is required in dev for React Fast Refresh (HMR).
              // It is intentionally excluded from production builds.
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' https:",
            ].join("; "),
          },
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
    ],
  },
  webpack: (config, { isServer }) => {
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
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default process.env.NODE_ENV === "production"
  ? withSerwist(nextConfig)
  : nextConfig;
