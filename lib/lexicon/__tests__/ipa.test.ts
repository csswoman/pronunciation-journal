import { describe, expect, it } from "vitest";
import { arpabetStringToIpa } from "../ipa";

describe("arpabetStringToIpa", () => {
  it("places primary stress before the onset", () => {
    expect(arpabetStringToIpa("B UH1 K")).toBe("ˈbʊk");
    expect(arpabetStringToIpa("M AH1 N IY0")).toBe("ˈmʌniː");
  });

  it("places secondary stress", () => {
    expect(arpabetStringToIpa("IH2 N F ER0 M EY1 SH AH0 N")).toBe("ˌɪnfɜrˈmeɪʃən");
  });

  it("maps AH0 to schwa", () => {
    expect(arpabetStringToIpa("AH0 B AW1 T")).toBe("əˈbaʊt");
  });

  it("handles unstressed monosyllables without a mark", () => {
    expect(arpabetStringToIpa("DH AH0")).toBe("ðə");
  });
});
