// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

// Vitest has no SVGR transform configured (SVGR only runs through Next's
// webpack/turbopack loader — see next.config.mjs), so `.svg` imports resolve
// to raw asset URLs here instead of components. Mock each registered `.svg`
// module to a real functional SVG component so this test still exercises
// the registry's actual wiring (key -> import -> component) and would catch
// a broken import path or a registry entry that isn't a component.
vi.mock("@/components/illustrations/empty-vocabulario.svg", () => ({
  default: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));
vi.mock("@/components/illustrations/empty-tracking.svg", () => ({
  default: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

describe("ILLUSTRATIONS registry", () => {
  it("renders an svg element for every declared key", async () => {
    const { ILLUSTRATIONS } = await import("@/lib/illustrations/registry");
    for (const key of Object.keys(ILLUSTRATIONS) as (keyof typeof ILLUSTRATIONS)[]) {
      const Illustration = ILLUSTRATIONS[key];
      const { container } = render(<Illustration />);
      expect(container.querySelector("svg")).not.toBeNull();
    }
  });
});
