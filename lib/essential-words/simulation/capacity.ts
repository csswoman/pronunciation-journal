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

function mandatoryDemand(
  item: LearningItem,
  activeDates: Date[],
  now: Date,
  costs: Record<AttemptModality, number>,
): ForecastCapacityDemand | null {
  if (item.suspended || item.schedule.kind === "none") return null;
  const dueAt = new Date(item.schedule.dueAt);
  if (Number.isNaN(dueAt.getTime()) || dueAt <= now) return null;
  const firstDueSession = activeDates.findIndex((date) => date >= dueAt);
  if (firstDueSession < 0) return null;
  return {
    itemId: item.id,
    skill: item.skill,
    deadlineSession: firstDueSession + 1,
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
  const mandatory = itemsInWorld(world).flatMap((item) => {
    const demand = mandatoryDemand(item, activeDates, now, costs);
    return demand ? [demand] : [];
  });

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
