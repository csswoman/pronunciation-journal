// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { loadPendingLapses, savePendingLapses } from "../pending-lapses";

describe("pending lapses storage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("saves and loads pending lapse entries", () => {
    savePendingLapses(new Map([["c1k:test", 2]]));

    expect(loadPendingLapses()).toEqual(new Map([["c1k:test", 2]]));
  });

  it("removes storage when there are no entries", () => {
    savePendingLapses(new Map([["c1k:test", 2]]));
    savePendingLapses(new Map());

    expect(window.sessionStorage.getItem("core1000:pending-lapses")).toBeNull();
    expect(loadPendingLapses()).toEqual(new Map());
  });

  it("clears invalid stored data", () => {
    window.sessionStorage.setItem("core1000:pending-lapses", "{bad json");

    expect(loadPendingLapses()).toEqual(new Map());
    expect(window.sessionStorage.getItem("core1000:pending-lapses")).toBeNull();
  });
});
