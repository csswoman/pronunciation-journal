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

// Webpack HMR (Next `next dev --webpack`): clear our cache when this module is
// replaced so the next call builds a fresh client against live imports.
const hot =
  typeof import.meta !== "undefined"
    ? (
        import.meta as ImportMeta & {
          webpackHot?: { dispose: (cb: () => void) => void };
        }
      ).webpackHot
    : undefined;
hot?.dispose(() => {
  resetSupabaseBrowserClient();
});

/**
 * Cliente Supabase solo para el navegador (componentes "use client").
 * Usa createBrowserClient de @supabase/ssr para sincronizar cookies con el servidor.
 *
 * `isSingleton: false` — @supabase/ssr also caches globally; we own the
 * cache here so HMR dispose can actually drop the instance.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient solo puede usarse en el cliente.");
  }
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    browserClient = createBrowserClient<Database>(url, key, {
      isSingleton: false,
    });
  }
  return browserClient;
}
