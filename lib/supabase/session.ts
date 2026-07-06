import { createSupabaseServerClient } from "./server";
import { cache } from "react";

/** Para usar en Server Components — no depende de window. */
export const getSupabaseServerUser = cache(async () => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
});

/** Para usar en Server Components — no depende de window. */
export async function getSupabaseServerUserId(): Promise<string | null> {
  const user = await getSupabaseServerUser();
  return user?.id ?? null;
}
