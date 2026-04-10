"use server";

/**
 * Server Actions for syncing local attempts to Supabase.
 *
 * These are passed as `options.serverAction` to useJournalStore.finishAttempt().
 * They run on the server (Next.js Server Actions) so they can safely use the
 * Supabase service client without leaking credentials to the browser.
 *
 * Usage in a component:
 *
 *   import { syncAttemptToSupabase } from "@/app/actions/attempts";
 *   const { finishAttempt } = useJournalStore();
 *
 *   await finishAttempt(word, result, xp, {
 *     serverAction: syncAttemptToSupabase,
 *   });
 */

import { createClient } from "@supabase/supabase-js";
import type { AttemptPayload } from "@/store/useJournalStore";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

/**
 * Persist a pronunciation attempt to Supabase answer_history.
 * Silently no-ops if the user is not authenticated.
 */
export async function syncAttemptToSupabase(payload: AttemptPayload): Promise<void> {
  const supabase = getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Note: getUser() with anon key checks the session cookie forwarded by Next.js.

  if (!user) return;

  // Map to the answer_history schema.
  // exercise_type_id = 1 is assumed to be "pronunciation" — adjust to your seed data.
  await supabase.from("answer_history").insert({
    user_id: user.id,
    target_word: payload.word,
    user_answer: payload.transcript,
    is_correct: payload.accuracy >= 70,
    time_ms: null,
    answered_at: payload.timestamp,
    exercise_payload: {
      accuracy: payload.accuracy,
      lessonId: payload.lessonId,
    },
  });
}
