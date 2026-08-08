import type { CapacityReservation } from "../../planning-types";
import type { SimulationHarnessHooks } from "../observations";

/**
 * Task 8.9j — auditoría de reservation→service de C9. Puramente
 * observacional: se conecta vía `SimulationHarnessHooks` (el mismo mecanismo
 * de `experiments/sub-day-relearning.ts`), nunca muta `day`/`plan`, y no
 * cambia ningún camino de producción (`admission-control.ts`,
 * `placement/admission.ts`, `daily-budget.ts` no se tocan). Reconstruye la
 * trazabilidad pedida (§1–§6 de la tarea) a partir del estado ya expuesto
 * por `SimulationWorld` (`futureReservations`, `words`, `sessionIndex`).
 */

export type BaseObligationSource =
  | "new-word-admission"
  | "placement"
  | "preexisting-pending"
  | "migration"
  | "other";

export interface BaseObligationTrace {
  itemId: string;
  wordId: string;
  skill: "listening" | "production";
  source: BaseObligationSource;
  obligationCreatedSession: number;
  /** Session where `observeEligibility` would first count this item (C9's own clock). */
  firstEligibleSession?: number;
  reservationCreatedSession?: number;
  /** Absolute session (not the relative countdown stored on the ledger). */
  reservationDeadlineSession?: number;
  servedSession?: number;
  /** servedSession - firstEligibleSession; matches `baseSkillActivationLiveness`. */
  waitSessions?: number;
  admittedUnderCapacityForecast: boolean;
  violatedC9: boolean;
}

export type ReservationTransition =
  | { kind: "reserved"; session: number }
  | { kind: "rolled"; from: number; to: number }
  | { kind: "selected"; session: number }
  | { kind: "completed"; session: number }
  | { kind: "released"; session: number; reason: string }
  | { kind: "expired"; session: number };

export interface ReservationLifecycle {
  reservationId: string;
  itemId: string;
  skill: "listening" | "production";
  createdSession: number;
  /** Absolute session. */
  deadlineSession: number;
  transitions: ReservationTransition[];
}

const C9_LIMIT = 8;

interface WordSnapshot {
  introducedAt?: string;
  listeningKind: string;
  productionKind: string;
}

export interface C9ObligationAuditor {
  hooks: SimulationHarnessHooks;
  getObligations(): BaseObligationTrace[];
  getReservationLifecycles(): ReservationLifecycle[];
}

function wordIdOf(itemId: string): string {
  return itemId.split("#")[0] ?? itemId;
}

