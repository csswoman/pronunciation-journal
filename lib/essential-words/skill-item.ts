import type {
  LearningItem,
  MaturityPolicy,
  Skill,
  SkillStatus,
  SrsReviewEvent,
} from "./verification/types";

/** Estado de dominio de un ítem, derivado exclusivamente de `schedule`. */
export function deriveSkillStatus(item: LearningItem): SkillStatus {
  if (item.schedule.kind === "none") return "unseen";
  if (item.schedule.kind === "provisional") return "provisional";
  return item.schedule.state === "Review" ? "review" : "learning";
}

/**
 * Por qué un ítem está en aprendizaje. `Relearning` conserva su semántica
 * FSRS como una recaída, sin persistir una segunda fuente de verdad.
 */
export function getLearningReason(item: LearningItem): "new" | "lapse" | undefined {
  if (deriveSkillStatus(item) !== "learning") return undefined;
  if (item.schedule.kind !== "fsrs") return "new";
  return item.schedule.state === "Relearning" ? "lapse" : "new";
}

const BASE_SKILLS: readonly Skill[] = ["meaning", "listening", "production"];

function slugify(expression: string): string {
  return expression.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Único constructor de ids de ítem. Las habilidades base son
 * `<wordId>#<skill>` y usage incorpora una expresión normalizada.
 */
export function learningItemId(wordId: string, skill: Skill, expression?: string): string {
  if (skill === "usage") {
    if (!expression) throw new Error("learningItemId: usage requires an expression");
    return `${wordId}#usage:${slugify(expression)}`;
  }
  return `${wordId}#${skill}`;
}

export interface ParsedLearningItemId {
  wordId: string;
  skill: Skill;
  expressionSlug?: string;
}

export function parseLearningItemId(id: string): ParsedLearningItemId | null {
  const hash = id.indexOf("#");
  if (hash < 0) return null;

  const wordId = id.slice(0, hash);
  const rest = id.slice(hash + 1);
  if (!wordId || !rest) return null;

  if (rest.startsWith("usage:")) {
    const expressionSlug = rest.slice("usage:".length);
    return expressionSlug ? { wordId, skill: "usage", expressionSlug } : null;
  }

  return BASE_SKILLS.includes(rest as Skill)
    ? { wordId, skill: rest as Skill }
    : null;
}

export const DEFAULT_MATURITY_POLICY: MaturityPolicy = {
  version: "provisional-1",
  minStabilityDays: 21,
  minSuccessfulReviews: 3,
  maxRecentLapses: 1,
  recentReviewWindow: 5,
};

/**
 * Madurez derivada de la programación FSRS y de los eventos del propio ítem.
 * La política versionada cambia la lectura sin reescribir el historial.
 */
export function isMature(
  item: LearningItem,
  events: SrsReviewEvent[],
  policy: MaturityPolicy,
): boolean {
  if (item.schedule.kind !== "fsrs" || item.schedule.state !== "Review") return false;
  if (item.schedule.stability < policy.minStabilityDays) return false;

  const own = events
    .filter((event) => event.learningItemId === item.id)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  const successes = own.filter((event) => event.grade !== "Again");
  if (successes.length < policy.minSuccessfulReviews) return false;

  const recent = own.slice(-policy.recentReviewWindow);
  const lapses = recent.filter((event) => event.grade === "Again").length;
  return lapses <= policy.maxRecentLapses;
}

/**
 * Ciclo de vida derivado de un ítem usage. No se persiste un estado de
 * activación: la programación es la fuente de verdad para cola y ciclo.
 */
export function deriveUsageLifecycle(
  item: LearningItem,
): "inactive" | "active" | "retired" {
  if (item.payload?.retiredAt) return "retired";
  return item.schedule.kind === "none" ? "inactive" : "active";
}
