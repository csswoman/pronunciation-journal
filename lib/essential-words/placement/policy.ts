import type { ExecutionContext } from "../execution-context";
import { learningItemId } from "../skill-item";
import { essentialWordId, type EssentialWord } from "../types";
import type { BaseSkill, LearningItem } from "../verification/types";

export const PLACEMENT_POLICY_VERSION = "band-v1";

const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const BORDERLINE_CONFIDENCE_THRESHOLD = 0.5;
const BASE_SKILLS: readonly BaseSkill[] = ["meaning", "listening", "production"];

export type BandConfidence = "high" | "borderline" | "low";

/** Resultados agregados de las muestras respondidas dentro de una banda. */
export interface BandResult {
  bandId: string;
  words: EssentialWord[];
  attempted: number;
  correct: number;
}

/**
 * Clasifica la evidencia de una banda sin pretender que el vocabulario sea
 * monotónico. La banda fronteriza se conserva para observación, pero nunca
 * adelanta ítems: todavía no distingue conocimiento de azar o de contexto.
 */
export function classifyBandConfidence(result: BandResult): BandConfidence {
  const confidence = confidenceScore(result);

  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return "high";
  if (confidence >= BORDERLINE_CONFIDENCE_THRESHOLD) return "borderline";
  return "low";
}

/** Crea los ítems base; solo una banda de alta confianza infiere `meaning`. */
export function planInferences(
  bands: BandResult[],
  context: ExecutionContext,
): LearningItem[] {
  const inferredAt = context.now.toISOString();

  return bands.flatMap((band) => {
    const confidence = confidenceScore(band);
    const inferMeaning = classifyBandConfidence(band) === "high";

    return band.words.flatMap((word) => {
      const wordId = essentialWordId(word.word);

      return BASE_SKILLS.map((skill) => ({
        id: learningItemId(wordId, skill),
        wordId,
        skill,
        contentOrigin: "authored",
        schedule: { kind: "none" },
        ...(inferMeaning && skill === "meaning" ? {
          placementInference: {
            bandId: band.bandId,
            confidence,
            inferredAt,
            policyVersion: PLACEMENT_POLICY_VERSION,
          },
        } : {}),
        repetitions: 0,
        lapses: 0,
        suspended: false,
      }));
    });
  });
}

function confidenceScore(result: Pick<BandResult, "attempted" | "correct">): number {
  if (result.attempted <= 0) return 0;
  return Math.min(1, Math.max(0, result.correct / result.attempted));
}
