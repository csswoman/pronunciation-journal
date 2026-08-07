// Task 8.9f §12 — correlación lateness vs recall (C11), sin cambiar la
// fórmula de C11 (`observedRetentionWithinTarget`, criteria/retention.ts).
// Sólo agrupa los mismos eventos "scheduled-review" que ya cuenta C11 por
// su lateness observada, para confirmar o refutar que el rojo de C11 viene
// del backlog/mandatory.
import type { MandatoryServiceEvent } from "./mandatory-audit";
import { percentile } from "./mandatory-feasibility";

/** Únicamente scheduled-review/overdue-review corresponden al mismo
 * `eventType === "scheduled-review"` que cuenta `observedRetention` — un
 * learning-step o un provisional NO son el mismo evento (Task 8.9f test N). */
const SCHEDULED_REVIEW_WORK_KINDS = new Set(["scheduled-review", "overdue-review"]);

export interface LatenessBucketStats {
  label: string;
  sampleSize: number;
  retention: number | null;
}

export interface LatenessRecallCorrelation {
  sampleSize: number;
  latenessP50: number;
  latenessP95: number;
  latenessMax: number;
  onTimeSharePct: number;
  retentionOnTime: number | null;
  retentionLate: number | null;
  buckets: LatenessBucketStats[];
}

function retentionOf(events: readonly MandatoryServiceEvent[]): number | null {
  if (events.length === 0) return null;
  return events.filter((event) => event.correct).length / events.length;
}

/**
 * Filtra únicamente eventos scheduled-review reales (Task 8.9f test N: no
 * cuenta learning-step ni provisional) y correlaciona su `latenessSessions`
 * con recall observado. No usa ni cambia `desiredRetention`.
 */
export function correlateLatenessWithRecall(
  serviceEvents: readonly MandatoryServiceEvent[],
): LatenessRecallCorrelation {
  const scheduled = serviceEvents.filter((event) => SCHEDULED_REVIEW_WORK_KINDS.has(event.workKind));
  const latenessSeries = scheduled.map((event) => event.latenessSessions);
  const onTime = scheduled.filter((event) => event.latenessSessions <= 0);
  const late = scheduled.filter((event) => event.latenessSessions > 0);

  const bucketRanges: Array<[string, (lateness: number) => boolean]> = [
    ["on-time (0)", (l) => l <= 0],
    ["late (1-2)", (l) => l >= 1 && l <= 2],
    ["late (3-5)", (l) => l >= 3 && l <= 5],
    ["late (6+)", (l) => l >= 6],
  ];
  const buckets = bucketRanges.map(([label, predicate]) => {
    const inBucket = scheduled.filter((event) => predicate(event.latenessSessions));
    return { label, sampleSize: inBucket.length, retention: retentionOf(inBucket) };
  });

  return {
    sampleSize: scheduled.length,
    latenessP50: percentile(latenessSeries, 0.5),
    latenessP95: percentile(latenessSeries, 0.95),
    latenessMax: Math.max(0, ...latenessSeries),
    onTimeSharePct: scheduled.length > 0 ? (onTime.length / scheduled.length) * 100 : 100,
    retentionOnTime: retentionOf(onTime),
    retentionLate: retentionOf(late),
    buckets,
  };
}
