import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STREAK_TIMEZONE, toLocalDateString } from "@/lib/daily/streak";
import { getTodaysMiniLesson } from "@/lib/content/lessons";
import {
  DEFAULT_DAILY_GOAL_MINUTES,
  type DailyGoalProgress,
  type WeakestPhonemeHome,
  type DailyPlanPreview,
  type DailyStepPreview,
  type SoundDueHome,
} from "@/lib/home/constants";

/**
 * Debe coincidir con DAILY_PLAN_STEP_COUNT en lib/practice/daily-plan.ts.
 * Se redefine aquí porque ese módulo importa el cliente de navegador de
 * Supabase y no debe entrar en el grafo de un Server Component.
 */
const DAILY_PLAN_STEP_COUNT = 5;

export {
  DEFAULT_DAILY_GOAL_MINUTES,
  type DailyGoalProgress,
  type WeakestPhonemeHome,
  type DailyPlanPreview,
  type DailyStepPreview,
  type SoundDueHome,
};

/** Fallback per answer when `time_ms` is missing (~90 s). */
const FALLBACK_ANSWER_MS = 90_000;

/**
 * Sums `time_ms` from answer_history for the current calendar day (America/Lima).
 */
export async function getTodayPracticeGoal(userId: string): Promise<DailyGoalProgress> {
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();
  const todayStr = toLocalDateString(nowIso, STREAK_TIMEZONE);

  const since = new Date();
  since.setDate(since.getDate() - 1);

  const { data, error } = await supabase
    .from("answer_history")
    .select("answered_at, time_ms")
    .eq("user_id", userId)
    .gte("answered_at", since.toISOString())
    .not("answered_at", "is", null);

  if (error) throw error;

  let totalMs = 0;
  for (const row of data ?? []) {
    const answeredAt = row.answered_at as string;
    if (toLocalDateString(answeredAt, STREAK_TIMEZONE) !== todayStr) continue;
    totalMs += row.time_ms ?? FALLBACK_ANSWER_MS;
  }

  const minutesDone = Math.round(totalMs / 60_000);
  const goalMinutes = DEFAULT_DAILY_GOAL_MINUTES;
  const percent =
    goalMinutes > 0 ? Math.min(100, Math.round((minutesDone / goalMinutes) * 100)) : 0;

  return { minutesDone, goalMinutes, percent };
}

