import { PROFILES } from "../../lib/essential-words/simulation/profiles";
import { runSimulation } from "../../lib/essential-words/simulation/run-simulation";
import type { SimulationOptions } from "../../lib/essential-words/simulation/state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

const result = runSimulation(PROFILES.advanced, options);
const activeWithPlacement = result.days.filter((d) => d.active && d.placementCandidates > 0);

console.log("active days with placement candidates:", activeWithPlacement.length);
const rows = activeWithPlacement.slice(0, 40).map((d) => ({
  date: d.date,
  candidates: d.placementCandidates,
  admitted: d.placementConversions,
  deferred: d.placementConversionsDeferred,
  capacitySafe: d.placementCapacitySafeConversions,
  rejCapacity: d.placementRejectedForCapacity,
  rejCeiling: d.placementRejectedForSafetyCeiling,
  rejAggC9: d.placementRejectedForAggregateC9,
}));
console.table(rows);

const totals = activeWithPlacement.reduce((acc, d) => ({
  admitted: acc.admitted + d.placementConversions,
  capacitySafe: acc.capacitySafe + (d.placementCapacitySafeConversions ?? 0),
  rejCapacity: acc.rejCapacity + (d.placementRejectedForCapacity ?? 0),
  rejCeiling: acc.rejCeiling + (d.placementRejectedForSafetyCeiling ?? 0),
  rejAggC9: acc.rejAggC9 + (d.placementRejectedForAggregateC9 ?? 0),
}), { admitted: 0, capacitySafe: 0, rejCapacity: 0, rejCeiling: 0, rejAggC9: 0 });
console.log("totals:", totals);
