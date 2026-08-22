/**
 * Clears runtime and personal caches when a user logs out or switches accounts.
 * Keeps static immutable precaches while evicting any dynamic or potentially
 * user-bearing cached responses.
 */
export async function clearClientCachesOnLogout(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith("serwist-precache-") && !key.startsWith("static-"))
          .map((key) => window.caches.delete(key)),
      );
    }

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "AUTH_LOGOUT" });
    }
  } catch {
    // Best-effort cleanup
  }
}
