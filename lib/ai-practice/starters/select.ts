import { AI_COACH_SHORTCUT_PROMPTS, buildPronunciationStarterPrompt } from "@/lib/ai-prompts";
import { STARTERS } from "./registry";
import { soundLabelsForLevel } from "./syllabus-hints";
import type { ResolvedStarter, StarterContext } from "./types";

/** The chat home shows four rows; free always occupies the last one. */
const SLOTS = 4;

/**
 * Shortcuts shown when there is not enough signal for dynamic starters — the
 * guest / no-history case. Pronunciation is level-scoped so a first-time A1
 * learner is offered easy sounds, not a generic advanced list.
 */
function staticPadding(ctx: StarterContext): ResolvedStarter[] {
  return [
    {
      id: "learn",
      title: "Entrevista de trabajo",
      subtitle: "Simulacro guiado",
      prompt: AI_COACH_SHORTCUT_PROMPTS.jobInterview,
      angle: "static:jobInterview",
    },
    {
      id: "learn",
      title: "Pronunciación",
      subtitle: `Sonidos de nivel ${ctx.level}`,
      prompt: buildPronunciationStarterPrompt({
        level: ctx.level,
        soundTargets: soundLabelsForLevel(ctx.level),
      }),
      angle: "static:pronunciation",
    },
  ];
}

/**
 * Resolves the starters to offer right now.
 *
 * Dynamic starters that do not apply are simply left out — a card promising a
 * review the user has not earned is worse than no card. `free` always closes
 * the list, and fills any slot the dynamic ones could not.
 */
export function selectStarters(ctx: StarterContext): ResolvedStarter[] {
  const dynamic = STARTERS
    .filter((starter) => starter.id !== "free")
    .filter((starter) => starter.isAvailable(ctx))
    .slice(0, SLOTS - 1)
    .map((starter) => starter.build(ctx));

  const free = STARTERS.find((s) => s.id === "free")!.build(ctx);

  const chosen = [...dynamic, free];
  if (chosen.length >= SLOTS) return chosen.slice(0, SLOTS);

  // Not enough signal yet: pad with static shortcuts so the panel still reads
  // as a full set of options rather than a half-empty screen.
  const padding = staticPadding(ctx).slice(0, SLOTS - chosen.length);
  return [...dynamic, ...padding, free];
}
