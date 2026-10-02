import { describe, expect, it } from "vitest";
import { ARTICULATION_GUIDE_MAP } from "@/lib/pronunciation/articulation-guide-data";
import {
  getDifficultyLabel,
  getLipsCaption,
  getMannerHint,
  getTongueCaption,
} from "@/lib/pronunciation/articulation-copy";

const g = (symbol: string) => ARTICULATION_GUIDE_MAP[symbol];

describe("articulation copy", () => {
  it("keeps the tongue caption about the tongue only", () => {
    expect(getTongueCaption(g("/iː/"))).toBe("Lengua alta, hacia adelante");
    expect(getTongueCaption(g("/iː/"))).not.toMatch(/labio/i);
  });

  it("describes lips with jaw opening, except where the jaw is irrelevant", () => {
    expect(getLipsCaption(g("/iː/"))).toBe("Estirados · boca casi cerrada");
    expect(getLipsCaption(g("/f/"))).toBe("Dientes sobre el labio de abajo");
  });

  it("describes the lip change for diphthongs", () => {
    expect(getLipsCaption(g("/eɪ/"))).toBe("Boca medio abierta → casi cerrada");
    expect(getLipsCaption(g("/aʊ/"))).toBe("Boca bien abierta → casi cerrada");
  });

  it("gives one plain hint per manner", () => {
    expect(getMannerHint(g("/iː/"))).toBe("Hazla firme, con la boca tensa");
    expect(getMannerHint(g("/p/"))).toBe("Frenas el aire y lo sueltas de golpe");
  });

  it("maps difficulty to learner-facing copy", () => {
    expect(getDifficultyLabel("hard")).toBe("Difícil para hispanohablantes");
    expect(getDifficultyLabel(undefined)).toBeNull();
  });
});