export function createC9ObligationAuditor(): C9ObligationAuditor {
  const obligations = new Map<string, BaseObligationTrace>();
  const reservations = new Map<string, ReservationLifecycle>();
  const pendingSourceByWordId = new Map<string, "new-word-admission" | "placement">();
  const admittedUnderForecastByWordId = new Set<string>();
  let previousWords = new Map<string, WordSnapshot>();
  let previousReservationDeadline = new Map<string, number>();
  let baselineWordIds: Set<string> | undefined;

  function markObligation(
    wordId: string,
    skill: "listening" | "production",
    obligationCreatedSession: number,
    source: BaseObligationSource,
  ): void {
    const itemId = `${wordId}#${skill}`;
    if (obligations.has(itemId)) return;
    obligations.set(itemId, {
      itemId,
      wordId,
      skill,
      source,
      obligationCreatedSession,
      firstEligibleSession: skill === "listening" ? obligationCreatedSession : undefined,
      admittedUnderCapacityForecast: admittedUnderForecastByWordId.has(wordId),
      violatedC9: false,
    });
  }

  const hooks: SimulationHarnessHooks = {
    mutatePlan(plan, _mandatory, context) {
      if (baselineWordIds === undefined) {
        // Runs once, before the very first admission of the run. Any word
        // already introduced at this point pre-dates the audited window —
        // genuine preexisting/migration debt, not new-word/placement.
        baselineWordIds = new Set();
        for (const [wordId, word] of context.world.words) {
          previousWords.set(wordId, {
            introducedAt: word.introducedAt,
            listeningKind: word.listening.schedule.kind,
            productionKind: word.production.schedule.kind,
          });
          if (!word.introducedAt) continue;
          baselineWordIds.add(wordId);
          for (const skill of ["listening", "production"] as const) {
            const kind = skill === "listening" ? word.listening.schedule.kind : word.production.schedule.kind;
            if (kind !== "none") continue;
            markObligation(wordId, skill, -1, "preexisting-pending");
            const obligation = obligations.get(`${wordId}#${skill}`);
            if (obligation) obligation.firstEligibleSession = 0;
          }
        }
      }
      for (const candidate of plan.newWordsSelected) {
        pendingSourceByWordId.set(candidate.wordId, "new-word-admission");
      }
      for (const item of plan.placementSelected) {
        pendingSourceByWordId.set(item.wordId, "placement");
      }
      for (const reservation of plan.futureReservations) {
        if (reservation.source !== "new-word" && reservation.source !== "placement") continue;
        admittedUnderForecastByWordId.add(wordIdOf(reservation.itemId));
      }
      return plan;
    },

    mutateDay(day, context) {
      const world = context.world;
      const sessionIndex = world.sessionIndex - 1; // this call happens after applyCompletedSession incremented it

      const currentWords = new Map<string, WordSnapshot>();
      for (const [wordId, word] of world.words) {
        currentWords.set(wordId, {
          introducedAt: word.introducedAt,
          listeningKind: word.listening.schedule.kind,
          productionKind: word.production.schedule.kind,
        });
      }

      for (const [wordId, word] of world.words) {
        const previous = previousWords.get(wordId);
        const introducedThisSession = Boolean(word.introducedAt) && (!previous || !previous.introducedAt);
        if (!introducedThisSession) continue;
        const source = pendingSourceByWordId.get(wordId) ?? "other";
        markObligation(wordId, "listening", sessionIndex, source);
        markObligation(wordId, "production", sessionIndex, source);
      }

      for (const [wordId, word] of world.words) {
        const previous = previousWords.get(wordId);
        if (!previous) continue;
        for (const skill of ["listening", "production"] as const) {
          const itemId = `${wordId}#${skill}`;
          const obligation = obligations.get(itemId);
          if (!obligation || obligation.servedSession !== undefined) continue;
          const previousKind = skill === "listening" ? previous.listeningKind : previous.productionKind;
          const currentKind = skill === "listening" ? word.listening.schedule.kind : word.production.schedule.kind;
          if (skill === "production" && obligation.firstEligibleSession === undefined) {
            // Production only becomes eligible once listening is actually served
            // (candidates.ts::baseCandidates gate) — not at admission time.
            const listeningKind = word.listening.schedule.kind;
            if (listeningKind !== "none") obligation.firstEligibleSession = sessionIndex;
          }
          if (previousKind === "none" && currentKind !== "none") {
            obligation.servedSession = sessionIndex;
            if (obligation.firstEligibleSession !== undefined) {
              obligation.waitSessions = sessionIndex - obligation.firstEligibleSession;
              obligation.violatedC9 = obligation.waitSessions > C9_LIMIT;
            }
          }
        }
      }

      const currentReservationByItemId = new Map<string, CapacityReservation>();
      for (const reservation of world.futureReservations) {
        if (reservation.skill !== "listening" && reservation.skill !== "production") continue;
        currentReservationByItemId.set(reservation.itemId, reservation);
      }
      for (const [itemId, reservation] of currentReservationByItemId) {
        const existing = reservations.get(itemId);
        if (!existing) {
          const deadlineSession = sessionIndex + reservation.deadlineSession;
          reservations.set(itemId, {
            reservationId: itemId,
            itemId,
            skill: reservation.skill as "listening" | "production",
            createdSession: sessionIndex,
            deadlineSession,
            transitions: [{ kind: "reserved", session: sessionIndex }],
          });
          const obligation = obligations.get(itemId);
          if (obligation) {
            obligation.reservationCreatedSession = sessionIndex;
            obligation.reservationDeadlineSession = deadlineSession;
          }
        } else {
          const previousDeadline = previousReservationDeadline.get(itemId);
          if (previousDeadline !== undefined && reservation.deadlineSession < previousDeadline) {
            existing.transitions.push({
              kind: "rolled",
              from: previousDeadline,
              to: reservation.deadlineSession,
            });
          }
        }
      }
      for (const [itemId, lifecycle] of reservations) {
        if (currentReservationByItemId.has(itemId)) continue;
        const alreadyClosed = lifecycle.transitions.some((transition) => (
          transition.kind === "completed" || transition.kind === "released" || transition.kind === "expired"
        ));
        if (alreadyClosed) continue;
        const word = world.words.get(wordIdOf(itemId));
        const kind = lifecycle.skill === "listening" ? word?.listening.schedule.kind : word?.production.schedule.kind;
        if (kind && kind !== "none") {
          lifecycle.transitions.push({ kind: "completed", session: sessionIndex });
        } else {
          lifecycle.transitions.push({
            kind: "released",
            session: sessionIndex,
            reason: "disappeared-from-ledger-without-service",
          });
        }
      }
      for (const lifecycle of reservations.values()) {
        const closed = lifecycle.transitions.some((transition) => (
          transition.kind === "completed" || transition.kind === "released" || transition.kind === "expired"
        ));
        if (closed) continue;
        if (sessionIndex > lifecycle.deadlineSession) {
          lifecycle.transitions.push({ kind: "expired", session: sessionIndex });
        }
      }

      previousReservationDeadline = new Map(
        [...currentReservationByItemId.entries()].map(([id, r]) => [id, r.deadlineSession]),
      );
      previousWords = currentWords;
      return day;
    },
  };

  return {
    hooks,
    getObligations: () => [...obligations.values()],
    getReservationLifecycles: () => [...reservations.values()],
  };
}
