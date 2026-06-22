import { createSupabaseServerClient } from "./server";

/** Para usar en Server Components — no depende de window. */
export async function getSupabaseServerUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
