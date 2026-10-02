import { describe, expect, it } from "vitest";
import {
  ARTICULATION_GUIDE_MAP,
  type TonguePosition,
} from "@/lib/pronunciation/articulation-guide-data";
import {
  getCycleSeconds,
  getMotionTimeline,
  getTonguePoses,
  toKeySplines,
  toPoseValues,
} from "@/lib/pronunciation/articulation-motion";
import { getTongueGeometry } from "@/lib/pronunciation/sagittal-tongue-geometry";

const ALL_POSITIONS: TonguePosition[] = [
  "high-front", "mid-front", "low-front", "central", "high-back", "mid-back",
  "low-back", "tip-between-teeth", "tip-on-ridge", "blade-on-palate",
  "back-on-velum", "retroflex-curl", "glottal",
];

const commandsOf = (path: string) => path.replace(/[^A-Za-z]/g, "");

describe("articulation motion", () => {
  it("gives every tongue shape the same command list so SMIL can morph them", () => {
    const reference = commandsOf(getTongueGeometry("central").path);
    for (const position of ALL_POSITIONS) {
      expect(commandsOf(getTongueGeometry(position).path), position).toBe(reference);
    }
  });

  it("uses a glide timeline only for guides with a glide target", () => {
    const iy = ARTICULATION_GUIDE_MAP["/iː/"];
    const ey = ARTICULATION_GUIDE_MAP["/eɪ/"];
    expect(getMotionTimeline(iy).poses).not.toContain(2);
    expect(getMotionTimeline(ey).poses).toContain(2);
    expect(getTonguePoses(ey)).toEqual(["central", "mid-front", "high-front"]);
  });

  it("keeps keyTimes, poses and keySplines in sync", () => {
    for (const guide of Object.values(ARTICULATION_GUIDE_MAP)) {
      const timeline = getMotionTimeline(guide);
      expect(timeline.poses).toHaveLength(timeline.keyTimes.length);
      expect(toKeySplines(timeline).split(";")).toHaveLength(timeline.keyTimes.length - 1);
      expect(timeline.keyTimes[0]).toBe(0);
      expect(timeline.keyTimes.at(-1)).toBe(1);
    }
  });

  it("starts and ends every cycle at rest", () => {
    const timeline = getMotionTimeline(ARTICULATION_GUIDE_MAP["/aɪ/"]);
    const values = toPoseValues(timeline, (pose) => (pose === 0 ? 1 : 0)).split(";");
    expect(values[0]).toBe("1");
    expect(values.at(-1)).toBe("1");
  });

  it("doubles the cycle length at slow speed", () => {
    const guide = ARTICULATION_GUIDE_MAP["/iː/"];
    expect(getCycleSeconds(guide, "slow")).toBe(getCycleSeconds(guide, "normal") * 2);
  });
});
