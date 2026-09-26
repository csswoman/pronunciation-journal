import { describe, expect, it } from "vitest";
import { trimHistoryForModel } from "../history";

describe("trimHistoryForModel", () => {
  it("keeps at most 16 messages and starts at a learner turn", () => {
    const messages = Array.from({ length: 40 }, (_, index) => ({
      role: (index % 2 === 0 ? "user" : "model") as "user" | "model",
      content: `turn ${index}`,
    }));
    const result = trimHistoryForModel(messages);
    expect(result).toHaveLength(16);
    expect(result[0]).toEqual({ role: "user", content: "turn 24" });
  });

  it("drops an orphan tool response at the cut boundary", () => {
    const messages = [
      { role: "user" as const, content: "old" },
      { role: "model" as const },
      { role: "tool" as const },
      { role: "user" as const, content: "new" },
      { role: "model" as const },
    ];
    expect(trimHistoryForModel(messages, 3)).toEqual(messages.slice(3));
  });

  it("returns no prior history if the window contains no learner turn", () => {
    expect(trimHistoryForModel([
      { role: "user", content: "old" },
      { role: "model" },
      { role: "tool" },
    ], 2)).toEqual([]);
  });
});