/** Lowest-accuracy phoneme with at least 5 attempts, or null if none yet. */
export async function getWeakestPhonemeForHome(
  userId: string,
): Promise<WeakestPhonemeHome | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_sound_progress")
    .select("total_attempts, correct_answers, sounds(ipa, type, category)")
    .eq("user_id", userId)
    .gt("total_attempts", 0)
    .neq("status", "locked");

  if (error) throw error;

  const ranked = (data ?? [])
    .filter((r) => (r.total_attempts ?? 0) >= 5)
    .map((r) => {
      const attempts = r.total_attempts ?? 0;
      const correct = r.correct_answers ?? 0;
      const sound = r.sounds as { ipa: string; type: string | null; category: string | null } | null;
      return {
        ipa: sound?.ipa ?? "?",
        accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
        totalAttempts: attempts,
        label: sound?.type ?? sound?.category ?? null,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  return ranked[0] ?? null;
}

/** Día del año (1-366), para rotar la selección de contenido por día. */
function dayOfYear(now = new Date()): number {
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Resumen ligero de la diaria para el home — refleja la MISMA composición que
 * `buildDailyPlan` (lib/practice/daily-plan.ts) pero sin generar ejercicios.
 * Mantener ambas en sincronía: prioridad word_review → phoneme_focus →
 * minimal_pairs → listening → concept, con relleno de sonidos del seed.
 */
export async function getDailyPlanPreview(userId: string): Promise<DailyPlanPreview> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString();

  // 1. ¿Hay palabras por repasar? (due o nuevas)
  const { count: dueCount } = await supabase
    .from("word_bank")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "ready")
    .or(`srs_status.eq.new,next_review_at.lte.${today}`);
  const hasWordBank = (dueCount ?? 0) > 0;

  // 2. Sonido protagonista: el más débil con progreso, o uno fácil del seed.
  const { data: progressRows } = await supabase
    .from("user_sound_progress")
    .select("total_attempts, correct_answers, sounds(id, ipa, example, difficulty)")
    .eq("user_id", userId)
    .neq("status", "locked")
    .neq("status", "mastered")
    .gt("total_attempts", 0);

  type SoundLite = { id: number; ipa: string; example: string | null; difficulty: number | null };

  const ranked = (progressRows ?? [])
    .map((r) => ({
      acc: (r.total_attempts ?? 0) > 0 ? (r.correct_answers ?? 0) / (r.total_attempts ?? 1) : 1,
      sound: r.sounds as unknown as SoundLite | null,
    }))
    .filter((r) => r.sound != null)
    .sort((a, b) => a.acc - b.acc);
  const hasProgress = ranked.length > 0;

  let primary: SoundLite | null = ranked[0]?.sound ?? null;
  if (!primary) {
    const { data: sounds } = await supabase
      .from("sounds")
      .select("id, ipa, example, difficulty")
      .order("difficulty", { ascending: true })
      .limit(10);
    const pool = (sounds ?? []) as SoundLite[];
    const window = Math.max(1, Math.ceil(pool.length / 2));
    primary = pool.length > 0 ? pool[dayOfYear() % window] : null;
  }

  const ipa = primary?.ipa ?? "/iː/";

  const steps: DailyStepPreview[] = [];

  if (hasWordBank) {
    steps.push({
      id: "word_review",
      title: "Repaso de palabras",
      subtitle: "Vocabulario de tu léxico con SRS",
      icon: "BookMarked",
    });
  }

  steps.push({
    id: "phoneme_focus",
    title: `Sonido ${ipa}`,
    subtitle: hasProgress ? "Tu sonido a reforzar hoy" : "Empieza por un sonido clave",
    icon: "Waves",
  });
  steps.push({
    id: "minimal_pairs",
    title: "Pares mínimos",
    subtitle: `Distingue ${ipa} de sonidos parecidos`,
    icon: "GitCompareArrows",
  });
  steps.push({
    id: "listening",
    title: "Escucha y escribe",
    subtitle: "Dictado de palabras nuevas",
    icon: "Headphones",
  });

  // Paso de concepto del día (lectura ligera).
  try {
    const lesson = await getTodaysMiniLesson();
    if (lesson) {
      steps.push({
        id: `concept:${lesson.slug}`,
        title: lesson.title,
        subtitle: lesson.subtitle,
        icon: "GraduationCap",
      });
    }
  } catch {
    // sin concepto, el plan igual tiene pasos suficientes
  }

  const trimmed = steps.slice(0, DAILY_PLAN_STEP_COUNT);

  return {
    steps: trimmed,
    isNewUser: !hasWordBank && !hasProgress,
    estMinutes: Math.max(10, trimmed.length * 2),
  };
}

const SOUNDS_DUE_PREVIEW_LIMIT = 3;

/** Sonidos con next_review vencido, ordenados por más urgente primero. */
export async function getSoundsDueForHome(userId: string): Promise<SoundDueHome[]> {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("user_sound_progress")
    .select("sound_id, total_attempts, correct_answers, next_review, sounds(ipa, example)")
    .eq("user_id", userId)
    .neq("status", "locked")
    .neq("status", "mastered")
    .lte("next_review", now)
    .order("next_review", { ascending: true })
    .limit(SOUNDS_DUE_PREVIEW_LIMIT);

  if (error) throw error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (data ?? []).map((r) => {
    const sound = r.sounds as { ipa: string; example: string | null } | null;
    const attempts = r.total_attempts ?? 0;
    const correct = r.correct_answers ?? 0;
    const dueDate = r.next_review ? new Date(r.next_review) : today;
    dueDate.setHours(0, 0, 0, 0);
    const daysOverdue = Math.max(0, Math.round((today.getTime() - dueDate.getTime()) / 86_400_000));

    return {
      soundId: r.sound_id,
      ipa: sound?.ipa ?? "?",
      example: sound?.example ?? null,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      daysOverdue,
    };
  });
}
