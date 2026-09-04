import { describe, expect, it } from "vitest";
import { CANONICAL_SOUNDS } from "../inventory";
import { getSpanishContrast, getSoundCardTag, SPANISH_CONTRAST_META } from "../spanish-contrast";

describe("spanish-contrast", () => {
  it("classifies all 40 canonical sounds without errors", () => {
    expect(CANONICAL_SOUNDS.length).toBe(40);

    for (const phoneme of CANONICAL_SOUNDS) {
      const info = getSpanishContrast(phoneme.symbol);
      expect(["missing", "confusable", "similar"]).toContain(info.level);
      expect(info.label).toBeTruthy();
      expect(info.badgeLabel).toBeTruthy();
    }
  });

  it("identifies high-priority missing sounds correctly (red)", () => {
    expect(getSpanishContrast("/æ/").level).toBe("missing");
    expect(getSpanishContrast("/æ/").badgeLabel).toBe("No existe en ES");
    expect(getSpanishContrast("/ɜr/").level).toBe("missing");
    expect(getSpanishContrast("/θ/").level).toBe("missing");
    expect(getSpanishContrast("/v/").level).toBe("missing");
    expect(getSpanishContrast("/z/").level).toBe("missing");
  });

  it("identifies confusable pairs correctly (amber)", () => {
    expect(getSpanishContrast("/iː/").level).toBe("confusable");
    expect(getSpanishContrast("/iː/").badgeLabel).toBe("Se confunde");
    expect(getSpanishContrast("/ɪ/").level).toBe("confusable");
    expect(getSpanishContrast("/uː/").level).toBe("confusable");
    expect(getSpanishContrast("/b/").level).toBe("confusable");
  });

  it("identifies similar sounds correctly (green)", () => {
    expect(getSpanishContrast("/ɑ/").level).toBe("similar");
    expect(getSpanishContrast("/ɑ/").badgeLabel).toBe("Similar");
    expect(getSpanishContrast("/p/").level).toBe("similar");
    expect(getSpanishContrast("/m/").level).toBe("similar");
  });

  it("provides valid CSS classes in meta", () => {
    expect(SPANISH_CONTRAST_META.missing.chipClass).toContain("missing");
    expect(SPANISH_CONTRAST_META.confusable.chipClass).toContain("confusable");
    expect(SPANISH_CONTRAST_META.similar.chipClass).toContain("similar");
  });

  it("generates correct card tags matching the visual mockup", () => {
    expect(getSoundCardTag("/ɛ/")).toEqual({ label: "Se confunde con /i:/", type: "confusable" });
    expect(getSoundCardTag("/æ/")).toEqual({ label: "Nuevo", type: "new" });
    expect(getSoundCardTag("/ɔ/")).toEqual({ label: "Se confunde con /ɑ/", type: "confusable" });
    expect(getSoundCardTag("/ʊ/")).toEqual({ label: "Nuevo", type: "new" });
    expect(getSoundCardTag("/uː/")).toEqual({ label: "Se confunde con /ʊ/", type: "confusable" });
    expect(getSoundCardTag("/iː/")).toBeNull();
    expect(getSoundCardTag("/ɪ/")).toBeNull();
    expect(getSoundCardTag("/ɑ/")).toBeNull();
  });
});
