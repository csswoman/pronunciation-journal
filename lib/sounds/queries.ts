import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { enqueue } from "@/lib/sync/sync-manager";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import type { Sound, UserContrastProgress } from "@/lib/phoneme-practice/types";
import type { SessionResult } from "@/lib/practice/types";
import { rankWeakestSounds } from "@/lib/phoneme-practice/mastery-pct";

const USER_CONTRAST_PROGRESS_COLUMNS =
  "id,user_id,contrast_id,ease_factor,interval_days,next_review,last_seen,total_attempts,correct_answers,streak,mastery_pct";

export {
  getAllSounds,
  getSoundById,
  getWordsBySound,
  getAllWords,
  getMinimalPairs,
  getAllContrastProgress,
  getContrastProgress,
  getContrastsForToday,
} from "@/lib/phoneme-practice/queries";

/** All contrast progress rows for a user, ordered by contrast_id. */
export async function getUserContrastProgress(
  userId: string,
): Promise<UserContrastProgress[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("user_contrast_progress")
    .select(USER_CONTRAST_PROGRESS_COLUMNS)
    .eq("user_id", userId)
    .order("contrast_id", { ascending: true });

  if (error) throw error;
  return ((data as unknown) as UserContrastProgress[] | null) ?? [];
}

/** Sound with the weakest dynamic mastery for the user, or null when no progress. */
export async function getWeakestSoundByProgress(userId: string): Promise<Sound | null> {
  const progress = await getUserContrastProgress(userId);
  const weakest = rankWeakestSounds(progress, { minAttempts: 1, limit: 1 })[0];
  if (!weakest) return null;

  const supabase = getSupabaseBrowserClient();
  const ipaKey = `/${weakest.ipa}/`;

  const { data: soundRows } = await supabase
    .from("sounds")
    .select("id, ipa, example, category, type, difficulty")
    .eq("ipa", ipaKey)
    .limit(1);

  return (soundRows?.[0] as Sound | undefined) ?? null;
}

/** Sounds derived from contrasts due for SRS review today (up to 2 unique IPAs). */
/** All sounds the user has practiced (regardless of due date), most-recently-updated first. */
export async function getAllPracticedSounds(userId: string, limit = 4): Promise<Sound[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("user_contrast_progress")
    .select("contrast_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit * 2);

  if (error || !data || data.length === 0) return [];

  const seen = new Set<string>();
  const ipas: string[] = [];
  for (const r of data) {
    const [ipaA, ipaB] = r.contrast_id.split("|");
    for (const ipa of [ipaA, ipaB]) {
      if (!seen.has(ipa)) {
        seen.add(ipa);
        ipas.push(ipa);
      }
      if (ipas.length >= limit * 2) break;
    }
    if (ipas.length >= limit * 2) break;
  }

  if (ipas.length === 0) return [];

  const { data: soundRows } = await supabase
    .from("sounds")
    .select("id, ipa, example, category, type, difficulty")
    .in("ipa", ipas.slice(0, limit * 2));

  return (soundRows ?? []) as Sound[];
}

export async function getDueSoundsForReview(userId: string): Promise<Sound[]> {
  const supabase = getSupabaseBrowserClient();
  const today = new Date().toISOString();

  const { data, error } = await supabase
    .from("user_contrast_progress")
    .select("contrast_id, next_review")
    .eq("user_id", userId)
    .or(`next_review.lte.${today},next_review.is.null`)
    .order("next_review", { ascending: true })
    .limit(4);

  if (error) return [];

  const seen = new Set<string>();
  const ipas: string[] = [];
  for (const r of data ?? []) {
    const [ipaA, ipaB] = r.contrast_id.split("|");
    for (const ipa of [ipaA, ipaB]) {
      if (!seen.has(ipa)) {
        seen.add(ipa);
        ipas.push(ipa);
      }
      if (ipas.length >= 2) break;
    }
    if (ipas.length >= 2) break;
  }

  if (ipas.length === 0) return [];

  const { data: soundRows } = await supabase
    .from("sounds")
    .select("id, ipa, example, category, type, difficulty")
    .in("ipa", ipas);

  return (soundRows ?? []) as Sound[];
}

export async function recordIntonationAttempt(
  userId: string,
  input: {
    sentenceId: string;
    pattern: string;
    text: string;
    score: number;
    matched: boolean;
    timeMs: number;
  },
): Promise<void> {
  const answerRow = {
    id: crypto.randomUUID(),
    user_id: userId,
    sound_id: null,
    exercise_type_id: 18, // sentence_context
    is_correct: input.matched,
    user_answer: `contour_score:${Math.round(input.score)}`,
    target_word: input.text,
    time_ms: input.timeMs,
    exercise_payload: {
      pattern: input.pattern,
      sentenceId: input.sentenceId,
      score: input.score,
      contourMatched: input.matched,
    },
    context: 'sound_lab' as const,
    topic: 'prosody-intonation',
  };

  await enqueue(userId, 'answer_history', 'upsert', answerRow as Record<string, unknown>, undefined, 'id');
  await recordActivitySession(userId, {
    practiceContext: 'sound_lab',
    source: 'sound_lab',
    sessionResult: {
      results: [
        {
          exerciseId: `intonation-${input.sentenceId}`,
          slug: 'sentence_context',
          exerciseTypeId: 18,
          contentId: `intonation:${input.sentenceId}`,
          context: 'sound_lab',
          isCorrect: input.matched,
          score: input.score,
          timeMs: input.timeMs,
          userAnswer: `contour_score:${Math.round(input.score)}`,
          completedAt: new Date(),
        },
      ],
      accuracy: input.matched ? 100 : 0,
      totalTimeMs: input.timeMs,
      bySlug: {} as SessionResult['bySlug'],
    },
    metadata: { dailyTargetId: `prosody.intonation.${input.pattern}` },
  });
}

export async function recordConnectedSpeechAttempt(
  userId: string,
  input: {
    phraseId: string;
    phrase: string;
    category: string;
    transcript: string;
    isCorrect: boolean;
    timeMs: number;
  },
): Promise<void> {
  const attemptId = `cs_${input.phraseId}_${Date.now()}`;
  const targetId = input.category === 'linking-cv' ? 'connected.linking' : `connected.reduction.${input.category}`;

  const answerRow = {
    id: attemptId,
    user_id: userId,
    exercise_type_id: 23,
    is_correct: input.isCorrect,
    score: input.isCorrect ? 100 : 50,
    user_answer: input.transcript,
    target_word: input.phrase,
    time_ms: input.timeMs,
    exercise_payload: { category: input.category, phraseId: input.phraseId, transcript: input.transcript },
    context: 'sound_lab' as const,
    topic: 'connected-speech',
  };

  await enqueue(userId, 'answer_history', 'upsert', answerRow as Record<string, unknown>, undefined, 'id');
  await recordActivitySession(userId, {
    practiceContext: 'sound_lab',
    source: 'sound_lab',
    sessionResult: {
      results: [
        {
          exerciseId: `cs-${input.phraseId}`,
          slug: 'cs_shadow_phrase',
          exerciseTypeId: 23,
          contentId: `connected_speech:${input.phraseId}`,
          context: 'sound_lab',
          isCorrect: input.isCorrect,
          score: input.isCorrect ? 100 : 50,
          timeMs: input.timeMs,
          userAnswer: input.transcript,
          completedAt: new Date(),
        },
      ],
      accuracy: input.isCorrect ? 100 : 0,
      totalTimeMs: input.timeMs,
      bySlug: {} as SessionResult['bySlug'],
    },
    metadata: { dailyTargetId: targetId },
  });
}
