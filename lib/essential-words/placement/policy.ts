import type { ExecutionContext } from "../execution-context";
import { learningItemId } from "../skill-item";
import { essentialWordId, type EssentialWord } from "../types";
import { provisionalDueAt } from "../verification/provisional-intervals";
import type { BaseSkill, LearningItem } from "../verification/types";

export const PLACEMENT_POLICY_VERSION = "band-v1";
/** Provisional: se calibra en la Fase 8. */
export const DEFAULT_CONVERSIONS_PER_DAY = 8;

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

/**
 * Convierte inferidos en provisionales activos, con límite diario y
 * vencimientos distribuidos. Sin este límite, la colocación podría sembrar
 * cientos de revisiones sincronizadas en la misma ventana de 7 a 21 días.
 *
 * En planificación real, `admitPlacementConversions` debe filtrar antes por
 * capacidad futura; este helper solo aplica el schedule provisional al lote
 * ya admitido (o a tests unitarios del techo diario).
 *
 * La inferencia se conserva como telemetría: deja de controlar el schedule,
 * pero permite recalibrar la política de banda después de verificaciones.
 */
export function convertInferences(
  items: LearningItem[],
  limit: number,
  now: Date,
): LearningItem[] {
  return items
    .filter((item) => item.placementInference && item.schedule.kind === "none")
    .slice(0, limit)
    .map((item) => ({
      ...item,
      schedule: {
        kind: "provisional" as const,
        dueAt: provisionalDueAt("inference", item.id, now).toISOString(),
        source: "placement-inference" as const,
        evidenceConfidence: item.placementInference!.confidence,
      },
    }));
}

function confidenceScore(result: Pick<BandResult, "attempted" | "correct">): number {
  if (result.attempted <= 0) return 0;
  return Math.min(1, Math.max(0, result.correct / result.attempted));
}
