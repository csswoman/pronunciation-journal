import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { explicitRuntimeCaching, LEGACY_SENSITIVE_CACHES } from "./sw-runtime-caching";

declare global {
  interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<unknown>): void;
  }
  interface ExtendableMessageEvent extends ExtendableEvent {
    data: unknown;
  }
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    addEventListener(type: "activate" | "install", listener: (event: ExtendableEvent) => void): void;
    addEventListener(type: "message", listener: (event: ExtendableMessageEvent) => void): void;
    addEventListener(type: string, listener: (event: Event) => void): void;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: explicitRuntimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// Purge legacy caches on activation to clean up any previously cached pages or API responses
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) =>
            LEGACY_SENSITIVE_CACHES.some((legacy) => key.toLowerCase().includes(legacy.toLowerCase())),
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

// Listen for explicit cache clear commands (e.g. on logout or user switch)
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string } | undefined;
  if (data && (data.type === "CLEAR_USER_CACHES" || data.type === "AUTH_LOGOUT")) {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith("serwist-precache-") && !key.startsWith("static-"))
            .map((key) => caches.delete(key)),
        ),
      ),
    );
  }
});

serwist.addEventListeners();
