import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase.");
  return createClient<Database>(url, key);
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
