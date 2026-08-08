// Task 8.9f — harness de auditoría mandatory. Envuelve `runSimulation` con
// hooks puramente observacionales (nunca mutan mandatory/plan/completions;
// sólo los inspeccionan) para producir: desglose por fuente, ledger de
// rollover, y reconciliación de backlog por sesión activa. Cero cambios de
// comportamiento de producción — es únicamente instrumentación.
import type { AttemptModality } from "../verification/types";
import type { SimulationMandatory } from "./candidates";
import {
  buildMandatoryLoadBreakdown,
  type MandatoryItemCounts,
  type MandatoryLoadBreakdown,
} from "./mandatory-load";
import {
  advanceMandatoryLedger,
  createRolloverLedger,
  ledgerBacklogSeconds,
  mandatoryIdentitiesWithModality,
  type RolloverLedger,
  type RolloverRecord,
} from "./mandatory-rollover";
import type { SimulationHookContext } from "./observations";
import type { SimulationProfile } from "./profiles";
import { runSimulation, SIMULATION_COSTS } from "./run-simulation";
import type { SimulationOptions } from "./state";
import type { SimulationResult } from "./types";
import type { SimulatedCompletion } from "./apply-session";
import type { DailyPlan } from "../planning-types";
import { learningItemId } from "../skill-item";

export interface MandatoryAuditDay {
  sessionIndex: number;
  dayIndex: number;
  breakdown: MandatoryLoadBreakdown;
  counts: MandatoryItemCounts;
  arrivalSeconds: number;
  serviceSeconds: number;
  backlogSecondsStart: number;
  backlogSecondsEnd: number;
  backlogDeltaSeconds: number;
  /** (end - start) - (arrival - service); debe ser ~0 si la contabilidad reconcilia. */
  reconciliationErrorSeconds: number;
  violations: string[];
}

/**
 * Un evento de servicio de trabajo mandatory: unión de la lateness derivada
 * del ledger de rollover (§3) con el resultado de recall observado en la
 * completion real (§12 — correlación lateness vs C11). No inventa una
 * fuente de recall nueva: usa `assessment.correct` de la misma completion.
 */
export interface MandatoryServiceEvent {
  itemId: string;
  workKind: RolloverRecord["workKind"];
  sessionIndex: number;
  latenessSessions: number;
  correct: boolean;
}

export interface MandatoryAuditResult {
  profileId: string;
  days: MandatoryAuditDay[];
  finalLedger: RolloverLedger;
  violations: string[];
  serviceEvents: MandatoryServiceEvent[];
  simulation: SimulationResult;
}

export function runMandatoryAudit(
  profile: SimulationProfile,
  options: SimulationOptions,
  costs: Record<AttemptModality, number> = SIMULATION_COSTS,
): MandatoryAuditResult {
  const ledger = createRolloverLedger();
  const auditDays: MandatoryAuditDay[] = [];
  const allViolations: string[] = [];
  const serviceEvents: MandatoryServiceEvent[] = [];
  let previousDeferredIds = new Set<string>();

  let latestMandatory: SimulationMandatory | null = null;
  let latestPlan: DailyPlan | null = null;
  let latestCompletions: SimulatedCompletion[] = [];

  const simulation = runSimulation(profile, options, {
    mutateMandatory: (mandatory) => {
      latestMandatory = mandatory;
      return mandatory;
    },
    mutatePlan: (plan) => {
      latestPlan = plan;
      return plan;
    },
    mutateCompletions: (completions) => {
      latestCompletions = completions;
      return completions;
    },
    mutateDay: (day, context: SimulationHookContext) => {
      const mandatory = latestMandatory;
      const plan = latestPlan;
      if (!mandatory || !plan) return day;

      const sessionIndex = context.world.sessionIndex - 1;
      const { breakdown, counts } = buildMandatoryLoadBreakdown(
        mandatory,
        previousDeferredIds,
        costs,
      );
      const identities = mandatoryIdentitiesWithModality(mandatory);
      const mandatoryIds = new Set(identities.map((identity) => identity.itemId));
      // Task 8.9f finding: completar listening/production TAMBIÉN reprograma
      // el item `meaning` de la misma palabra como efecto lateral observado
      // (record-attempt.ts `derivePlacements` sobre `itemsObservedBy`), sin
      // consumir segundos adicionales. Un `meaning` mandatory pendiente
      // puede quedar resuelto sin aparecer nunca en `completions` con su
      // propio itemId — no es un bug de scheduling, es la política
      // documentada de observación cruzada. El ledger debe reconocerlo o
      // reporta falsos "vanished".
      const observedMeaningIds = new Set(
        latestCompletions
          .filter((completion) => completion.item.skill === "listening" || completion.item.skill === "production")
          .map((completion) => learningItemId(completion.item.wordId, "meaning")),
      );
      const servedIds = new Set(
        [
          ...latestCompletions.map((completion) => completion.item.itemId),
          ...observedMeaningIds,
        ].filter((itemId) => mandatoryIds.has(itemId)),
      );

      const correctByItemId = new Map(
        latestCompletions.map((completion) => [completion.item.itemId, completion.assessment.correct]),
      );

      const backlogSecondsStart = ledgerBacklogSeconds(ledger, costs);
      const { violations, served } = advanceMandatoryLedger(ledger, identities, servedIds, sessionIndex);
      const backlogSecondsEnd = ledgerBacklogSeconds(ledger, costs);
      for (const record of served) {
        const correct = correctByItemId.get(record.itemId);
        if (correct === undefined || record.latenessSessions === null) continue;
        serviceEvents.push({
          itemId: record.itemId,
          workKind: record.workKind,
          sessionIndex,
          latenessSessions: record.latenessSessions,
          correct,
        });
      }

      let arrivalSeconds = 0;
      for (const record of ledger.values()) {
        if (record.firstMandatorySession === sessionIndex) arrivalSeconds += costs[record.modality];
      }
      let serviceSeconds = 0;
      for (const identity of identities) {
        if (servedIds.has(identity.itemId)) serviceSeconds += costs[identity.modality];
      }

      const backlogDeltaSeconds = backlogSecondsEnd - backlogSecondsStart;
      auditDays.push({
        sessionIndex,
        dayIndex: context.dayIndex,
        breakdown,
        counts,
        arrivalSeconds,
        serviceSeconds,
        backlogSecondsStart,
        backlogSecondsEnd,
        backlogDeltaSeconds,
        reconciliationErrorSeconds: backlogDeltaSeconds - (arrivalSeconds - serviceSeconds),
        violations,
      });
      allViolations.push(...violations);

      previousDeferredIds = new Set(plan.deferredMandatory.map((item) => item.itemId));
      return day;
    },
  });

  return {
    profileId: profile.id,
    days: auditDays,
    finalLedger: ledger,
    violations: allViolations,
    serviceEvents,
    simulation,
  };
}
