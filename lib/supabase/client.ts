import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Drop the cached browser client.
 *
 * Needed after Fast Refresh / HMR: a stale singleton can close over disposed
 * webpack module bindings and then fail on every `.from()` with opaque errors
 * like `Cannot read properties of undefined (reading 'M_ID')`.
 */
export function resetSupabaseBrowserClient(): void {
  browserClient = null;
}

// Must be a direct `import.meta.webpackHot` member access. Webpack's parser
// does not rewrite `(import.meta as T).webpackHot` and compiled it to
// `undefined`, so dispose never ran.
if (import.meta.webpackHot) {
  import.meta.webpackHot.dispose(() => {
    resetSupabaseBrowserClient();
  });
}

function createFreshBrowserClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  const localFetch = createLocalSupabaseFetch(url);
  return createBrowserClient<Database>(url, key, {
    isSingleton: false,
    ...(localFetch ? { global: { fetch: localFetch } } : {}),
  });
}

function createLocalSupabaseFetch(supabaseUrl: string): typeof fetch | null {
  if (process.env.NODE_ENV !== "development") return null;

  let upstreamOrigin: string;
  try {
    const parsed = new URL(supabaseUrl);
    const isLoopback =
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "[::1]");
    if (!isLoopback) return null;
    upstreamOrigin = parsed.origin;
  } catch {
    return null;
  }

  const browserOrigin = window.location.origin;
  const browserFetch = globalThis.fetch.bind(globalThis);
  return (input, init) => {
    const requestUrl = input instanceof Request ? input.url : String(input);
    let parsedRequestUrl: URL;
    try {
      parsedRequestUrl = new URL(requestUrl);
    } catch {
      return browserFetch(input, init);
    }

    if (parsedRequestUrl.origin !== upstreamOrigin) {
      return browserFetch(input, init);
    }

    const browserRequestUrl = new URL(
      `/__supabase-local${parsedRequestUrl.pathname}${parsedRequestUrl.search}`,
      browserOrigin,
    );
    const proxiedRequest =
      input instanceof Request ? new Request(browserRequestUrl, input) : browserRequestUrl;
    return browserFetch(proxiedRequest, init);
  };
}

/**
 * Cliente Supabase solo para el navegador (componentes "use client").
 * Usa createBrowserClient de @supabase/ssr para sincronizar cookies con el servidor.
 *
 * `isSingleton: false` — @supabase/ssr also caches globally; we own the
 * cache here so HMR dispose can actually drop the instance.
 *
 * Always reuse one instance in this module. Creating a client per call
 * spawns multiple GoTrueClient objects on the same auth storage key.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient solo puede usarse en el cliente.");
  }
  if (!browserClient) {
    browserClient = createFreshBrowserClient();
  }
  return browserClient;
}
