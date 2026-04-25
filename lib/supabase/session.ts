import { createClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";
import type { Database } from "./types";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase.");
  return createClient<Database>(url, key);
}

/**
 * Exige que ya exista sesión (email o invitado vía la pantalla de acceso).
 * La sesión anónima ya no se crea sola aquí.
 */
export async function ensureSupabaseSession(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return;

  throw new Error(
    "No hay sesión activa. Inicia sesión o entra como invitado desde la pantalla de acceso."
  );
}

export async function getSupabaseUserId(): Promise<string> {
  await ensureSupabaseSession();
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("No hay usuario de Supabase autenticado.");
  }
  return user.id;
}

/** Para usar en Server Components — no depende de window. */
export async function getSupabaseServerUserId(): Promise<string | null> {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
