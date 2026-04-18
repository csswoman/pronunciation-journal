export interface PhonemeData {
  symbol: string;
  rawSymbol: string;
  name: string;
  category: string;
  example: string;
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

export const PHONEMES: PhonemeData[] = [
  { symbol: "/iː/", rawSymbol: "i", name: "Long E", category: "HIGH FRONT", example: "see", description: "Close front unrounded vowel - the 'ee' in 'see'.", tips: ["Stretch lips wide", "Tongue high and forward"], type: "vowel" },
  { symbol: "/ɪ/", rawSymbol: "ɪ", name: "Short I", category: "NEAR-HIGH", example: "sit", description: "Near-close front unrounded vowel - the 'i' in 'sit'.", tips: ["Relaxed lip position", "Tongue slightly lower than /iː/"], type: "vowel" },
  { symbol: "/e/", rawSymbol: "e", name: "Short E", category: "MID FRONT", example: "bed", description: "Close-mid front unrounded vowel - the 'e' in 'bed'.", tips: ["Lips slightly spread", "Tongue at mid-front position"], type: "vowel" },
  { symbol: "/æ/", rawSymbol: "æ", name: "Ash", category: "LOW FRONT", example: "cat", description: "Near-open front unrounded vowel - the 'a' in 'cat'.", tips: ["Mouth wide open", "Tongue low and forward"], type: "vowel" },
  { symbol: "/ɑː/", rawSymbol: "ɑ", name: "Long A", category: "OPEN BACK", example: "car", description: "Open back unrounded vowel - the 'ar' in 'car'.", tips: ["Mouth fully open", "Tongue low and back"], type: "vowel" },
  { symbol: "/ɒ/", rawSymbol: "ɒ", name: "Short O", category: "OPEN ROUND", example: "hot", description: "Open back rounded vowel - the 'o' in 'hot'.", tips: ["Lips rounded", "Mouth wide open"], type: "vowel" },
  { symbol: "/ɔː/", rawSymbol: "ɔ", name: "Long O", category: "MID-BACK", example: "law", description: "Open-mid back rounded vowel - the 'aw' in 'law'.", tips: ["Lips rounded and open", "Tongue low-back"], type: "vowel" },
  { symbol: "/ʊ/", rawSymbol: "ʊ", name: "Short U", category: "NEAR-HIGH", example: "book", description: "Near-close near-back rounded vowel - the 'oo' in 'book'.", tips: ["Lips loosely rounded", "Tongue near-high back"], type: "vowel" },
  { symbol: "/uː/", rawSymbol: "u", name: "Long U", category: "HIGH BACK", example: "moon", description: "Close back rounded vowel - the 'oo' in 'moon'.", tips: ["Lips tightly rounded", "Tongue high and back"], type: "vowel" },
  { symbol: "/ʌ/", rawSymbol: "ʌ", name: "Strut", category: "MID-BACK", example: "cup", description: "Open-mid back unrounded vowel - the 'u' in 'cup'.", tips: ["Lips neutral", "Tongue mid-back position"], type: "vowel" },
  { symbol: "/ɜː/", rawSymbol: "ɜ", name: "Nurse", category: "MID CENTRAL", example: "bird", description: "Open-mid central unrounded vowel - the 'ir' in 'bird'.", tips: ["Lips neutral", "Tongue in neutral central position"], type: "vowel" },
  { symbol: "/ə/", rawSymbol: "ə", name: "Schwa", category: "MID CENTRAL", example: "about", description: "Mid central vowel - the most common English vowel.", tips: ["Mid-central unrounded vowel", "Found in: about, supply"], type: "vowel" },
  { symbol: "/p/", rawSymbol: "p", name: "P", category: "BILABIAL", example: "pen", description: "Voiceless bilabial plosive - the 'p' in 'pen'.", tips: ["Both lips pressed together", "Release a burst of air"], type: "consonant" },
  { symbol: "/b/", rawSymbol: "b", name: "B", category: "BILABIAL", example: "bed", description: "Voiced bilabial plosive - the 'b' in 'bed'.", tips: ["Both lips pressed together", "Add vocal cord vibration"], type: "consonant" },
  { symbol: "/t/", rawSymbol: "t", name: "T", category: "ALVEOLAR", example: "ten", description: "Voiceless alveolar plosive - the 't' in 'ten'.", tips: ["Tongue tip to alveolar ridge", "Release sharply"], type: "consonant" },
  { symbol: "/d/", rawSymbol: "d", name: "D", category: "ALVEOLAR", example: "dog", description: "Voiced alveolar plosive - the 'd' in 'dog'.", tips: ["Tongue tip to alveolar ridge", "Add voice"], type: "consonant" },
  { symbol: "/k/", rawSymbol: "k", name: "K", category: "VELAR", example: "cat", description: "Voiceless velar plosive - the 'c' in 'cat'.", tips: ["Back of tongue to velum", "Release burst of air"], type: "consonant" },
  { symbol: "/g/", rawSymbol: "g", name: "G", category: "VELAR", example: "go", description: "Voiced velar plosive - the 'g' in 'go'.", tips: ["Back of tongue to velum", "Add voice"], type: "consonant" },
  { symbol: "/f/", rawSymbol: "f", name: "F", category: "LABIODENTAL", example: "fan", description: "Voiceless labiodental fricative - the 'f' in 'fan'.", tips: ["Upper teeth on lower lip", "Continuous airflow"], type: "consonant" },
  { symbol: "/v/", rawSymbol: "v", name: "V", category: "LABIODENTAL", example: "van", description: "Voiced labiodental fricative - the 'v' in 'van'.", tips: ["Upper teeth on lower lip", "Add voice"], type: "consonant" },
  { symbol: "/θ/", rawSymbol: "θ", name: "Theta", category: "DENTAL PH.", example: "think", description: "Voiceless dental fricative - the 'th' in 'think'.", tips: ["Tongue tip between teeth", "Blow air through"], type: "consonant" },
  { symbol: "/ð/", rawSymbol: "ð", name: "Eth", category: "DENTAL PH.", example: "this", description: "Voiced dental fricative - the 'th' in 'this'.", tips: ["Tongue tip between teeth", "Add voice"], type: "consonant" },
  { symbol: "/s/", rawSymbol: "s", name: "S", category: "ALVEOLAR", example: "see", description: "Voiceless alveolar fricative - the 's' in 'see'.", tips: ["Tongue near alveolar ridge", "High-pitched hiss"], type: "consonant" },
  { symbol: "/z/", rawSymbol: "z", name: "Z", category: "ALVEOLAR", example: "zoo", description: "Voiced alveolar fricative - the 'z' in 'zoo'.", tips: ["Same position as /s/", "Add vocal buzz"], type: "consonant" },
  { symbol: "/ʃ/", rawSymbol: "ʃ", name: "Sh", category: "PALATO-ALV.", example: "she", description: "Voiceless palato-alveolar fricative - the 'sh' in 'she'.", tips: ["Tongue further back than /s/", "Lips slightly forward"], type: "consonant" },
  { symbol: "/ʒ/", rawSymbol: "ʒ", name: "Zh", category: "PALATO-ALV.", example: "vision", description: "Voiced palato-alveolar fricative - the 's' in 'vision'.", tips: ["Same as /ʃ/ with voice", "Lips slightly forward"], type: "consonant" },
  { symbol: "/h/", rawSymbol: "h", name: "H", category: "GLOTTAL", example: "hat", description: "Voiceless glottal fricative - the 'h' in 'hat'.", tips: ["Produced at the glottis", "Breathy, open sound"], type: "consonant" },
  { symbol: "/tʃ/", rawSymbol: "ʃ", name: "Ch", category: "AFFRICATE", example: "church", description: "Voiceless palato-alveolar affricate - the 'ch' in 'church'.", tips: ["Start with /t/ stop", "Release into /ʃ/"], type: "consonant" },
  { symbol: "/dʒ/", rawSymbol: "ʒ", name: "J", category: "AFFRICATE", example: "judge", description: "Voiced palato-alveolar affricate - the 'j' in 'judge'.", tips: ["Start with /d/ stop", "Release into /ʒ/"], type: "consonant" },
  { symbol: "/m/", rawSymbol: "m", name: "M", category: "NASAL", example: "man", description: "Voiced bilabial nasal - the 'm' in 'man'.", tips: ["Lips pressed together", "Air flows through the nose"], type: "consonant" },
  { symbol: "/n/", rawSymbol: "n", name: "N", category: "NASAL", example: "no", description: "Voiced alveolar nasal - the 'n' in 'no'.", tips: ["Tongue tip to alveolar ridge", "Air through nose"], type: "consonant" },
  { symbol: "/ŋ/", rawSymbol: "ŋ", name: "Ng", category: "VELAR NASAL", example: "sing", description: "Voiced velar nasal - the 'ng' in 'sing'.", tips: ["Back of tongue to velum", "Air through nose"], type: "consonant" },
  { symbol: "/l/", rawSymbol: "l", name: "L", category: "LATERAL", example: "leg", description: "Voiced alveolar lateral approximant - the 'l' in 'leg'.", tips: ["Tongue tip to alveolar ridge", "Air flows around sides"], type: "consonant" },
  { symbol: "/r/", rawSymbol: "ɹ", name: "R", category: "APPROXIMANT", example: "red", description: "Voiced alveolar approximant - the 'r' in 'red'.", tips: ["Tongue near alveolar ridge", "No contact - glide sound"], type: "consonant" },
  { symbol: "/j/", rawSymbol: "j", name: "Y", category: "PALATAL", example: "yes", description: "Voiced palatal approximant - the 'y' in 'yes'.", tips: ["Tongue near hard palate", "Glide into the following vowel"], type: "consonant" },
  { symbol: "/w/", rawSymbol: "w", name: "W", category: "LABIAL-VEL.", example: "wet", description: "Voiced labial-velar approximant - the 'w' in 'wet'.", tips: ["Lips rounded at start", "Back of tongue raised"], type: "consonant" },
  { symbol: "/eɪ/", rawSymbol: "e", name: "A sound", category: "DIPHTHONG", example: "day", description: "Closing front diphthong - the 'ay' in 'day'.", tips: ["Start at mid-front /e/", "Glide smoothly up to /ɪ/"], type: "diphthong" },
  { symbol: "/aɪ/", rawSymbol: "a", name: "I sound", category: "DIPHTHONG", example: "time", description: "Closing front diphthong - the 'i' in 'time'.", tips: ["Start open /a/", "Glide up to near-high /ɪ/"], type: "diphthong" },
  { symbol: "/ɔɪ/", rawSymbol: "ɔ", name: "OY sound", category: "DIPHTHONG", example: "boy", description: "Closing diphthong - the 'oy' in 'boy'.", tips: ["Start rounded /ɔ/", "Glide forward to /ɪ/"], type: "diphthong" },
  { symbol: "/əʊ/", rawSymbol: "ə", name: "O sound", category: "DIPHTHONG", example: "go", description: "Closing back diphthong - the 'o' in 'go'.", tips: ["Start central /ə/", "Round lips and glide to /ʊ/"], type: "diphthong" },
  { symbol: "/aʊ/", rawSymbol: "a", name: "OW sound", category: "DIPHTHONG", example: "now", description: "Closing back diphthong - the 'ow' in 'now'.", tips: ["Start open /a/", "Round and glide to /ʊ/"], type: "diphthong" },
  { symbol: "/ɪə/", rawSymbol: "ɪ", name: "EAR sound", category: "DIPHTHONG", example: "here", description: "Centering diphthong - the 'ear' in 'here'.", tips: ["Start near-high /ɪ/", "Glide to central schwa /ə/"], type: "diphthong" },
  { symbol: "/eə/", rawSymbol: "e", name: "AIR sound", category: "DIPHTHONG", example: "there", description: "Centering diphthong - the 'air' in 'there'.", tips: ["Start mid-front /e/", "Glide to central schwa /ə/"], type: "diphthong" },
  { symbol: "/ʊə/", rawSymbol: "ʊ", name: "TOUR sound", category: "DIPHTHONG", example: "tour", description: "Centering diphthong - the 'ure' in 'tour'.", tips: ["Start near-high back /ʊ/", "Glide to central schwa /ə/"], type: "diphthong" },
];

export const DEFAULT_PHONEME = PHONEMES.find((phoneme) => phoneme.rawSymbol === "ə")!;
