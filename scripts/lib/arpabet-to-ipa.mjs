/**
 * Shared ARPAbet → IPA with lexical stress marks (ˈ primary, ˌ secondary).
 * Keep in sync with lib/lexicon/ipa.ts → arpabetStringToIpa.
 */

export const ARPABET_TO_IPA = {
  AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", EH: "ɛ", ER: "ɜr",
  EY: "eɪ", IH: "ɪ", IY: "iː", OW: "oʊ", OY: "ɔɪ", UH: "ʊ", UW: "uː",
  B: "b", CH: "tʃ", D: "d", DH: "ð", F: "f", G: "ɡ", HH: "h", JH: "dʒ",
  K: "k", L: "l", M: "m", N: "n", NG: "ŋ", P: "p", R: "ɹ", S: "s", SH: "ʃ",
  T: "t", TH: "θ", V: "v", W: "w", Y: "j", Z: "z", ZH: "ʒ",
};

const VOWELS = new Set([
  "AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY",
  "IH", "IY", "OW", "OY", "UH", "UW",
]);

/**
 * Convert a space-separated ARPAbet string to IPA with lexical stress.
 * Stress marks go before the syllable onset (buffered consonants).
 * AH0 → ə (unstressed schwa); AH1/AH2 → ʌ.
 */
export function arpabetStringToIpa(arpabet) {
  const phones = arpabet.trim().split(/\s+/).filter(Boolean);
  let out = "";
  let onset = "";

  for (const phone of phones) {
    const stressMatch = phone.match(/(\d)$/);
    const stress = stressMatch ? stressMatch[1] : null;
    const base = phone.replace(/\d$/, "");
    const isVowel = VOWELS.has(base);

    let ipa;
    if (base === "AH" && stress === "0") {
      ipa = "ə";
    } else {
      ipa = ARPABET_TO_IPA[base] ?? base.toLowerCase();
    }

    if (isVowel) {
      const mark = stress === "1" ? "ˈ" : stress === "2" ? "ˌ" : "";
      out += mark + onset + ipa;
      onset = "";
    } else {
      onset += ipa;
    }
  }

  return out + onset;
}
