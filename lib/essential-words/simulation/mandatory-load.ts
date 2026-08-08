// Task 8.9f — descomposición estructural de la carga mandatory por fuente.
// Elimina la métrica opaca `mandatorySelectedSeconds` en favor de un
// desglose auditable. No cambia selección ni política; sólo observa.
import { estimateItemsSeconds } from "../cost-estimate";
import type { AttemptModality } from "../verification/types";
import type { PlannedItem } from "../planning-types";
import type { SimulationMandatory } from "./candidates";

export type MandatoryWorkKind =
  | "scheduled-review"
  | "overdue-review"
  | "learning-step"
  | "provisional-due"
  | "other";

/** Identidad de un trabajo mandatory: mismo itemId + workKind == mismo trabajo. */
export interface MandatoryWorkIdentity {
  itemId: string;
  workKind: MandatoryWorkKind;
  dueAt?: string;
}

export interface MandatoryLoadBreakdown {
  scheduledReviewSeconds: number;
  overdueReviewSeconds: number;
  learningStepSeconds: number;
  provisionalDueSeconds: number;
  /**
   * Subconjunto informativo (no aditivo): segundos de las fuentes anteriores
   * cuyo itemId ya estaba en `deferredMandatory` de la sesión previa. No se
   * suma aparte en `totalMandatorySeconds` porque el trabajo ya está
   * contabilizado en su bucket de origen (scheduled/overdue/learning/
   * provisional); es un overlay de "cuánto de eso es rollover", no una
   * quinta fuente.
   */
  carriedMandatorySeconds: number;
  /** Cualquier trabajo mandatory que no calce en las 4 fuentes conocidas. */
  otherMandatorySeconds: number;
  totalMandatorySeconds: number;
}

export interface MandatoryItemCounts {
  scheduledReviews: number;
  overdueReviews: number;
  learningSteps: number;
  provisionalDue: number;
  /** Igual que `carriedMandatorySeconds`: overlay informativo, no aditivo. */
  carried: number;
}

const TRANCHE_TO_WORK_KIND: Record<
  "learning" | "overdue" | "dueToday" | "provisionalDue",
  MandatoryWorkKind
> = {
  learning: "learning-step",
  overdue: "overdue-review",
  dueToday: "scheduled-review",
  provisionalDue: "provisional-due",
};

const TRANCHES = ["learning", "overdue", "dueToday", "provisionalDue"] as const;

/**
 * Invariante de ownership único (Task 8.9f §2): un mismo itemId no puede
 * aparecer en más de un tranche de `SimulationMandatory` el mismo día. Si un
 * scheduled-review pasa a overdue, debe *reclasificarse*, no duplicarse.
 * Lanza si detecta la violación — usada como assertion viva en producción
 * de la auditoría, no sólo en tests.
 */
export function assertMandatoryOwnership(mandatory: SimulationMandatory): void {
  const owner = new Map<string, "learning" | "overdue" | "dueToday" | "provisionalDue">();
  for (const tranche of TRANCHES) {
    for (const item of mandatory[tranche]) {
      const existing = owner.get(item.itemId);
      if (existing && existing !== tranche) {
        throw new Error(
          `mandatory ownership violation: itemId=${item.itemId} appears in both `
            + `"${existing}" and "${tranche}" — a work item must change classification, `
            + "not duplicate across tranches",
        );
      }
      owner.set(item.itemId, tranche);
    }
  }
}

function identitiesFor(
  tranche: (typeof TRANCHES)[number],
  items: readonly PlannedItem[],
): MandatoryWorkIdentity[] {
  const workKind = TRANCHE_TO_WORK_KIND[tranche];
  return items.map((item) => ({ itemId: item.itemId, workKind, dueAt: item.dueAt }));
}

export interface MandatoryLoadResult {
  breakdown: MandatoryLoadBreakdown;
  counts: MandatoryItemCounts;
  identities: MandatoryWorkIdentity[];
}

/**
 * Descompone la carga mandatory del día por fuente real. `previousDeferredIds`
 * es el conjunto de itemIds presentes en `deferredMandatory` de la sesión
 * anterior — se usa únicamente para poblar el overlay `carried`, nunca para
 * sumar seconds/counts fuera de su bucket de origen.
 */
export function buildMandatoryLoadBreakdown(
  mandatory: SimulationMandatory,
  previousDeferredIds: ReadonlySet<string>,
  costs: Record<AttemptModality, number>,
): MandatoryLoadResult {
  assertMandatoryOwnership(mandatory);

  const scheduledReviewSeconds = estimateItemsSeconds(mandatory.dueToday, costs);
  const overdueReviewSeconds = estimateItemsSeconds(mandatory.overdue, costs);
  const learningStepSeconds = estimateItemsSeconds(mandatory.learning, costs);
  const provisionalDueSeconds = estimateItemsSeconds(mandatory.provisionalDue, costs);
  const otherMandatorySeconds = 0;

  const allItems = TRANCHES.flatMap((tranche) => mandatory[tranche]);
  const carriedItems = allItems.filter((item) => previousDeferredIds.has(item.itemId));
  const carriedMandatorySeconds = estimateItemsSeconds(carriedItems, costs);

  const breakdown: MandatoryLoadBreakdown = {
    scheduledReviewSeconds,
    overdueReviewSeconds,
    learningStepSeconds,
    provisionalDueSeconds,
    carriedMandatorySeconds,
    otherMandatorySeconds,
    totalMandatorySeconds:
      scheduledReviewSeconds + overdueReviewSeconds + learningStepSeconds
      + provisionalDueSeconds + otherMandatorySeconds,
  };

  const counts: MandatoryItemCounts = {
    scheduledReviews: mandatory.dueToday.length,
    overdueReviews: mandatory.overdue.length,
    learningSteps: mandatory.learning.length,
    provisionalDue: mandatory.provisionalDue.length,
    carried: carriedItems.length,
  };

  const identities = TRANCHES.flatMap((tranche) => identitiesFor(tranche, mandatory[tranche]));

  return { breakdown, counts, identities };
}
