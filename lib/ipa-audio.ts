/**
 * IPA symbol → audio filename mapping.
 * Audio files live in /public/sounds/.
 * Shared between IPAChart and PronunciationFeedback.
 */
export const SOUNDS_BASE_URL = "/sounds";

export const IPA_AUDIO_MAP: Record<string, string> = {
  i: "Close Front Unrounded Vowel.ogg",
  y: "Close Front Rounded Vowel.ogg",
  ɨ: "Close Central Unrounded Vowel.ogg",
  ʉ: "Close Central Rounded Vowel.ogg",
  ɯ: "Close Back Unrounded Vowel.ogg",
  u: "Close Back Rounded Vowel.ogg",
  ɪ: "Near-close Front Unrounded Vowel.ogg",
  ʏ: "Near-close Front Rounded Vowel.ogg",
  ʊ: "Near-close Near-back Rounded Vowel.ogg",
  e: "Close-mid Front Unrounded Vowel.ogg",
  ø: "Close-mid Front Rounded Vowel.ogg",
  ɘ: "Close-mid Central Unrounded Vowel.ogg",
  ɵ: "Close-mid Central Rounded Vowel.ogg",
  ɤ: "Close-mid Back Unrounded Vowel.ogg",
  o: "Close-mid Back Rounded Vowel.ogg",
  ə: "Mid Central Vowel.ogg",
  ɛ: "Open-mid Front Unrounded Vowel.ogg",
  œ: "Open-mid Front Rounded Vowel.ogg",
  ɜ: "Open-mid Central Unrounded Vowel.ogg",
  ɞ: "Open-mid Central Rounded Vowel.ogg",
  ʌ: "Open-mid Back Unrounded Vowel.ogg",
  ɔ: "Open-mid Back Rounded Vowel.ogg",
  æ: "Near-open Front Unrounded Vowel.ogg",
  ɐ: "Near-open Central Vowel.ogg",
  a: "Open Front Unrounded Vowel.ogg",
  ɶ: "Open Front Rounded Vowel.ogg",
  ɑ: "Open Back Unrounded Vowel.ogg",
  ɒ: "Open Back Rounded Vowel.ogg",
  p: "Voiceless Bilabial Plosive.ogg",
  b: "Voiced Bilabial Plosive.ogg",
  t: "Voiceless Alveolar Plosive.ogg",
  d: "Voiced Alveolar Plosive.ogg",
  ʈ: "Voiceless Retroflex Plosive.ogg",
  ɖ: "Voiced Retroflex Plosive.ogg",
  c: "Voiceless Palatal Plosive.ogg",
  ɟ: "Voiced Palatal Plosive.ogg",
  k: "Voiceless Velar Plosive.ogg",
  g: "Voiced Velar Plosive.ogg",
  q: "Voiceless Uvular Plosive.ogg",
  ɢ: "Voiced Uvular Plosive.ogg",
  ʔ: "Glottal Plosive.ogg",
  m: "Voiced Bilabial Nasal.ogg",
  ɱ: "Voiced Labiodental Nasal.ogg",
  n: "Voiced Alveolar Nasal.ogg",
  ɳ: "Voiced Retroflex Nasal.ogg",
  ɲ: "Voiced Palatal Nasal.ogg",
  ŋ: "Voiced Velar Nasal.ogg",
  ɴ: "Voiced Uvular Nasal.ogg",
  ʙ: "Voiced Bilabial Trill.ogg",
  r: "Voiced Alveolar Trill.ogg",
  ʀ: "Voiced Uvular Trill.ogg",
  ⱱ: "Voiced Labiodental Tap.ogg",
  ɾ: "Voiced Alveolar Tap.ogg",
  ɽ: "Voiced Retroflex Tap.ogg",
  ɸ: "Voiceless Bilabial Fricative.ogg",
  β: "Voiced Bilabial Fricative.ogg",
  f: "Voiceless Labiodental Fricative.ogg",
  v: "Voiced Labiodental Fricative.ogg",
  θ: "Voiceless Dental Fricative.ogg",
  ð: "Voiced Dental Fricative.ogg",
  s: "Voiceless Alveolar Fricative.ogg",
  z: "Voiced Alveolar Fricative.ogg",
  ʃ: "Voiceless Postalveolar Fricative.ogg",
  ʒ: "Voiced Postalveolar Fricative.ogg",
  ʂ: "Voiceless Retroflex Fricative.ogg",
  ʐ: "Voiced Retroflex Fricative.ogg",
  ç: "Voiceless Palatal Fricative.ogg",
  ʝ: "Voiced Palatal Fricative.ogg",
  x: "Voiceless Velar Fricative.ogg",
  ɣ: "Voiced Velar Fricative.ogg",
  χ: "Voiceless Uvular Fricative.ogg",
  ʁ: "Voiced Uvular Fricative.ogg",
  ħ: "Voiceless Pharyngeal Fricative.ogg",
  ʕ: "Voiced Pharyngeal Fricative.ogg",
  h: "Voiceless Glottal Fricative.ogg",
  ɦ: "Voiced Glottal Fricative.ogg",
  ɬ: "Voiceless Alveolar Lateral Fricative.ogg",
  ɮ: "Voiced Alveolar Lateral Fricative.ogg",
  ʋ: "Voiced Labiodental Approximant.ogg",
  ɹ: "Voiced Alveolar Approximant.ogg",
  ɻ: "Voiced Retroflex Approximant.ogg",
  j: "Voiced Palatal Approximant.ogg",
  ɰ: "Voiced Velar Approximant.ogg",
  l: "Voiced Alveolar Lateral Approximant.ogg",
  ɭ: "Voiced Retroflex Lateral Approximant.ogg",
  ʎ: "Voiced Palatal Lateral Approximant.ogg",
  ʟ: "Voiced Velar Lateral Approximant.ogg",
  w: "Voiced Labial-velar Fricative.ogg",
};

/**
 * Play a single IPA symbol's audio sample.
 * For diphthongs (multi-char like "aɪ"), uses the first char.
 */
export function playIpaSound(ipaSymbol: string): void {
  const key = ipaSymbol.length > 1 ? ipaSymbol[0] : ipaSymbol;
  const filename = IPA_AUDIO_MAP[key];
  if (!filename) return;
  const audio = new Audio(`${SOUNDS_BASE_URL}/${encodeURIComponent(filename)}`);
  audio.volume = 0.8;
  audio.play().catch(() => {/* user hasn't interacted yet or no file */});
}
