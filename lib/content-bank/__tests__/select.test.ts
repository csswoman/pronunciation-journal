import { describe, it, expect } from "vitest";
import { pickBankSet } from "../select";
import type { ContentBankItem } from "../types";

function makeItem(
  id: string,
  tool_name: "render_multiple_choice" | "render_fill_blank" | "render_speaking",
  stem: string,
  topic_id = "general",
): ContentBankItem {
  const payloadKey =
    tool_name === "render_multiple_choice"
      ? "question"
      : tool_name === "render_fill_blank"
      ? "sentence"
      : "prompt";

  return {
    id,
    kind: "coach_exercise",
    tool_name,
    level: "A2",
    topic_id,
    payload: { [payloadKey]: stem, topic: topic_id },
    prompt_version: "v1",
    stem_hash: `hash_${id}`,
    quality_flags: 0,
    created_at: new Date().toISOString(),
  };
}

describe("pickBankSet", () => {
  it("excluye vistos: never picks items in seenStems", () => {
    const items = [
      makeItem("1", "render_multiple_choice", "Already seen question"),
      makeItem("2", "render_multiple_choice", "Fresh question 1"),
      makeItem("3", "render_fill_blank", "Fresh sentence 1"),
    ];

    const seenStems = new Set(["already seen question"]);
    const picked = pickBankSet(items, seenStems);

    expect(picked.map((i) => i.id)).toEqual(["2", "3"]);
  });

  it("respeta mezcla: max 2 of the same tool_name", () => {
    const items = [
      makeItem("mc1", "render_multiple_choice", "MC 1"),
      makeItem("mc2", "render_multiple_choice", "MC 2"),
      makeItem("mc3", "render_multiple_choice", "MC 3"),
      makeItem("mc4", "render_multiple_choice", "MC 4"),
      makeItem("fb1", "render_fill_blank", "FB 1"),
      makeItem("fb2", "render_fill_blank", "FB 2"),
      makeItem("sp1", "render_speaking", "SP 1"),
    ];

    const picked = pickBankSet(items, new Set());

    // Total should be up to 5
    expect(picked).toHaveLength(5);
    const mcCount = picked.filter((i) => i.tool_name === "render_multiple_choice").length;
    const fbCount = picked.filter((i) => i.tool_name === "render_fill_blank").length;
    const spCount = picked.filter((i) => i.tool_name === "render_speaking").length;

    expect(mcCount).toBeLessThanOrEqual(2);
    expect(fbCount).toBeLessThanOrEqual(2);
    expect(spCount).toBeLessThanOrEqual(2);
  });

  it("devuelve <5 si no hay suficientes", () => {
    const items = [
      makeItem("1", "render_multiple_choice", "MC 1"),
      makeItem("2", "render_fill_blank", "FB 1"),
      makeItem("3", "render_speaking", "SP 1"),
    ];

    const picked = pickBankSet(items, new Set());
    expect(picked).toHaveLength(3);
  });

  it("prioriza temas débiles", () => {
    const items = [
      makeItem("normal1", "render_multiple_choice", "Normal 1", "topic_normal"),
      makeItem("normal2", "render_fill_blank", "Normal 2", "topic_normal"),
      makeItem("weak1", "render_multiple_choice", "Weak 1", "topic_weak"),
      makeItem("weak2", "render_fill_blank", "Weak 2", "topic_weak"),
      makeItem("normal3", "render_speaking", "Normal 3", "topic_normal"),
    ];

    const picked = pickBankSet(items, new Set(), ["topic_weak"]);
    expect(picked[0].id).toBe("weak1");
    expect(picked[1].id).toBe("weak2");
  });
});
