// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ILLUSTRATIONS, getIllustration } from "@/lib/illustrations/registry";

// `.svg` imports resolve to a functional SVG component via the `svgr-stub`
// plugin in vitest.config.ts (SVGR itself only runs through Next's loader).
// That keeps this test exercising the registry's real wiring — key -> import
// -> component — so a broken import path or a non-component entry still fails,
// without needing a `vi.mock` per icon as the koboyo set grows.

describe("ILLUSTRATIONS registry", () => {
  it("renders an svg element for every declared key via getIllustration", () => {
    for (const key of Object.keys(ILLUSTRATIONS) as (keyof typeof ILLUSTRATIONS)[]) {
      const Illustration = getIllustration(key);
      const { container } = render(<Illustration /> as React.ReactElement);
      expect(container.querySelector("svg")).not.toBeNull();
    }
  });

  it("falls back to the placeholder when a key has no bespoke art", () => {
    const entries = Object.entries(ILLUSTRATIONS) as [
      keyof typeof ILLUSTRATIONS,
      unknown,
    ][];
    for (const [key, value] of entries) {
      if (value !== null) continue;
      const Fallback = getIllustration(key);
      const { container } = render(<Fallback /> as React.ReactElement);
      expect(container.querySelector("svg")).not.toBeNull();
    }
  });
});

