import {
  STARTER_ANGLES,
  buildFreeStarterPrompt,
  buildLearnStarterPrompt,
  buildReviewStarterPrompt,
  buildWorldStarterPrompt,
} from "@/lib/ai-prompts";
import { INTEREST_LABELS_ES } from "@/lib/users/interests";
import { topicDisplayLabel } from "@/lib/practice/topic-labels";
import { grammarTopicsForLevel } from "./syllabus-hints";
import type { CoachStarter, StarterContext, StarterId } from "./types";

/** A weak topic below this error rate is not worth interrupting the user for. */
const REVIEW_ERROR_THRESHOLD = 0.4;

/**
 * Picks one item from a pool by seed, skipping anything used recently.
 * Falls back to the plain seeded pick when everything has been used.
 */
function pickBySeed<T extends string>(pool: readonly T[], seed: number, recent: readonly string[]): T {
  const fresh = pool.filter((item) => !recent.includes(item));
  const from = fresh.length > 0 ? fresh : pool;
  return from[Math.abs(seed) % from.length];
}

function weakestTopic(ctx: StarterContext) {
  const topics = ctx.state?.grammar.weakTopics ?? [];
  const eligible = topics.filter((t) => t.errorRate >= REVIEW_ERROR_THRESHOLD);
  if (eligible.length === 0) return null;
  return eligible.reduce((a, b) => (a.errorRate >= b.errorRate ? a : b));
}

function worldSubject(ctx: StarterContext): { key: string; label: string; source: "interest" | "domain" } | null {
  if (ctx.interests.length > 0) {
    const key = pickBySeed(
      ctx.interests.map(String),
      ctx.seed,
      // Interests rotate on their own; recentAngles holds angles, not subjects.
      [],
    );
    return { key, label: INTEREST_LABELS_ES[key as keyof typeof INTEREST_LABELS_ES] ?? key, source: "interest" };
  }
  const domain = ctx.state?.domainProfile?.domains?.[0];
  if (domain) return { key: domain.label, label: domain.label, source: "domain" };
  return null;
}

const freeStarter: CoachStarter = {
  id: "free",
  isAvailable: () => true,
  build: () => ({
    id: "free",
    title: "Habla de lo que quieras",
    subtitle: "Tú empiezas",
    prompt: buildFreeStarterPrompt(),
    angle: "free",
  }),
};

const learnStarter: CoachStarter = {
  id: "learn",
  isAvailable: () => true,
  build: (ctx) => {
    const level = ctx.level;
    const avoidTopics = (ctx.state?.lastSessions ?? []).slice(0, 5).map((s) => s.topic);
    const angle = pickBySeed(STARTER_ANGLES.learn, ctx.seed, ctx.recentAngles);
    const syllabusTopics = grammarTopicsForLevel(level, avoidTopics, 8, ctx.seed);
    const nextTopicLabel = topicDisplayLabel(syllabusTopics[0]);
    return {
      id: "learn",
      title: "Enséñame algo nuevo",
      subtitle: nextTopicLabel ? `${nextTopicLabel} · nivel ${level}` : `Nivel ${level} · aún no visto`,
      prompt: buildLearnStarterPrompt({
        level,
        avoidTopics,
        angle,
        syllabusTopics,
      }),
      angle,
    };
  },
};

const reviewStarter: CoachStarter = {
  id: "review",
  isAvailable: (ctx) => weakestTopic(ctx) !== null,
  build: (ctx) => {
    const topic = weakestTopic(ctx);
    const focus = topic?.topic ?? "lo que fallaste";
    const focusLabel = topicDisplayLabel(topic?.topic) ?? "Lo que fallaste";
    const failCount = topic ? Math.round(topic.errorRate * topic.sampleCount) : 0;
    const angle = pickBySeed(STARTER_ANGLES.review, ctx.seed, ctx.recentAngles);
    return {
      id: "review",
      title: "Repasa lo que fallaste",
      subtitle: `${focusLabel} · ${failCount} errores`,
      prompt: `${buildReviewStarterPrompt({ focus, failCount })}\nApproach it ${angle}.`,
      angle,
    };
  },
};

const worldStarter: CoachStarter = {
  id: "world",
  isAvailable: (ctx) => worldSubject(ctx) !== null,
  build: (ctx) => {
    const subject = worldSubject(ctx);
    const key = subject?.key ?? "everyday life";
    const label = subject?.label ?? "tu día a día";
    const knownWords = (ctx.state?.vocabulary.savedWords ?? []).slice(0, 5).map((w) => w.word);
    const angle = pickBySeed(STARTER_ANGLES.world, ctx.seed, ctx.recentAngles);
    const subtitle =
      subject?.source === "domain" ? "Tu área de trabajo · conversación" : "Tu interés · conversación";
    return {
      id: "world",
      title: `Inglés de ${label}`,
      subtitle,
      prompt: buildWorldStarterPrompt({ interest: key, knownWords, angle }),
      angle,
    };
  },
};

export const STARTERS: readonly CoachStarter[] = [
  reviewStarter,
  learnStarter,
  worldStarter,
  freeStarter,
];

export function getStarter(id: StarterId): CoachStarter {
  const found = STARTERS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown starter: ${id}`);
  return found;
}
