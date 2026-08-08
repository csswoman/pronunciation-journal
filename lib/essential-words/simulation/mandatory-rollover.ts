// Task 8.9f §3 — auditoría de rollover: rastrea cada trabajo mandatory entre
// sesiones para demostrar (o refutar) que el rollover reclasifica en vez de
// clonar, que un item servido desaparece, y que un item diferido reaparece
// exactamente una vez en la siguiente sesión.
import type { AttemptModality } from "../verification/types";
import type { SimulationMandatory } from "./candidates";
import type { MandatoryWorkKind } from "./mandatory-load";

export interface RolloverRecord {
  itemId: string;
  workKind: MandatoryWorkKind;
  modality: AttemptModality;
  /** Sesión en la que se creó este registro (primera vez que se vio el trabajo). */
  createdSession: number;
  /**
   * Sesión de "llegada" del trabajo a la cola mandatory. En este modelo
   * (`collectMandatory` recomputa en vivo desde `schedule.dueAt`) coincide
   * con `firstMandatorySession`: no hay una fecha de vencimiento distinta
   * de la sesión en la que el ítem se vuelve elegible, porque los días
   * inactivos no generan sesión y el ítem simplemente espera.
   */
  dueSession: number;
  firstMandatorySession: number;
  servedSession: number | null;
  /** Nº de sesiones en las que el trabajo estuvo presente y no fue servido. */
  rolloverCount: number;
  latenessSessions: number | null;
}

export type RolloverLedger = Map<string, RolloverRecord>;

export function createRolloverLedger(): RolloverLedger {
  return new Map();
}

interface IdentityWithModality {
  itemId: string;
  workKind: MandatoryWorkKind;
  modality: AttemptModality;
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

export function mandatoryIdentitiesWithModality(
  mandatory: SimulationMandatory,
): IdentityWithModality[] {
  return (["learning", "overdue", "dueToday", "provisionalDue"] as const).flatMap((tranche) => (
    mandatory[tranche].map((item) => ({
      itemId: item.itemId,
      workKind: TRANCHE_TO_WORK_KIND[tranche],
      modality: item.modality,
    }))
  ));
}

export interface LedgerAdvanceResult {
  violations: string[];
  arrivals: RolloverRecord[];
  served: RolloverRecord[];
}

/**
 * Avanza el ledger de rollover un paso de sesión. Muta `ledger` in place y
 * devuelve las violaciones detectadas (item desaparecido sin ser servido).
 *
 * Reglas:
 * - Un itemId nuevo (no visto antes, o visto y ya servido previamente) crea
 *   un registro NUEVO — es trabajo legítimamente distinto (p.ej. la próxima
 *   revisión FSRS de un ítem que ya se completó antes), nunca se reescribe
 *   sobre el registro servido.
 * - Un itemId pendiente (`servedSession === null`) que sigue presente
 *   conserva `dueSession`/`firstMandatorySession` y sólo actualiza
 *   `workKind` (reclasificación: p.ej. dueToday -> overdue).
 * - Si no se sirve esta sesión, `rolloverCount += 1`.
 * - Si se sirve, se fija `servedSession` y `latenessSessions`.
 * - Cualquier itemId pendiente antes de esta sesión que ya no esté presente
 *   y tampoco se haya servido es una violación (desapareció sin ser
 *   servido: posible bug de scheduling/ownership).
 */
export function advanceMandatoryLedger(
  ledger: RolloverLedger,
  identities: readonly IdentityWithModality[],
  servedIds: ReadonlySet<string>,
  sessionIndex: number,
): LedgerAdvanceResult {
  const violations: string[] = [];
  const arrivals: RolloverRecord[] = [];
  const served: RolloverRecord[] = [];
  const presentIds = new Set(identities.map((identity) => identity.itemId));
  const pendingBefore = [...ledger.entries()].filter(([, record]) => record.servedSession === null);

  for (const identity of identities) {
    const existing = ledger.get(identity.itemId);
    const isFreshArrival = !existing || existing.servedSession !== null;
    const record: RolloverRecord = isFreshArrival
      ? {
          itemId: identity.itemId,
          workKind: identity.workKind,
          modality: identity.modality,
          createdSession: sessionIndex,
          dueSession: sessionIndex,
          firstMandatorySession: sessionIndex,
          servedSession: null,
          rolloverCount: 0,
          latenessSessions: null,
        }
      : { ...existing, workKind: identity.workKind, modality: identity.modality };

    if (isFreshArrival) arrivals.push(record);

    if (servedIds.has(identity.itemId)) {
      record.servedSession = sessionIndex;
      record.latenessSessions = sessionIndex - record.dueSession;
      served.push(record);
    } else {
      record.rolloverCount += 1;
    }
    ledger.set(identity.itemId, record);
  }

  for (const [itemId, before] of pendingBefore) {
    if (presentIds.has(itemId) || servedIds.has(itemId)) continue;
    violations.push(
      `item ${itemId} vanished from mandatory without being served `
        + `(pending since session ${before.firstMandatorySession}, workKind=${before.workKind})`,
    );
  }

  return { violations, arrivals, served };
}

export function costForRecord(
  record: RolloverRecord,
  costs: Record<AttemptModality, number>,
): number {
  return costs[record.modality];
}

export function ledgerBacklogSeconds(
  ledger: RolloverLedger,
  costs: Record<AttemptModality, number>,
): number {
  let total = 0;
  for (const record of ledger.values()) {
    if (record.servedSession === null) total += costForRecord(record, costs);
  }
  return total;
}
