import { getSupabaseBrowserClient } from "./client";

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
