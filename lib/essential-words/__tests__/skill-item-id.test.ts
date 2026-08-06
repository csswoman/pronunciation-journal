import { describe, expect, it } from "vitest";
import { learningItemId, parseLearningItemId } from "../skill-item";

describe("learningItemId", () => {
  it("compone habilidades base", () => {
    expect(learningItemId("c1k:on", "meaning")).toBe("c1k:on#meaning");
    expect(learningItemId("c1k:on", "listening")).toBe("c1k:on#listening");
  });

  it("compone usage con su expresión en kebab-case", () => {
    expect(learningItemId("c1k:on", "usage", "depend on")).toBe("c1k:on#usage:depend-on");
  });

  it("normaliza mayúsculas y espacios de la expresión", () => {
    expect(learningItemId("c1k:on", "usage", "On The Verge Of")).toBe("c1k:on#usage:on-the-verge-of");
  });

  it("rechaza usage sin expresión", () => {
    expect(() => learningItemId("c1k:on", "usage")).toThrow(/expression/i);
  });

  it("es estable: la misma entrada da el mismo id (invariante 6)", () => {
    expect(learningItemId("c1k:on", "usage", "depend on"))
      .toBe(learningItemId("c1k:on", "usage", "depend  on"));
  });
});

describe("parseLearningItemId", () => {
  it("recupera wordId y skill de una habilidad base", () => {
    expect(parseLearningItemId("c1k:on#meaning")).toEqual({
      wordId: "c1k:on",
      skill: "meaning",
    });
  });

  it("recupera la expresión de un usage", () => {
    expect(parseLearningItemId("c1k:on#usage:depend-on")).toEqual({
      wordId: "c1k:on",
      skill: "usage",
      expressionSlug: "depend-on",
    });
  });

  it("devuelve null ante un id malformado", () => {
    expect(parseLearningItemId("c1k:on")).toBeNull();
    expect(parseLearningItemId("c1k:on#bogus")).toBeNull();
  });
});
