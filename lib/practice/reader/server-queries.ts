// Planned structure:
// <ReaderServerQueries>
//   getPassageAudioServer   — fetches passage text and existing audio_url for a passage
//   updatePassageAudioServer— updates audio_url on reader_passages row
// </ReaderServerQueries>

import { createSupabaseServerClient } from "@/lib/supabase/server";

const TABLE = "reader_passages";

export interface PassageAudioRecord {
  id: string;
  userId: string;
  passage: string;
  audioUrl: string | null;
}

/**
 * Server-only: retrieves passage and audio URL for the given user.
 */
export async function getPassageAudioServer(
  passageId: string,
  userId: string
): Promise<PassageAudioRecord | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, user_id, passage, audio_url")
    .eq("id", passageId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    passage: data.passage,
    audioUrl: data.audio_url ?? null,
  };
}

/**
 * Server-only: updates the audio_url on the user's reader_passages record.
 */
export async function updatePassageAudioServer(
  passageId: string,
  userId: string,
  audioUrl: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ audio_url: audioUrl })
    .eq("id", passageId)
    .eq("user_id", userId);

  if (error) throw error;
}
