import { PHONEME_CONFUSION, contrastKey } from "@/lib/phoneme-practice/phoneme-similarity";

const ARPA: Record<string, string> = { AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", EH: "ɛ", ER: "ɜr", EY: "eɪ", IH: "ɪ", IY: "iː", OW: "oʊ", OY: "ɔɪ", UH: "ʊ", UW: "uː", B: "b", CH: "tʃ", D: "d", DH: "ð", F: "f", G: "g", HH: "h", JH: "dʒ", K: "k", L: "l", M: "m", N: "n", NG: "ŋ", P: "p", R: "r", S: "s", SH: "ʃ", T: "t", TH: "θ", V: "v", W: "w", Y: "j", Z: "z", ZH: "ʒ" };
const VOWELS = new Set(["AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY", "OW", "OY", "UH", "UW"]);
const IPA_SEGMENTS = ["tʃ", "dʒ", "eɪ", "aɪ", "ɔɪ", "oʊ", "aʊ", "iː", "ɜː", "ɑː", "uː", "ɜr", "ʌ", "ɪ", "ɛ", "æ", "ɑ", "ɔ", "ʊ", "ə", "b", "d", "f", "g", "h", "j", "k", "l", "m", "n", "ŋ", "p", "r", "ɹ", "s", "ʃ", "t", "θ", "ð", "v", "w", "z", "ʒ"].sort((a, b) => b.length - a.length);
const IPA_VOWELS = new Set(["iː", "ɪ", "ɛ", "æ", "ɑ", "ɑː", "ɔ", "ʊ", "uː", "ʌ", "ɜr", "ɜː", "ə", "eɪ", "aɪ", "ɔɪ", "oʊ", "aʊ"]);

export interface PhoneticComparison { kind: "phonetic_substitution" | "guess"; expectedIpa?: string; writtenIpa?: string; contrastId?: string }

function phones(arpabet: string): string[] {
  return arpabet.trim().split(/\s+/).map((part) => part.replace(/\d$/, "")).filter(Boolean);
}
function ipa(parts: string[]): string { return `/${parts.map((part) => ARPA[part] ?? part.toLowerCase()).join("")}/`; }

/** Greedy IPA segmenter: affricates, diphthongs and length marks are atomic. */
export function segmentIpa(value: string): string[] | null {
  const raw = value.replace(/^\//, "").replace(/\/$/, "").replace(/[ˈˌ.]/g, "");
  const segments: string[] = [];
  for (let offset = 0; offset < raw.length;) {
    const segment = IPA_SEGMENTS.find((candidate) => raw.startsWith(candidate, offset));
    if (!segment) return null;
    segments.push(segment); offset += segment.length;
  }
  return segments;
}

export function compareIpaPronunciations(expectedIpa: string, writtenIpa: string): PhoneticComparison {
  const expected = segmentIpa(expectedIpa); const written = segmentIpa(writtenIpa);
  if (!expected || !written) return { kind: "guess", expectedIpa, writtenIpa };
  const expectedVowels = expected.filter((part) => IPA_VOWELS.has(part)).length;
  const writtenVowels = written.filter((part) => IPA_VOWELS.has(part)).length;
  if (expectedVowels !== writtenVowels || expected.length !== written.length) return { kind: "guess", expectedIpa, writtenIpa };
  const changed = expected.map((part, index) => part === written[index] ? -1 : index).filter((index) => index >= 0);
  const index = changed[0];
  if (changed.length !== 1 || (!expected.slice(0, index).some((part) => !IPA_VOWELS.has(part)) && !expected.slice(index + 1).some((part) => !IPA_VOWELS.has(part)))) return { kind: "guess", expectedIpa, writtenIpa };
  const expectedPhone = `/${expected[index]}/`; const writtenPhone = `/${written[index]}/`;
  if (!(PHONEME_CONFUSION[expectedPhone] ?? []).includes(writtenPhone)) return { kind: "guess", expectedIpa, writtenIpa };
  return { kind: "phonetic_substitution", expectedIpa, writtenIpa, contrastId: contrastKey(expectedPhone, writtenPhone) };
}

/** Strict, deterministic attribution: one known phoneme substitution only. */
export function comparePronunciations(expectedArpa: string, writtenArpa: string): PhoneticComparison {
  const expected = phones(expectedArpa); const written = phones(writtenArpa);
  const expectedVowels = expected.filter((part) => VOWELS.has(part)).length;
  const writtenVowels = written.filter((part) => VOWELS.has(part)).length;
  const base = { expectedIpa: ipa(expected), writtenIpa: ipa(written) };
  if (expectedVowels !== writtenVowels || expected.length !== written.length) return { kind: "guess", ...base };
  const changed = expected.map((part, index) => part === written[index] ? -1 : index).filter((index) => index >= 0);
  if (changed.length !== 1) return { kind: "guess", ...base };
  const index = changed[0];
  const hasOnset = expected.slice(0, index).some((part) => !VOWELS.has(part));
  const hasCoda = expected.slice(index + 1).some((part) => !VOWELS.has(part));
  const expectedPhone = `/${ARPA[expected[index]] ?? expected[index].toLowerCase()}/`;
  const writtenPhone = `/${ARPA[written[index]] ?? written[index].toLowerCase()}/`;
  if ((!hasOnset && !hasCoda) || !(PHONEME_CONFUSION[expectedPhone] ?? []).includes(writtenPhone)) return { kind: "guess", ...base };
  return { kind: "phonetic_substitution", ...base, contrastId: contrastKey(expectedPhone, writtenPhone) };
}
