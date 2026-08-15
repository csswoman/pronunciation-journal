export interface PhonemeData {
  symbol: string;
  rawSymbol: string;
  name: string;
  category: string;
  examples: string[];
  description: string;
  tips: string[];
  type: "vowel" | "consonant" | "diphthong";
}

export type FilterType = "all" | "vowel" | "consonant" | "diphthong";

export const TYPE_PILL: Record<PhonemeData["type"], { light: string; text: string }> = {
  vowel: { light: "var(--btn-regular-bg)", text: "var(--primary)" },
  consonant: { light: "var(--btn-regular-bg)", text: "var(--primary)" },
  diphthong: { light: "var(--btn-regular-bg)", text: "var(--primary)" },
};

export const FILTER_TABS: { id: FilterType; label: string; icon: string }[] = [
  { id: "all", label: "All Sounds", icon: "∞" },
  { id: "vowel", label: "Vowels", icon: "👄" },
  { id: "consonant", label: "Consonants", icon: "🗣" },
  { id: "diphthong", label: "Diphthongs", icon: "◈" },
];

// Phoneme inventory: General American (GA / American English) — 40 phonemes
// 11 monophthongs + 24 consonants + 5 diphthongs
// Aligned with the CMU/ARPAbet dictionary used in lib/pronunciation/phonemes.ts.
export const PHONEMES: PhonemeData[] = [
  // ─── MONOPHTHONGS ───────────────────────────────────────────────────────
  { symbol: "/iː/", rawSymbol: "i", name: "Fleece", category: "HIGH FRONT", examples: ["see", "tree", "key", "feet", "machine"], description: "Close front unrounded vowel — the 'ee' in 'see'. Tense.", tips: ["Stretch lips wide", "Tongue high and forward"], type: "vowel" },
  { symbol: "/ɪ/", rawSymbol: "ɪ", name: "Kit", category: "NEAR-HIGH FRONT", examples: ["sit", "ship", "big", "milk", "live"], description: "Near-close near-front unrounded vowel — the 'i' in 'sit'. Lax.", tips: ["Relaxed lip position", "Tongue slightly lower than /iː/"], type: "vowel" },
  { symbol: "/ɛ/", rawSymbol: "ɛ", name: "Dress", category: "OPEN-MID FRONT", examples: ["bed", "red", "pen", "head", "many"], description: "Open-mid front unrounded vowel — the 'e' in 'bed'. More open than Spanish 'e'.", tips: ["Lips slightly spread", "Jaw more open than Spanish 'e'"], type: "vowel" },
  { symbol: "/æ/", rawSymbol: "æ", name: "Trap", category: "NEAR-LOW FRONT", examples: ["cat", "bad", "hand", "apple", "back"], description: "Near-open front unrounded vowel — the 'a' in 'cat'.", tips: ["Mouth wide open", "Tongue low and forward"], type: "vowel" },
  { symbol: "/ɑ/", rawSymbol: "ɑ", name: "Lot", category: "OPEN BACK", examples: ["hot", "stop", "box", "shop", "clock"], description: "Open back unrounded vowel — the 'o' in 'hot'.", tips: ["Mouth fully open", "Tongue low and back", "Lips unrounded even when spelled 'o'"], type: "vowel" },
  { symbol: "/ɔ/", rawSymbol: "ɔ", name: "Thought", category: "MID-BACK ROUND", examples: ["law", "ball", "talk", "caught", "door"], description: "Open-mid back rounded vowel — the 'aw' in 'law'. Many American speakers merge it with /ɑ/ (cot–caught merger).", tips: ["Lips lightly rounded", "Tongue mid-low back"], type: "vowel" },
  { symbol: "/ʊ/", rawSymbol: "ʊ", name: "Foot", category: "NEAR-HIGH BACK", examples: ["book", "put", "good", "could", "woman"], description: "Near-close near-back rounded vowel — the 'oo' in 'book'. Lax.", tips: ["Lips loosely rounded", "Tongue near-high back"], type: "vowel" },
  { symbol: "/uː/", rawSymbol: "u", name: "Goose", category: "HIGH BACK", examples: ["moon", "food", "blue", "shoe", "two"], description: "Close back rounded vowel — the 'oo' in 'moon'. Tense.", tips: ["Lips tightly rounded", "Tongue high and back"], type: "vowel" },
  { symbol: "/ʌ/", rawSymbol: "ʌ", name: "Strut", category: "MID-BACK", examples: ["cup", "love", "run", "blood", "young"], description: "Open-mid back unrounded vowel — the 'u' in 'cup'. Found in stressed syllables (its unstressed counterpart is the schwa).", tips: ["Lips neutral", "Tongue mid-back position"], type: "vowel" },
  { symbol: "/ɜr/", rawSymbol: "ɜr", name: "Nurse", category: "MID CENTRAL R-COLORED", examples: ["bird", "word", "learn", "girl", "work"], description: "R-colored mid central vowel — the 'ur' in 'nurse'. Vowel and R fuse into one sound in American English.", tips: ["Tongue bunched at center, tip curled back", "Vowel and R are one continuous sound"], type: "vowel" },
  { symbol: "/ə/", rawSymbol: "ə", name: "Schwa", category: "MID CENTRAL", examples: ["about", "sofa", "banana", "support", "common"], description: "Mid central unrounded vowel — the most common English vowel, found only in unstressed syllables.", tips: ["Completely relaxed mouth", "Found in: about, sofa, supply"], type: "vowel" },

  // ─── CONSONANTS ─────────────────────────────────────────────────────────
  { symbol: "/p/", rawSymbol: "p", name: "P", category: "BILABIAL", examples: ["pen", "happy", "stop", "apple", "pizza"], description: "Voiceless bilabial plosive — the 'p' in 'pen'.", tips: ["Both lips pressed together", "Release a burst of air"], type: "consonant" },
  { symbol: "/b/", rawSymbol: "b", name: "B", category: "BILABIAL", examples: ["bed", "baby", "job", "rabbit", "book"], description: "Voiced bilabial plosive — the 'b' in 'bed'.", tips: ["Both lips pressed together", "Add vocal cord vibration"], type: "consonant" },
  { symbol: "/t/", rawSymbol: "t", name: "T", category: "ALVEOLAR", examples: ["ten", "water", "cat", "letter", "tomato"], description: "Voiceless alveolar plosive — the 't' in 'ten'.", tips: ["Tongue tip to alveolar ridge", "Release sharply"], type: "consonant" },
  { symbol: "/d/", rawSymbol: "d", name: "D", category: "ALVEOLAR", examples: ["dog", "day", "red", "ladder", "good"], description: "Voiced alveolar plosive — the 'd' in 'dog'.", tips: ["Tongue tip to alveolar ridge", "Add voice"], type: "consonant" },
  { symbol: "/k/", rawSymbol: "k", name: "K", category: "VELAR", examples: ["cat", "key", "book", "school", "quick"], description: "Voiceless velar plosive — the 'c' in 'cat'.", tips: ["Back of tongue to velum", "Release burst of air"], type: "consonant" },
  { symbol: "/g/", rawSymbol: "g", name: "G", category: "VELAR", examples: ["go", "game", "big", "again", "ghost"], description: "Voiced velar plosive — the 'g' in 'go'.", tips: ["Back of tongue to velum", "Add voice"], type: "consonant" },
  { symbol: "/f/", rawSymbol: "f", name: "F", category: "LABIODENTAL", examples: ["fan", "fish", "off", "phone", "laugh"], description: "Voiceless labiodental fricative — the 'f' in 'fan'.", tips: ["Upper teeth on lower lip", "Continuous airflow"], type: "consonant" },
  { symbol: "/v/", rawSymbol: "v", name: "V", category: "LABIODENTAL", examples: ["van", "very", "love", "river", "of"], description: "Voiced labiodental fricative — the 'v' in 'van'.", tips: ["Upper teeth on lower lip", "Add voice"], type: "consonant" },
  { symbol: "/θ/", rawSymbol: "θ", name: "Theta", category: "DENTAL", examples: ["think", "three", "math", "bath", "thirty"], description: "Voiceless dental fricative — the 'th' in 'think'.", tips: ["Tongue tip between teeth", "Blow air through"], type: "consonant" },
  { symbol: "/ð/", rawSymbol: "ð", name: "Eth", category: "DENTAL", examples: ["this", "that", "mother", "weather", "breathe"], description: "Voiced dental fricative — the 'th' in 'this'.", tips: ["Tongue tip between teeth", "Add voice"], type: "consonant" },
  { symbol: "/s/", rawSymbol: "s", name: "S", category: "ALVEOLAR", examples: ["see", "yes", "city", "kiss", "sister"], description: "Voiceless alveolar fricative — the 's' in 'see'.", tips: ["Tongue near alveolar ridge", "High-pitched hiss"], type: "consonant" },
  { symbol: "/z/", rawSymbol: "z", name: "Z", category: "ALVEOLAR", examples: ["zoo", "easy", "dogs", "buzz", "zero"], description: "Voiced alveolar fricative — the 'z' in 'zoo'.", tips: ["Same position as /s/", "Add vocal buzz"], type: "consonant" },
  { symbol: "/ʃ/", rawSymbol: "ʃ", name: "Sh", category: "POSTALVEOLAR", examples: ["she", "shop", "wish", "ocean", "sure"], description: "Voiceless postalveolar fricative — the 'sh' in 'she'.", tips: ["Tongue further back than /s/", "Lips slightly forward"], type: "consonant" },
  { symbol: "/ʒ/", rawSymbol: "ʒ", name: "Zh", category: "POSTALVEOLAR", examples: ["vision", "measure", "pleasure", "garage", "casual"], description: "Voiced postalveolar fricative — the 's' in 'vision'.", tips: ["Same as /ʃ/ with voice", "Lips slightly forward"], type: "consonant" },
  { symbol: "/h/", rawSymbol: "h", name: "H", category: "GLOTTAL", examples: ["hat", "hello", "house", "behind", "who"], description: "Voiceless glottal fricative — the 'h' in 'hat'.", tips: ["Produced at the glottis", "Breathy, open sound"], type: "consonant" },
  { symbol: "/tʃ/", rawSymbol: "tʃ", name: "Ch", category: "AFFRICATE", examples: ["church", "chair", "teach", "watch", "kitchen"], description: "Voiceless postalveolar affricate — the 'ch' in 'church'.", tips: ["Start with /t/ stop", "Release into /ʃ/"], type: "consonant" },
  { symbol: "/dʒ/", rawSymbol: "dʒ", name: "J", category: "AFFRICATE", examples: ["judge", "job", "page", "bridge", "giant"], description: "Voiced postalveolar affricate — the 'j' in 'judge'.", tips: ["Start with /d/ stop", "Release into /ʒ/"], type: "consonant" },
  { symbol: "/m/", rawSymbol: "m", name: "M", category: "BILABIAL NASAL", examples: ["man", "mom", "swim", "summer", "name"], description: "Voiced bilabial nasal — the 'm' in 'man'.", tips: ["Lips pressed together", "Air flows through the nose"], type: "consonant" },
  { symbol: "/n/", rawSymbol: "n", name: "N", category: "ALVEOLAR NASAL", examples: ["no", "night", "run", "funny", "moon"], description: "Voiced alveolar nasal — the 'n' in 'no'.", tips: ["Tongue tip to alveolar ridge", "Air through nose"], type: "consonant" },
  { symbol: "/ŋ/", rawSymbol: "ŋ", name: "Ng", category: "VELAR NASAL", examples: ["sing", "long", "thing", "finger", "young"], description: "Voiced velar nasal — the 'ng' in 'sing'. Never appears at the start of a word.", tips: ["Back of tongue to velum", "Air through nose"], type: "consonant" },
  { symbol: "/l/", rawSymbol: "l", name: "L", category: "LATERAL", examples: ["leg", "light", "fall", "yellow", "milk"], description: "Voiced alveolar lateral approximant — the 'l' in 'leg'.", tips: ["Tongue tip to alveolar ridge", "Air flows around sides"], type: "consonant" },
  { symbol: "/r/", rawSymbol: "ɹ", name: "R", category: "APPROXIMANT", examples: ["red", "right", "very", "around", "carry"], description: "Voiced postalveolar approximant — the 'r' in 'red'. Often transcribed /ɹ/ in strict IPA.", tips: ["Tongue near alveolar ridge", "No contact — glide sound"], type: "consonant" },
  { symbol: "/j/", rawSymbol: "j", name: "Y", category: "PALATAL", examples: ["yes", "yellow", "you", "young", "beyond"], description: "Voiced palatal approximant — the 'y' in 'yes'.", tips: ["Tongue near hard palate", "Glide into the following vowel"], type: "consonant" },
  { symbol: "/w/", rawSymbol: "w", name: "W", category: "LABIAL-VELAR", examples: ["wet", "water", "away", "queen", "one"], description: "Voiced labial-velar approximant — the 'w' in 'wet'.", tips: ["Lips rounded at start", "Back of tongue raised"], type: "consonant" },

  // ─── DIPHTHONGS ─────────────────────────────────────────────────────────
  // GA has no centering diphthongs (/ɪə eə ʊə/): being rhotic, those words
  // are vowel + /r/ instead — here /hɪr/, hair /hɛr/, tour /tʊr/.
  { symbol: "/eɪ/", rawSymbol: "eɪ", name: "Face", category: "CLOSING DIPHTHONG", examples: ["day", "name", "play", "rain", "great"], description: "Closing front diphthong — the 'ay' in 'day'.", tips: ["Start at mid-front /e/", "Glide smoothly up to /ɪ/"], type: "diphthong" },
  { symbol: "/aɪ/", rawSymbol: "aɪ", name: "Price", category: "CLOSING DIPHTHONG", examples: ["time", "my", "night", "buy", "high"], description: "Closing front diphthong — the 'i' in 'time'.", tips: ["Start open /a/", "Glide up to near-high /ɪ/"], type: "diphthong" },
  { symbol: "/ɔɪ/", rawSymbol: "ɔɪ", name: "Choice", category: "CLOSING DIPHTHONG", examples: ["boy", "coin", "oil", "enjoy", "voice"], description: "Closing diphthong — the 'oy' in 'boy'.", tips: ["Start rounded /ɔ/", "Glide forward to /ɪ/"], type: "diphthong" },
  { symbol: "/oʊ/", rawSymbol: "oʊ", name: "Goat", category: "CLOSING DIPHTHONG", examples: ["go", "home", "no", "boat", "show"], description: "Closing back diphthong — the 'o' in 'go'. Never a flat Spanish 'o': it glides into /ʊ/.", tips: ["Start at rounded mid-back /o/", "Glide to /ʊ/, rounding a bit more"], type: "diphthong" },
  { symbol: "/aʊ/", rawSymbol: "aʊ", name: "Mouth", category: "CLOSING DIPHTHONG", examples: ["now", "out", "house", "cow", "town"], description: "Closing back diphthong — the 'ow' in 'now'.", tips: ["Start open /a/", "Round and glide to /ʊ/"], type: "diphthong" },
];

export const DEFAULT_PHONEME = PHONEMES.find((phoneme) => phoneme.rawSymbol === "ə")!;

export type {
  VowelHeight,
  VowelPosition,
  ConsonantManner,
  ConsonantPlace,
  DiphthongMovement,
  DiphthongStart,
  DiphthongGlide,
} from "./ipa-matrix";

export {
  VOWEL_ROWS,
  VOWEL_COLS,
  CONSONANT_ROWS,
  CONSONANT_PLACE_ORDER,
  CONSONANT_COLS,
  DIPHTHONG_ROWS,
  DIPHTHONG_COLS,
  PHONEME_MATRIX,
  DIPHTHONG_GLIDES,
  getMatrixConfig,
} from "./ipa-matrix";
