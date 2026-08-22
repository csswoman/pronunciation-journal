import { CacheFirst, ExpirationPlugin, NetworkOnly, StaleWhileRevalidate, type RuntimeCaching } from "serwist";

export const STATIC_CACHE_NAMES = {
  nextStatic: "static-next-assets",
  fonts: "static-fonts",
  media: "static-media-assets",
} as const;

export const LEGACY_SENSITIVE_CACHES = [
  "pages-cache",
  "rsc-cache",
  "api-cache",
  "default-cache",
  "next-data",
  "other-cache",
  "start-url",
  "user-cache",
] as const;

/**
 * Strict runtime caching configuration for Serwist.
 * Guarantees that:
 * 1. All API routes (/api/**) are strictly NetworkOnly.
 * 2. RSC streams and Next data payloads are strictly NetworkOnly.
 * 3. Document / HTML navigations are NetworkOnly (falling back to /offline if network fails).
 * 4. Only static, immutable, public assets are cached in isolated caches.
 */
export const explicitRuntimeCaching: RuntimeCaching[] = [
  // 1. API routes: NEVER cache. Always NetworkOnly.
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },

  // 2. React Server Component (RSC) requests and Next.js data: NEVER cache.
  {
    matcher: ({ request, url }) => {
      const isRscHeader = request.headers.get("RSC") === "1";
      const isRscQuery = url.searchParams.has("_rsc");
      const isRscAccept = request.headers.get("accept")?.includes("text/x-component");
      return Boolean(isRscHeader || isRscQuery || isRscAccept);
    },
    handler: new NetworkOnly(),
  },

  // 3. Document / HTML pages: NEVER cache dynamically. NetworkOnly.
  {
    matcher: ({ request }) =>
      request.destination === "document" ||
      Boolean(request.headers.get("accept")?.includes("text/html")),
    handler: new NetworkOnly(),
  },

  // 4. Next.js static chunks and CSS (_next/static/**): CacheFirst with expiration.
  {
    matcher: ({ url, sameOrigin }) =>
      Boolean(sameOrigin && url.pathname.startsWith("/_next/static/")),
    handler: new CacheFirst({
      cacheName: STATIC_CACHE_NAMES.nextStatic,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    }),
  },

  // 5. Fonts (static fonts under /fonts/ or font file extensions): CacheFirst with expiration.
  {
    matcher: ({ url, sameOrigin }) =>
      Boolean(
        sameOrigin &&
          (url.pathname.startsWith("/fonts/") ||
            /\.(?:woff|woff2|eot|ttf|otf)$/i.test(url.pathname)),
      ),
    handler: new CacheFirst({
      cacheName: STATIC_CACHE_NAMES.fonts,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        }),
      ],
    }),
  },

  // 6. Public static media (images and audio files in public folder): StaleWhileRevalidate.
  {
    matcher: ({ url, sameOrigin }) =>
      Boolean(
        sameOrigin &&
          /\.(?:png|jpg|jpeg|svg|webp|gif|ico|ogg|mp3)$/i.test(url.pathname) &&
          !url.pathname.startsWith("/api/"),
      ),
    handler: new StaleWhileRevalidate({
      cacheName: STATIC_CACHE_NAMES.media,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 120,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        }),
      ],
    }),
  },
];
