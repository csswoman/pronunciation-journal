import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";

describe("cn / tailwind-merge type scale", () => {
  it("keeps text color when merged with a custom type-scale size", () => {
    expect(cn("bg-primary text-on-primary text-caption")).toBe(
      "bg-primary text-on-primary text-caption",
    );
    expect(cn("text-fg-muted text-caption")).toBe("text-fg-muted text-caption");
    expect(cn("bg-cta-bg text-cta-fg text-body-sm font-semibold")).toBe(
      "bg-cta-bg text-cta-fg text-body-sm font-semibold",
    );
  });

  it("still collapses conflicting colors and conflicting sizes", () => {
    expect(cn("text-on-primary text-fg")).toBe("text-fg");
    expect(cn("text-caption text-body-sm")).toBe("text-body-sm");
  });
});
