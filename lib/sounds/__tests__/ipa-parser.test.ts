import { describe, expect, it } from "vitest";
import { ipaContainsSound, parseIpa } from "../ipa-parser";

describe("parseIpa", () => {
  it("tokenizes a simple transcription", () => {
    expect(parseIpa("/hɑt/").tokens).toEqual(["/h/", "/ɑ/", "/t/"]);
  });

  it("prefers longest matches over their constituent symbols", () => {
    expect(parseIpa("/tʃɜrtʃ/").tokens).toEqual(["/tʃ/", "/ɜr/", "/tʃ/"]);
    expect(parseIpa("/tʃɔɪs/").tokens).toEqual(["/tʃ/", "/ɔɪ/", "/s/"]);
  });

  it("strips stress and syllable marks", () => {
    expect(parseIpa("/ˈbænˌænə/").tokens).toEqual([
      "/b/", "/æ/", "/n/", "/æ/", "/n/", "/ə/",
    ]);
  });

  it("normalizes the legacy /ɡ/ glyph", () => {
    expect(parseIpa("/ɡræs/").tokens).toEqual(["/g/", "/r/", "/æ/", "/s/"]);
  });

  it("collects unrecognized symbols instead of throwing", () => {
    const { tokens, unknown } = parseIpa("/hɑt#/");
    expect(tokens).toEqual(["/h/", "/ɑ/", "/t/"]);
    expect(unknown).toEqual(["#"]);
  });

  it("expands schwar into schwa plus r", () => {
    expect(parseIpa("/ˈtiːtʃɚ/").tokens).toEqual([
      "/t/", "/iː/", "/tʃ/", "/ə/", "/r/",
    ]);
  });
});

describe("dialectal normalization", () => {
  it("accepts RP /ɒ/ as GA /ɑ/", () => {
    expect(ipaContainsSound("/hɒt/", "/ɑ/")).toBe(true);
  });

  it("accepts RP /ɑː/ as GA /ɑ/", () => {
    expect(ipaContainsSound("/fɑːðər/", "/ɑ/")).toBe(true);
  });

  it("accepts non-rhotic /ɜː/ as GA /ɜr/", () => {
    expect(ipaContainsSound("/bɜːd/", "/ɜr/")).toBe(true);
  });

  it("resolves happY/commA reduced vowels", () => {
    expect(parseIpa("/ˈhæpi/").unknown).toEqual([]);
    expect(parseIpa("/ˈhæpi/").tokens).toEqual(["/h/", "/æ/", "/p/", "/iː/"]);
    expect(parseIpa("/ˈkæʒuəl/").unknown).toEqual([]);
    // The long forms still win over the bare reduced vowels.
    expect(parseIpa("/ˈiːzi/").tokens).toEqual(["/iː/", "/z/", "/iː/"]);
  });

  it("accepts bare /e/ as GA /ɛ/ without breaking /eɪ/", () => {
    expect(ipaContainsSound("/bed/", "/ɛ/")).toBe(true);
    expect(ipaContainsSound("/deɪ/", "/ɛ/")).toBe(false);
    expect(ipaContainsSound("/deɪ/", "/eɪ/")).toBe(true);
  });
});

describe("ipaContainsSound", () => {
  it("rejects substring matches that are not discrete phonemes", () => {
    // /t/ appears inside /tʃ/ but 'church' has no standalone /t/.
    expect(ipaContainsSound("/tʃɜrtʃ/", "/t/")).toBe(false);
    // /ɔ/ appears inside /ɔɪ/ but 'boy' has no standalone /ɔ/.
    expect(ipaContainsSound("/bɔɪ/", "/ɔ/")).toBe(false);
    // /r/ appears inside /ɜr/ but 'bird' has no standalone /r/.
    expect(ipaContainsSound("/bɜrd/", "/r/")).toBe(false);
  });

  it("catches a word filed under the wrong sound", () => {
    expect(ipaContainsSound("/ɡræs/", "/ɑ/")).toBe(false);
    expect(ipaContainsSound("/ɡræs/", "/æ/")).toBe(true);
  });

  it("accepts the sound argument with or without slashes", () => {
    expect(ipaContainsSound("/hɑt/", "ɑ")).toBe(true);
    expect(ipaContainsSound("/hɑt/", "/ɑ/")).toBe(true);
  });
});
