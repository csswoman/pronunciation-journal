import { mapDueAtToActiveSession } from "../active-session-map";
import { forecastActiveSessionCapacities } from "../capacity-forecast";
import type {
  CapacityForecastPlanningInput,
  CapacityReservation,
  ForecastCapacityDemand,
} from "../planning-types";
import type { AttemptModality, LearningItem, Skill } from "../verification/types";
import { itemsInWorld } from "./candidates";
import { dateAtDay } from "./observations";
import type { SimulationWorld } from "./state";

function modalityForSkill(skill: Skill): AttemptModality {
  if (skill === "listening") return "listening";
  if (skill === "production" || skill === "usage") return "production";
  return "recognition";
}

function futureActiveDayIndexes(
  calendar: readonly boolean[],
  currentDayIndex: number,
): number[] {
  return calendar
    .map((active, dayIndex) => ({ active, dayIndex }))
    .filter(({ active, dayIndex }) => active && dayIndex > currentDayIndex)
    .slice(0, 8)
    .map(({ dayIndex }) => dayIndex);
}

/**
 * Hard-reserves known FSRS / provisional / learning work into the next eight
 * active sessions. dueAt maps onto the first active session that can serve it.
 */
function mandatoryDemand(
  item: LearningItem,
  activeDates: Date[],
  now: Date,
  costs: Record<AttemptModality, number>,
): ForecastCapacityDemand | null {
  if (item.suspended || item.schedule.kind === "none") return null;
  const dueAt = new Date(item.schedule.dueAt);
  if (Number.isNaN(dueAt.getTime()) || dueAt <= now) return null;

  const sessionOffset = mapDueAtToActiveSession(dueAt, activeDates);
  if (sessionOffset === null) return null;
  return {
    itemId: item.id,
    skill: item.skill,
    deadlineSession: sessionOffset,
    estimatedSeconds: costs[modalityForSkill(item.skill)],
  };
}

export function buildSimulationCapacityInput(
  world: SimulationWorld,
  calendar: readonly boolean[],
  currentDayIndex: number,
  start: Date,
  dailyBudgetSeconds: number,
  costs: Record<AttemptModality, number>,
  dueReservations: CapacityReservation[],
): CapacityForecastPlanningInput {
  const activeDayIndexes = futureActiveDayIndexes(calendar, currentDayIndex);
  const activeDates = activeDayIndexes.map((dayIndex) => dateAtDay(start, dayIndex));
  const now = dateAtDay(start, currentDayIndex);
  const seen = new Set<string>();
  const mandatory: ForecastCapacityDemand[] = [];
  for (const item of itemsInWorld(world)) {
    const demand = mandatoryDemand(item, activeDates, now, costs);
    if (!demand || seen.has(demand.itemId)) continue;
    seen.add(demand.itemId);
    mandatory.push(demand);
  }

  return {
    sessions: forecastActiveSessionCapacities(
      calendar,
      currentDayIndex,
      dailyBudgetSeconds,
    ),
    mandatory,
    dueReservations,
    futureReservations: world.futureReservations,
  };
}
