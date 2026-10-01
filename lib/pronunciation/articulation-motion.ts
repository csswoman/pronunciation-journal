import type {
  JawOpening,
  LipShape,
  PhonemeArticulationGuide,
  TonguePosition,
} from "@/lib/pronunciation/articulation-guide-data";

/**
 * Timeline for the "rest → posture" articulation animation.
 *
 * Every cycle starts from a relaxed mouth, moves into the sound's posture,
 * holds it (that is when the learner should be producing the sound) and
 * relaxes again. Diphthongs add a second posture the mouth glides into.
 *
 * Poses are indexed: 0 = rest, 1 = start posture, 2 = glide target.
 */

export type MotionSpeed = "normal" | "slow";
export type PoseIndex = 0 | 1 | 2;

export interface MotionTimeline {
  /** SMIL keyTimes, 0..1, strictly increasing. */
  keyTimes: readonly number[];
  /** Pose shown at each key time. */
  poses: readonly PoseIndex[];
}

/** Relaxed tongue the motion starts from and returns to. */
export const REST_TONGUE: TonguePosition = "central";

/** Shared ease for every segment (ease-in-out, a bit snappier than default). */
export const MOTION_EASE = "0.45 0 0.25 1";

const SINGLE_TIMELINE: MotionTimeline = {
  keyTimes: [0, 0.12, 0.4, 0.82, 1],
  poses: [0, 0, 1, 1, 0],
};

const GLIDE_TIMELINE: MotionTimeline = {
  keyTimes: [0, 0.08, 0.3, 0.4, 0.62, 0.86, 1],
  poses: [0, 0, 1, 1, 2, 2, 0],
};

export function getMotionTimeline(guide: PhonemeArticulationGuide): MotionTimeline {
  return guide.glide ? GLIDE_TIMELINE : SINGLE_TIMELINE;
}

export function getCycleSeconds(guide: PhonemeArticulationGuide, speed: MotionSpeed): number {
  const base = guide.glide ? 3.6 : 3;
  return speed === "slow" ? base * 2 : base;
}

/** Tongue positions for [rest, start, glide target?]. */
export function getTonguePoses(guide: PhonemeArticulationGuide): TonguePosition[] {
  const poses = [REST_TONGUE, guide.tonguePosition];
  if (guide.glide) poses.push(guide.glide.tonguePosition);
  return poses;
}

export function toKeyTimes(timeline: MotionTimeline): string {
  return timeline.keyTimes.join(";");
}

export function toKeySplines(timeline: MotionTimeline): string {
  return Array.from({ length: timeline.keyTimes.length - 1 }, () => MOTION_EASE).join(";");
}

/** SMIL `values` for any per-pose value (path, coordinate, opacity…). */
export function toPoseValues<T extends string | number>(
  timeline: MotionTimeline,
  valueForPose: (pose: PoseIndex) => T,
): string {
  return timeline.poses.map(valueForPose).join(";");
}

/**
 * Scale (x, y) a lip layer starts from before settling at 1×1, so the
 * cross-fade reads as the actual gesture: rounding pulls the corners in,
 * smiling pulls them out, opening drops the jaw.
 */
export function getLipsEntryScale(shape: LipShape, jaw: JawOpening): [number, number] {
  if (shape === "rounded" || shape === "pursed") return [1.25, 0.9];
  if (shape === "spread") return [0.85, 1.1];
  if (shape === "closed") return [1, 1.2];
  if (shape === "open" || jaw === "wide") return [1, 0.7];
  return [1, 1];
}
