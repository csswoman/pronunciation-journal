import type {
  CapacityReservation,
  ForecastCapacityDemand,
  ForecastSessionCapacity,
} from "./planning-types";
import type { Skill } from "./verification/types";

export type CapacityForecastStatus = "ready" | "insufficient-forecast";

export interface CapacityForecast {
  status: CapacityForecastStatus;
  sessions: ForecastSessionCapacity[];
  reservations: CapacityReservation[];
  unreservedItemIds: string[];
}

export interface CapacityForecastInput {
  sessions: readonly ForecastSessionCapacity[];
  mandatory: readonly ForecastCapacityDemand[];
  pendingBase: readonly CapacityReservation[];
  futureReservations: readonly CapacityReservation[];
}

export interface ReservedCapacity {
  forecast: CapacityForecast;
  reservation: CapacityReservation;
}

function cloneSessions(
  sessions: readonly ForecastSessionCapacity[],
): ForecastSessionCapacity[] {
  return sessions.map((session) => ({ ...session }));
}

function hasEightActiveSessions(sessions: ForecastSessionCapacity[]): boolean {
  return sessions.length === 8 && sessions.every((session, index) => (
    session.sessionOffset === index + 1
    && Number.isFinite(session.availableSeconds)
    && Number.isFinite(session.listeningSeconds)
    && Number.isFinite(session.productionSeconds)
    && session.availableSeconds >= 0
    && session.listeningSeconds >= 0
    && session.productionSeconds >= 0
  ));
}

function orderByDeadline<T extends { deadlineSession: number; itemId: string; skill: Skill }>(
  items: readonly T[],
): T[] {
  return [...items].sort((left, right) => (
    left.deadlineSession - right.deadlineSession
    || left.itemId.localeCompare(right.itemId)
    || left.skill.localeCompare(right.skill)
  ));
}

function modalityFits(
  session: ForecastSessionCapacity,
  skill: Skill,
  cost: number,
): boolean {
  if (skill === "listening") return session.listeningSeconds >= cost;
  if (skill === "production" || skill === "usage") {
    return session.productionSeconds >= cost;
  }
  return true;
}

function reserveInPlace(
  sessions: ForecastSessionCapacity[],
  item: ForecastCapacityDemand,
  earliestSession: number,
): number | null {
  if (
    !Number.isFinite(item.estimatedSeconds)
    || item.estimatedSeconds < 0
    || !Number.isInteger(item.deadlineSession)
  ) return null;

  const session = sessions.find((candidate) => (
    candidate.sessionOffset >= earliestSession
    && candidate.sessionOffset <= item.deadlineSession
    && candidate.availableSeconds >= item.estimatedSeconds
    && modalityFits(candidate, item.skill, item.estimatedSeconds)
  ));
  if (!session) return null;

  session.availableSeconds -= item.estimatedSeconds;
  if (item.skill === "listening") {
    session.listeningSeconds -= item.estimatedSeconds;
  } else if (item.skill === "production" || item.skill === "usage") {
    session.productionSeconds -= item.estimatedSeconds;
  }
  session.listeningSeconds = Math.min(session.listeningSeconds, session.availableSeconds);
  session.productionSeconds = Math.min(session.productionSeconds, session.availableSeconds);
  return session.sessionOffset;
}

function reservationKey(reservation: CapacityReservation): string {
  return `${reservation.itemId}:${reservation.skill}`;
}

export function buildCapacityForecast(input: CapacityForecastInput): CapacityForecast {
  const sessions = cloneSessions(input.sessions)
    .sort((left, right) => left.sessionOffset - right.sessionOffset);
  if (!hasEightActiveSessions(sessions)) {
    return {
      status: "insufficient-forecast",
      sessions,
      reservations: [],
      unreservedItemIds: [],
    };
  }

  const unreservedItemIds: string[] = [];
  for (const demand of orderByDeadline(input.mandatory)) {
    if (reserveInPlace(sessions, demand, 1) === null) {
      unreservedItemIds.push(demand.itemId);
    }
  }

  const requestedByKey = new Map<string, CapacityReservation>();
  for (const requested of input.pendingBase) {
    requestedByKey.set(reservationKey(requested), requested);
  }
  for (const previous of input.futureReservations) {
    const key = reservationKey(previous);
    const pending = requestedByKey.get(key);
    requestedByKey.set(
      key,
      !pending || previous.deadlineSession <= pending.deadlineSession
        ? previous
        : pending,
    );
  }

  const reservations: CapacityReservation[] = [];
  for (const requested of orderByDeadline([...requestedByKey.values()])) {
    const scheduledAt = reserveInPlace(sessions, requested, 1);
    if (scheduledAt === null) {
      unreservedItemIds.push(requested.itemId);
      continue;
    }
    reservations.push({ ...requested, deadlineSession: scheduledAt });
  }

  return { status: "ready", sessions, reservations, unreservedItemIds };
}

export function reserveCapacity(
  forecast: CapacityForecast,
  requested: CapacityReservation,
  earliestSession = 1,
): ReservedCapacity | null {
  if (forecast.status !== "ready") return null;
  const sessions = cloneSessions(forecast.sessions);
  const scheduledAt = reserveInPlace(sessions, requested, earliestSession);
  if (scheduledAt === null) return null;
  const reservation = { ...requested, deadlineSession: scheduledAt };
  return {
    reservation,
    forecast: {
      ...forecast,
      sessions,
      reservations: [...forecast.reservations, reservation],
    },
  };
}

export function forecastActiveSessionCapacities(
  activeCalendar: readonly boolean[],
  currentDayIndex: number,
  budgetSeconds: number,
): ForecastSessionCapacity[] {
  const activeDays = activeCalendar
    .map((active, dayIndex) => ({ active, dayIndex }))
    .filter(({ active, dayIndex }) => active && dayIndex > currentDayIndex)
    .slice(0, 8);
  return activeDays.map((_, index) => ({
    sessionOffset: index + 1,
    availableSeconds: budgetSeconds,
    listeningSeconds: budgetSeconds,
    productionSeconds: budgetSeconds,
  }));
}
