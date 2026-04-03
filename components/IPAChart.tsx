"use client";

import { useState, useRef, useEffect } from "react";

const SOUNDS_BASE_URL = "/sounds";

// ─── Audio Map ────────────────────────────────────────────────────────────────
const AUDIO_MAP: Record<string, string> = {
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

// ─── Data ─────────────────────────────────────────────────────────────────────
interface PhonemeData {
  symbol: string;      // display e.g. /iː/
  rawSymbol: string;   // IPA char for audio lookup e.g. "i"
  name: string;        // "Long E"
  category: string;    // "HIGH FRONT" — shown on card
  example: string;     // "see"
  description: string;
  tips: string[];
  type: "vowel" | "consonant" | "diphthong";
}

const PHONEMES: PhonemeData[] = [
  // ── Vowels ──
  { symbol: "/iː/",  rawSymbol: "i",  name: "Long E",     category: "HIGH FRONT",   example: "see",    description: "Close front unrounded vowel — the 'ee' in 'see'.",        tips: ["Stretch lips wide", "Tongue high and forward"],               type: "vowel" },
  { symbol: "/ɪ/",   rawSymbol: "ɪ",  name: "Short I",    category: "NEAR-HIGH",    example: "sit",    description: "Near-close front unrounded vowel — the 'i' in 'sit'.",     tips: ["Relaxed lip position", "Tongue slightly lower than /iː/"],    type: "vowel" },
  { symbol: "/e/",   rawSymbol: "e",  name: "Short E",    category: "MID FRONT",    example: "bed",    description: "Close-mid front unrounded vowel — the 'e' in 'bed'.",      tips: ["Lips slightly spread", "Tongue at mid-front position"],       type: "vowel" },
  { symbol: "/æ/",   rawSymbol: "æ",  name: "Ash",        category: "LOW FRONT",    example: "cat",    description: "Near-open front unrounded vowel — the 'a' in 'cat'.",      tips: ["Mouth wide open", "Tongue low and forward"],                  type: "vowel" },
  { symbol: "/ɑː/",  rawSymbol: "ɑ",  name: "Long A",     category: "OPEN BACK",    example: "car",    description: "Open back unrounded vowel — the 'ar' in 'car'.",           tips: ["Mouth fully open", "Tongue low and back"],                    type: "vowel" },
  { symbol: "/ɒ/",   rawSymbol: "ɒ",  name: "Short O",    category: "OPEN ROUND",   example: "hot",    description: "Open back rounded vowel — the 'o' in 'hot'.",              tips: ["Lips rounded", "Mouth wide open"],                            type: "vowel" },
  { symbol: "/ɔː/",  rawSymbol: "ɔ",  name: "Long O",     category: "MID-BACK",     example: "law",    description: "Open-mid back rounded vowel — the 'aw' in 'law'.",         tips: ["Lips rounded and open", "Tongue low-back"],                   type: "vowel" },
  { symbol: "/ʊ/",   rawSymbol: "ʊ",  name: "Short U",    category: "NEAR-HIGH",    example: "book",   description: "Near-close near-back rounded vowel — the 'oo' in 'book'.", tips: ["Lips loosely rounded", "Tongue near-high back"],              type: "vowel" },
  { symbol: "/uː/",  rawSymbol: "u",  name: "Long U",     category: "HIGH BACK",    example: "moon",   description: "Close back rounded vowel — the 'oo' in 'moon'.",           tips: ["Lips tightly rounded", "Tongue high and back"],               type: "vowel" },
  { symbol: "/ʌ/",   rawSymbol: "ʌ",  name: "Strut",      category: "MID-BACK",     example: "cup",    description: "Open-mid back unrounded vowel — the 'u' in 'cup'.",        tips: ["Lips neutral", "Tongue mid-back position"],                   type: "vowel" },
  { symbol: "/ɜː/",  rawSymbol: "ɜ",  name: "Nurse",      category: "MID CENTRAL",  example: "bird",   description: "Open-mid central unrounded vowel — the 'ir' in 'bird'.",   tips: ["Lips neutral", "Tongue in neutral central position"],         type: "vowel" },
  { symbol: "/ə/",   rawSymbol: "ə",  name: "Schwa",      category: "MID CENTRAL",  example: "about",  description: "Mid central vowel — the most common English vowel.",       tips: ["Mid-central unrounded vowel", "Found in: about, supply"],     type: "vowel" },
  // ── Consonants ──
  { symbol: "/p/",   rawSymbol: "p",  name: "P",          category: "BILABIAL",     example: "pen",    description: "Voiceless bilabial plosive — the 'p' in 'pen'.",           tips: ["Both lips pressed together", "Release a burst of air"],       type: "consonant" },
  { symbol: "/b/",   rawSymbol: "b",  name: "B",          category: "BILABIAL",     example: "bed",    description: "Voiced bilabial plosive — the 'b' in 'bed'.",              tips: ["Both lips pressed together", "Add vocal cord vibration"],     type: "consonant" },
  { symbol: "/t/",   rawSymbol: "t",  name: "T",          category: "ALVEOLAR",     example: "ten",    description: "Voiceless alveolar plosive — the 't' in 'ten'.",           tips: ["Tongue tip to alveolar ridge", "Release sharply"],            type: "consonant" },
  { symbol: "/d/",   rawSymbol: "d",  name: "D",          category: "ALVEOLAR",     example: "dog",    description: "Voiced alveolar plosive — the 'd' in 'dog'.",              tips: ["Tongue tip to alveolar ridge", "Add voice"],                  type: "consonant" },
  { symbol: "/k/",   rawSymbol: "k",  name: "K",          category: "VELAR",        example: "cat",    description: "Voiceless velar plosive — the 'c' in 'cat'.",              tips: ["Back of tongue to velum", "Release burst of air"],            type: "consonant" },
  { symbol: "/g/",   rawSymbol: "g",  name: "G",          category: "VELAR",        example: "go",     description: "Voiced velar plosive — the 'g' in 'go'.",                 tips: ["Back of tongue to velum", "Add voice"],                       type: "consonant" },
  { symbol: "/f/",   rawSymbol: "f",  name: "F",          category: "LABIODENTAL",  example: "fan",    description: "Voiceless labiodental fricative — the 'f' in 'fan'.",      tips: ["Upper teeth on lower lip", "Continuous airflow"],             type: "consonant" },
  { symbol: "/v/",   rawSymbol: "v",  name: "V",          category: "LABIODENTAL",  example: "van",    description: "Voiced labiodental fricative — the 'v' in 'van'.",         tips: ["Upper teeth on lower lip", "Add voice"],                      type: "consonant" },
  { symbol: "/θ/",   rawSymbol: "θ",  name: "Theta",      category: "DENTAL PH.",   example: "think",  description: "Voiceless dental fricative — the 'th' in 'think'.",        tips: ["Tongue tip between teeth", "Blow air through"],               type: "consonant" },
  { symbol: "/ð/",   rawSymbol: "ð",  name: "Eth",        category: "DENTAL PH.",   example: "this",   description: "Voiced dental fricative — the 'th' in 'this'.",            tips: ["Tongue tip between teeth", "Add voice"],                      type: "consonant" },
  { symbol: "/s/",   rawSymbol: "s",  name: "S",          category: "ALVEOLAR",     example: "see",    description: "Voiceless alveolar fricative — the 's' in 'see'.",         tips: ["Tongue near alveolar ridge", "High-pitched hiss"],            type: "consonant" },
  { symbol: "/z/",   rawSymbol: "z",  name: "Z",          category: "ALVEOLAR",     example: "zoo",    description: "Voiced alveolar fricative — the 'z' in 'zoo'.",            tips: ["Same position as /s/", "Add vocal buzz"],                     type: "consonant" },
  { symbol: "/ʃ/",   rawSymbol: "ʃ",  name: "Sh",         category: "PALATO-ALV.",  example: "she",    description: "Voiceless palato-alveolar fricative — the 'sh' in 'she'.", tips: ["Tongue further back than /s/", "Lips slightly forward"],      type: "consonant" },
  { symbol: "/ʒ/",   rawSymbol: "ʒ",  name: "Zh",         category: "PALATO-ALV.",  example: "vision", description: "Voiced palato-alveolar fricative — the 's' in 'vision'.",  tips: ["Same as /ʃ/ with voice", "Lips slightly forward"],            type: "consonant" },
  { symbol: "/h/",   rawSymbol: "h",  name: "H",          category: "GLOTTAL",      example: "hat",    description: "Voiceless glottal fricative — the 'h' in 'hat'.",          tips: ["Produced at the glottis", "Breathy, open sound"],             type: "consonant" },
  { symbol: "/tʃ/",  rawSymbol: "ʃ",  name: "Ch",         category: "AFFRICATE",    example: "church", description: "Voiceless palato-alveolar affricate — the 'ch' in 'church'.", tips: ["Start with /t/ stop", "Release into /ʃ/"],               type: "consonant" },
  { symbol: "/dʒ/",  rawSymbol: "ʒ",  name: "J",          category: "AFFRICATE",    example: "judge",  description: "Voiced palato-alveolar affricate — the 'j' in 'judge'.",  tips: ["Start with /d/ stop", "Release into /ʒ/"],                    type: "consonant" },
  { symbol: "/m/",   rawSymbol: "m",  name: "M",          category: "NASAL",        example: "man",    description: "Voiced bilabial nasal — the 'm' in 'man'.",                tips: ["Lips pressed together", "Air flows through the nose"],        type: "consonant" },
  { symbol: "/n/",   rawSymbol: "n",  name: "N",          category: "NASAL",        example: "no",     description: "Voiced alveolar nasal — the 'n' in 'no'.",                 tips: ["Tongue tip to alveolar ridge", "Air through nose"],           type: "consonant" },
  { symbol: "/ŋ/",   rawSymbol: "ŋ",  name: "Ng",         category: "VELAR NASAL",  example: "sing",   description: "Voiced velar nasal — the 'ng' in 'sing'.",                 tips: ["Back of tongue to velum", "Air through nose"],                type: "consonant" },
  { symbol: "/l/",   rawSymbol: "l",  name: "L",          category: "LATERAL",      example: "leg",    description: "Voiced alveolar lateral approximant — the 'l' in 'leg'.",  tips: ["Tongue tip to alveolar ridge", "Air flows around sides"],     type: "consonant" },
  { symbol: "/r/",   rawSymbol: "ɹ",  name: "R",          category: "APPROXIMANT",  example: "red",    description: "Voiced alveolar approximant — the 'r' in 'red'.",          tips: ["Tongue near alveolar ridge", "No contact — glide sound"],     type: "consonant" },
  { symbol: "/j/",   rawSymbol: "j",  name: "Y",          category: "PALATAL",      example: "yes",    description: "Voiced palatal approximant — the 'y' in 'yes'.",           tips: ["Tongue near hard palate", "Glide into the following vowel"],  type: "consonant" },
  { symbol: "/w/",   rawSymbol: "w",  name: "W",          category: "LABIAL-VEL.",  example: "wet",    description: "Voiced labial-velar approximant — the 'w' in 'wet'.",      tips: ["Lips rounded at start", "Back of tongue raised"],             type: "consonant" },
  // ── Diphthongs ──
  { symbol: "/eɪ/",  rawSymbol: "e",  name: "A sound",    category: "DIPHTHONG",    example: "day",    description: "Closing front diphthong — the 'ay' in 'day'.",             tips: ["Start at mid-front /e/", "Glide smoothly up to /ɪ/"],         type: "diphthong" },
  { symbol: "/aɪ/",  rawSymbol: "a",  name: "I sound",    category: "DIPHTHONG",    example: "time",   description: "Closing front diphthong — the 'i' in 'time'.",             tips: ["Start open /a/", "Glide up to near-high /ɪ/"],                type: "diphthong" },
  { symbol: "/ɔɪ/",  rawSymbol: "ɔ",  name: "OY sound",   category: "DIPHTHONG",    example: "boy",    description: "Closing diphthong — the 'oy' in 'boy'.",                   tips: ["Start rounded /ɔ/", "Glide forward to /ɪ/"],                  type: "diphthong" },
  { symbol: "/əʊ/",  rawSymbol: "ə",  name: "O sound",    category: "DIPHTHONG",    example: "go",     description: "Closing back diphthong — the 'o' in 'go'.",               tips: ["Start central /ə/", "Round lips and glide to /ʊ/"],           type: "diphthong" },
  { symbol: "/aʊ/",  rawSymbol: "a",  name: "OW sound",   category: "DIPHTHONG",    example: "now",    description: "Closing back diphthong — the 'ow' in 'now'.",              tips: ["Start open /a/", "Round and glide to /ʊ/"],                   type: "diphthong" },
  { symbol: "/ɪə/",  rawSymbol: "ɪ",  name: "EAR sound",  category: "DIPHTHONG",    example: "here",   description: "Centering diphthong — the 'ear' in 'here'.",               tips: ["Start near-high /ɪ/", "Glide to central schwa /ə/"],          type: "diphthong" },
  { symbol: "/eə/",  rawSymbol: "e",  name: "AIR sound",  category: "DIPHTHONG",    example: "there",  description: "Centering diphthong — the 'air' in 'there'.",              tips: ["Start mid-front /e/", "Glide to central schwa /ə/"],          type: "diphthong" },
  { symbol: "/ʊə/",  rawSymbol: "ʊ",  name: "TOUR sound", category: "DIPHTHONG",    example: "tour",   description: "Centering diphthong — the 'ure' in 'tour'.",               tips: ["Start near-high back /ʊ/", "Glide to central schwa /ə/"],     type: "diphthong" },
];

const DEFAULT_PHONEME = PHONEMES.find((p) => p.rawSymbol === "ə")!;

// ─── Type colors ──────────────────────────────────────────────────────────────
const TYPE_PILL: Record<string, Record<string, string>> = {
  vowel:      { light: 'var(--btn-regular-bg)', text: 'var(--primary)' },
  consonant:  { light: 'var(--btn-regular-bg)', text: 'var(--primary)' },
  diphthong:  { light: 'var(--btn-regular-bg)', text: 'var(--primary)' },
};

type FilterType = "all" | "vowel" | "consonant" | "diphthong";

// ─── Phoneme Card ─────────────────────────────────────────────────────────────
function PhonemeCard({
  phoneme,
  isPlaying,
  isSelected,
  onPlay,
  onSelect,
}: {
  phoneme: PhonemeData;
  isPlaying: boolean;
  isSelected: boolean;
  onPlay: (e: React.MouseEvent) => void;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group relative text-left rounded-2xl p-4 border transition-all duration-200"
      style={{
        backgroundColor: isSelected ? 'var(--primary)' : 'var(--card-bg)',
        borderColor: isSelected ? 'var(--primary)' : 'var(--line-divider)',
        color: isSelected ? 'white' : 'var(--text-primary)',
      }}
    >
      <span className="text-2xl font-bold font-serif block mb-1" style={{
        color: isSelected ? 'white' : 'var(--text-primary)',
      }}>
        {phoneme.symbol}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{
        color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--primary)',
      }}>
        {phoneme.category}
      </span>
      <span className="text-xs font-medium" style={{
        color: isSelected ? 'rgba(255,255,255,0.5)' : 'var(--text-secondary)',
      }}>
        {phoneme.example}
      </span>

      {/* Play indicator */}
      {isPlaying && (
        <span className="absolute bottom-2 right-2 flex gap-0.5 items-end">
          <span className="w-0.5 h-2 rounded-full animate-bounce bg-current" style={{ animationDelay: "0ms" }} />
          <span className="w-0.5 h-3 rounded-full animate-bounce bg-current" style={{ animationDelay: "100ms" }} />
          <span className="w-0.5 h-2 rounded-full animate-bounce bg-current" style={{ animationDelay: "200ms" }} />
        </span>
      )}

      {/* Hover play hint */}
      <span
        role="button"
        onClick={onPlay}
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-opacity duration-150 opacity-0 group-hover:opacity-100"
        style={{
          backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--btn-regular-bg)',
          color: isSelected ? 'white' : 'var(--primary)',
        }}
      >
        ▶
      </span>
    </button>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function PhonemeRow({
  phoneme,
  isPlaying,
  isSelected,
  onPlay,
  onSelect,
}: {
  phoneme: PhonemeData;
  isPlaying: boolean;
  isSelected: boolean;
  onPlay: (e: React.MouseEvent) => void;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all duration-200"
      style={{
        backgroundColor: isSelected ? 'var(--primary)' : 'var(--card-bg)',
        borderColor: isSelected ? 'var(--primary)' : 'var(--line-divider)',
        color: isSelected ? 'white' : 'var(--text-primary)',
      }}
    >
      <span className="text-2xl font-serif font-bold w-16 shrink-0" style={{
        color: isSelected ? 'white' : 'var(--text-primary)',
      }}>
        {phoneme.symbol}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider w-28 shrink-0" style={{
        color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--primary)',
      }}>
        {phoneme.category}
      </span>
      <span className="flex-1 text-sm" style={{
        color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
      }}>
        {phoneme.name}
      </span>
      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--btn-regular-bg)',
        color: isSelected ? 'white' : 'var(--primary)',
      }}>
        {phoneme.example}
      </span>
      <span
        role="button"
        onClick={onPlay}
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0"
        style={{
          backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--btn-regular-bg)',
          color: isSelected ? 'white' : 'var(--primary)',
        }}
      >
        {isPlaying ? "■" : "▶"}
      </span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IPAChart() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeData>(DEFAULT_PHONEME);
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null);
  const [gridView, setGridView] = useState<"grid" | "list">("grid");
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      currentAudioRef.current?.pause();
    };
  }, []);

  const playSound = (rawSymbol: string) => {
    const fileName = AUDIO_MAP[rawSymbol];
    if (!fileName) return;

    currentAudioRef.current?.pause();

    try {
      setPlayingSymbol(rawSymbol);
      const audio = new Audio(`${SOUNDS_BASE_URL}/${fileName}`);
      currentAudioRef.current = audio;
      audio.onended = () => setPlayingSymbol(null);
      audio.onerror = () => setPlayingSymbol(null);
      audio.play().catch((err) => {
        if (err.name !== "AbortError" && err.name !== "NotAllowedError") {
          console.error(`Playback failed for ${rawSymbol}:`, err);
        }
        setPlayingSymbol(null);
      });
    } catch {
      setPlayingSymbol(null);
    }
  };

  const filteredPhonemes =
    activeFilter === "all"
      ? PHONEMES
      : PHONEMES.filter((p) => p.type === activeFilter);

  const FILTER_TABS: { id: FilterType; label: string; icon: string }[] = [
    { id: "all",       label: "All Sounds",  icon: "∞" },
    { id: "vowel",     label: "Vowels",       icon: "👄" },
    { id: "consonant", label: "Consonants",   icon: "🗣" },
    { id: "diphthong", label: "Diphthongs",   icon: "◈" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: activeFilter === tab.id ? 'var(--primary)' : 'var(--card-bg)',
              color: activeFilter === tab.id ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${activeFilter === tab.id ? 'var(--primary)' : 'var(--line-divider)'}`,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

        {/* ── Left Panel ── */}
        <div className="space-y-4">

          {/* Featured Phoneme Card */}
          <div className="rounded-3xl p-6 shadow-sm border" style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--line-divider)',
          }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{
              color: 'var(--text-secondary)',
            }}>
              Featured Phoneme
            </p>

            <div className="flex items-center gap-4 mb-1">
              <span className="text-6xl font-serif leading-none" style={{
                color: 'var(--text-primary)',
              }}>
                {selectedPhoneme.symbol}
              </span>
              <button
                onClick={() => playSound(selectedPhoneme.rawSymbol)}
                disabled={!AUDIO_MAP[selectedPhoneme.rawSymbol]}
                className="w-12 h-12 disabled:opacity-40 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white text-lg transition-colors"
                style={{
                  backgroundColor: 'var(--admonitions-color-tip)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {playingSymbol === selectedPhoneme.rawSymbol ? "■" : "▶"}
              </button>
            </div>

            <p className="text-sm font-semibold mb-4" style={{
              color: 'var(--text-secondary)',
            }}>
              {selectedPhoneme.name}
            </p>

            {/* Articulatory placeholder */}
            <div className="rounded-2xl h-28 flex items-center justify-center mb-4 overflow-hidden relative" style={{
              backgroundColor: 'var(--btn-regular-bg)',
            }}>
              <span className="text-8xl font-serif select-none leading-none" style={{
                color: 'var(--primary)',
                opacity: 0.3,
              }}>
                {selectedPhoneme.symbol}
              </span>
              <span className="absolute bottom-2 right-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{
                backgroundColor: TYPE_PILL[selectedPhoneme.type].light,
                color: TYPE_PILL[selectedPhoneme.type].text,
              }}>
                {selectedPhoneme.type}
              </span>
            </div>

            <ul className="space-y-2">
              {selectedPhoneme.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{
                  color: 'var(--text-secondary)',
                }}>
                  <span className="mt-0.5 shrink-0" style={{
                    color: 'var(--admonitions-color-tip)',
                  }}>●</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Practice Mode */}
          <div className="rounded-3xl p-6 text-white" style={{
            backgroundColor: 'var(--primary)',
          }}>
            <h3 className="font-bold text-base mb-1">Practice Mode</h3>
            <p className="text-sm leading-relaxed mb-5" style={{
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              Compare your pronunciation with AI-powered feedback.
            </p>
            <button className="w-full border text-white rounded-2xl py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2" style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderColor: 'rgba(255,255,255,0.3)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
            >
              <span>🎤</span>
              Enable Microphone
            </button>
          </div>
        </div>

        {/* ── Right Panel: Grid ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{
              color: 'var(--text-primary)',
            }}>
              IPA Symbols Grid
            </h2>
            <div className="flex gap-1 rounded-xl p-1 border" style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--line-divider)',
            }}>
              <button
                onClick={() => setGridView("grid")}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: gridView === "grid" ? 'var(--btn-regular-bg)' : 'transparent',
                  color: gridView === "grid" ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                ⊞
              </button>
              <button
                onClick={() => setGridView("list")}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: gridView === "list" ? 'var(--btn-regular-bg)' : 'transparent',
                  color: gridView === "list" ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                ☰
              </button>
            </div>
          </div>

          {gridView === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredPhonemes.map((phoneme) => (
                <PhonemeCard
                  key={phoneme.symbol}
                  phoneme={phoneme}
                  isPlaying={playingSymbol === phoneme.rawSymbol}
                  isSelected={selectedPhoneme.symbol === phoneme.symbol}
                  onPlay={(e) => { e.stopPropagation(); playSound(phoneme.rawSymbol); }}
                  onSelect={() => setSelectedPhoneme(phoneme)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPhonemes.map((phoneme) => (
                <PhonemeRow
                  key={phoneme.symbol}
                  phoneme={phoneme}
                  isPlaying={playingSymbol === phoneme.rawSymbol}
                  isSelected={selectedPhoneme.symbol === phoneme.symbol}
                  onPlay={(e) => { e.stopPropagation(); playSound(phoneme.rawSymbol); }}
                  onSelect={() => setSelectedPhoneme(phoneme)}
                />
              ))}
            </div>
          )}

          {/* Custom Set hint */}
          {filteredPhonemes.length > 0 && (
            <div className="mt-4 flex justify-center">
              <button className="flex items-center gap-2 text-sm transition-colors px-6 py-3 rounded-2xl font-medium border-2 border-dashed" style={{
                color: 'var(--text-secondary)',
                borderColor: 'var(--line-divider)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--line-divider)';
              }}
              >
                <span className="text-lg">+</span>
                Custom Set
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Smart Phonology AI Banner */}
      <div className="rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 border" style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--line-divider)',
      }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shrink-0" style={{
          backgroundColor: 'var(--primary)',
        }}>
          ✦
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-0.5" style={{color: 'var(--text-primary)'}}>
            Smart Phonology AI
          </h3>
          <p className="text-sm leading-relaxed" style={{
            color: 'var(--text-secondary)',
          }}>
            Our AI detects nuances in your accent and suggests specific IPA targets to improve clarity.
            Click any symbol to start training.
          </p>
        </div>
        <button className="text-white px-6 py-3 rounded-2xl font-semibold text-sm transition-colors shrink-0 whitespace-nowrap" style={{
          backgroundColor: 'var(--primary)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
        >
          Analyze Voice
        </button>
      </div>
    </div>
  );
}
