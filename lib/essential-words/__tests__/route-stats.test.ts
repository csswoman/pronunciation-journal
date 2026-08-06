import { describe, expect, it } from "vitest";
import {
  formatRouteProgressCopy,
  tallyRouteProgress,
} from "../route-stats";
import { essentialWordId } from "../types";
import type { SRSData } from "@/lib/types";

function srs(word: string, status: SRSData["status"] = "active"): SRSData {
  return {
    wordId: essentialWordId(word),
    word,
    ease: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    status,
  };
}

describe("tallyRouteProgress / formatRouteProgressCopy", () => {
  it("counts untouched and active words separately", () => {
    const ids = [essentialWordId("run"), essentialWordId("walk"), essentialWordId("jump")];
    const map = new Map<string, SRSData>([
      [essentialWordId("run"), srs("run")],
      [essentialWordId("walk"), srs("walk", "mastered")],
    ]);

    expect(tallyRouteProgress(ids, map)).toEqual({ notStarted: 2, inProgress: 1 });
    expect(formatRouteProgressCopy({ notStarted: 32, inProgress: 18 })).toBe(
      "32 sin empezar · 18 en curso",
    );
    expect(formatRouteProgressCopy({ notStarted: 45, inProgress: 0 })).toBe(
      "45 sin empezar",
    );
  });
});
