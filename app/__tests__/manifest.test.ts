import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("web app manifest", () => {
  it("starts at the authenticated home route (/), not a missing /home path", () => {
    expect(manifest().start_url).toBe("/");
  });
});
