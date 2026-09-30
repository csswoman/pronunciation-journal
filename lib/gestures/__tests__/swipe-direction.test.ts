import { describe, expect, it } from "vitest";
import { resolveSwipeDirection } from "../swipe-direction";

describe("resolveSwipeDirection", () => {
  it("returns null when offset and velocity are below threshold", () => {
    expect(resolveSwipeDirection(0, 0)).toBeNull();
    expect(resolveSwipeDirection(50, 0.1)).toBeNull();
    expect(resolveSwipeDirection(-50, -0.1)).toBeNull();
  });

  it("returns right when positive offset reaches or exceeds threshold", () => {
    expect(resolveSwipeDirection(80, 0)).toBe("right");
    expect(resolveSwipeDirection(120, 0)).toBe("right");
  });

  it("returns left when negative offset reaches or exceeds negative threshold", () => {
    expect(resolveSwipeDirection(-80, 0)).toBe("left");
    expect(resolveSwipeDirection(-150, 0)).toBe("left");
  });

  it("returns right on fast positive velocity if moving right past minimal distance", () => {
    expect(resolveSwipeDirection(30, 0.8)).toBe("right");
  });

  it("returns left on fast negative velocity if moving left past minimal distance", () => {
    expect(resolveSwipeDirection(-30, -0.8)).toBe("left");
  });

  it("does not trigger swipe if velocity is fast but direction opposes offset", () => {
    // Fast swipe right, but card is currently dragged left
    expect(resolveSwipeDirection(-30, 0.8)).toBeNull();
    // Fast swipe left, but card is currently dragged right
    expect(resolveSwipeDirection(30, -0.8)).toBeNull();
  });

  it("respects custom thresholds", () => {
    expect(resolveSwipeDirection(50, 0, { threshold: 40 })).toBe("right");
    expect(resolveSwipeDirection(-50, 0, { threshold: 60 })).toBeNull();
  });
});
