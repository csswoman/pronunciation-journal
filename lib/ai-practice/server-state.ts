import "server-only";

import { createUserScopedClient } from "@/lib/api/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserLearningState } from "./learning-state";

/**
 * Server-side, best-effort fetch of the synced learning-state snapshot for a
 * user. Reads the same `user_learning_state` row that the client keeps in
 * sync via the outbox (see `lib/ai-practice/queries.ts`), so this is a cache
 * of client-computed state — not authoritative, and never security-sensitive
 * (it only nudges which exercise topic gets suggested next).
 *
 * RLS-scoped: uses the bearer token when present, otherwise the cookie
 * session. Returns null on any error, missing row, or missing table so
 * callers can fall back to the static prompt exactly as before.
 */
export async function fetchServerLearningState(
  userId: string,
  accessToken: string | null,
): Promise<UserLearningState | null> {
  try {
    const supabase = accessToken
      ? createUserScopedClient(accessToken)
      : await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("user_learning_state")
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data.state as unknown as UserLearningState;
  } catch {
    return null;
  }
}
