// Inventario: General American (GA) — alineado con el diccionario CMU/ARPAbet
// usado en lib/pronunciation/phonemes.ts y con el TTS americano de la app.
// 11 monoftongos + 24 consonantes + 5 diptongos = 40 fonemas.
// Las claves coinciden con sounds.ipa en Supabase (migración GA).

export type Difficulty = "easy" | "medium" | "hard";
export type SyllablePosition = "initial" | "medial" | "final" | "any";

export interface FinalConsonantPair {
  /** Word ending in the voiced consonant (e.g. "robe" for /b/ vs /p/). */
  wordVoiced: string;
  /** Word ending in the voiceless counterpart (e.g. "rope" for /p/). */
  wordVoiceless: string;
  voicedIpa: string;
  voicelessIpa: string;
}

export interface PhonemeExtra {
  difficulty: Difficulty;
  articulation: string[];
  articulationEs: string[];
  minimalPairs: { wordA: string; wordB: string; phonemeA: string; phonemeB: string }[];
  spanishTip: string;
  /**
   * Minimal pairs practiced specifically in word-final position.
   * Used for Fase 9 final-consonant exercises (devoicing / elision).
   * Only present for consonants where final position is a known L1 problem.
   * Pedagogía: la pista perceptiva principal es la DURACIÓN de la vocal
   * precedente (vocal larga antes de sonora, recortada antes de sorda),
   * no la vibración de la consonante final.
   */
  finalConsonantPairs?: FinalConsonantPair[];
}

export const IPA_EXTRA: Record<string, PhonemeExtra> = {
  "/iː/": {
    difficulty: "easy",
    articulation: [
      "Lips spread wide, like a big smile",
      "Tongue high and pushed forward in the mouth",
      "Tense — keep the muscles firm; it usually lasts longer than /ɪ/",
    ],
    articulationEs: [
      "Estira los labios como en una sonrisa amplia",
      "Lengua alta y hacia adelante en la boca",
      "Tensa — mantén los músculos firmes; suele durar más que /ɪ/",
    ],
    minimalPairs: [
      { wordA: "seat", wordB: "sit", phonemeA: "/iː/", phonemeB: "/ɪ/" },
      { wordA: "feet", wordB: "fit", phonemeA: "/iː/", phonemeB: "/ɪ/" },
      { wordA: "leave", wordB: "live", phonemeA: "/iː/", phonemeB: "/ɪ/" },
    ],
    spanishTip: "Como la 'i' española pero tensa: labios bien estirados y lengua firme. La diferencia clave con /ɪ/ es la tensión y la calidad del sonido — la duración es solo una pista secundaria.",
  },
  "/ɪ/": {
    difficulty: "hard",
    articulation: [
      "Lips relaxed, not spread wide",
      "Tongue slightly lower and more central than /iː/",
      "Lax — do not tense the muscles",
    ],
    articulationEs: [
      "Labios relajados, sin estirar",
      "Lengua un poco más baja y central que en /iː/",
      "Floja (laxa) — no tenses los músculos",
    ],
    minimalPairs: [
      { wordA: "sit", wordB: "seat", phonemeA: "/ɪ/", phonemeB: "/iː/" },
      { wordA: "bit", wordB: "beat", phonemeA: "/ɪ/", phonemeB: "/iː/" },
      { wordA: "ship", wordB: "sheep", phonemeA: "/ɪ/", phonemeB: "/iː/" },
    ],
    spanishTip: "Más relajada que la 'i' española. No es /i/ ni /e/ — está entre las dos. Relaja la mandíbula y no estires los labios. Es el contraste más rentable del inglés: ship/sheep, live/leave.",
  },
  "/ɛ/": {
    difficulty: "medium",
    articulation: [
      "Lips slightly spread, jaw more open than for Spanish 'e'",
      "Tongue at mid-front position, slightly lowered",
      "Short and lax",
    ],
    articulationEs: [
      "Labios ligeramente estirados, mandíbula más abierta que para la 'e' española",
      "Lengua media-delantera, un poco más baja",
      "Corta y relajada",
    ],
    minimalPairs: [
      { wordA: "bed", wordB: "bad", phonemeA: "/ɛ/", phonemeB: "/æ/" },
      { wordA: "pen", wordB: "pan", phonemeA: "/ɛ/", phonemeB: "/æ/" },
      { wordA: "set", wordB: "sat", phonemeA: "/ɛ/", phonemeB: "/æ/" },
    ],
    spanishTip: "Más abierta que la 'e' española — di la 'e' de 'mesa' y baja la mandíbula un paso más. No la conviertas en diptongo ni la cierres.",
  },
  "/æ/": {
    difficulty: "hard",
    articulation: [
      "Mouth wide open, more than for /ɛ/",
      "Tongue low and pushed forward",
      "Lips spread horizontally, almost like a grimace",
    ],
    articulationEs: [
      "Boca muy abierta, más que para /ɛ/",
      "Lengua baja y hacia adelante",
      "Labios estirados horizontalmente, casi como una mueca",
    ],
    minimalPairs: [
      { wordA: "cat", wordB: "cut", phonemeA: "/æ/", phonemeB: "/ʌ/" },
      { wordA: "bad", wordB: "bed", phonemeA: "/æ/", phonemeB: "/ɛ/" },
      { wordA: "man", wordB: "men", phonemeA: "/æ/", phonemeB: "/ɛ/" },
    ],
    spanishTip: "No existe en español. Está entre la 'a' y la 'e': boca muy abierta horizontalmente y lengua hacia adelante. Es la vocal de 'cat', 'man', 'hand'.",
  },
  "/ɑ/": {
    difficulty: "medium",
    articulation: [
      "Mouth fully open, jaw dropped low",
      "Tongue low and pulled back",
      "Lips unrounded — even when the spelling is 'o' (hot, stop)",
    ],
    articulationEs: [
      "Boca completamente abierta, mandíbula caída",
      "Lengua baja y hacia atrás",
      "Labios sin redondear — aunque se escriba con 'o' (hot, stop)",
    ],
    minimalPairs: [
      { wordA: "hot", wordB: "hut", phonemeA: "/ɑ/", phonemeB: "/ʌ/" },
      { wordA: "cop", wordB: "cap", phonemeA: "/ɑ/", phonemeB: "/æ/" },
      { wordA: "stock", wordB: "stack", phonemeA: "/ɑ/", phonemeB: "/æ/" },
    ],
    spanishTip: "Es la 'a' del médico: boca muy abierta y lengua atrás. Clave del americano: la 'o' escrita de 'hot', 'stop', 'box' se pronuncia /ɑ/ — 'hot' suena como 'jat', nunca como 'jot'.",
  },
  "/ɔ/": {
    difficulty: "medium",
    articulation: [
      "Lips lightly rounded",
      "Tongue low-back, slightly raised",
      "More open than the Spanish 'o' — do not close it",
    ],
    articulationEs: [
      "Labios ligeramente redondeados",
      "Lengua trasera baja, un poco elevada",
      "Más abierta que la 'o' española — no la cierres",
    ],
    minimalPairs: [
      { wordA: "law", wordB: "low", phonemeA: "/ɔ/", phonemeB: "/oʊ/" },
      { wordA: "caught", wordB: "coat", phonemeA: "/ɔ/", phonemeB: "/oʊ/" },
      { wordA: "bought", wordB: "boat", phonemeA: "/ɔ/", phonemeB: "/oʊ/" },
    ],
    spanishTip: "Una 'o' abierta con labios poco redondeados: 'law', 'all', 'call'. Ojo: muchos americanos la pronuncian igual que /ɑ/ ('caught' suena como 'cot') — si las oyes iguales es ese merger, no tu oído.",
  },
  "/ʊ/": {
    difficulty: "medium",
    articulation: [
      "Lips loosely rounded, not tightly pursed",
      "Tongue near-high and back, but relaxed",
      "Lax — do not tense or hold it",
    ],
    articulationEs: [
      "Labios ligeramente redondeados, sin tensión",
      "Lengua casi alta y trasera, pero relajada",
      "Floja (laxa) — sin tensión ni esfuerzo",
    ],
    minimalPairs: [
      { wordA: "book", wordB: "boot", phonemeA: "/ʊ/", phonemeB: "/uː/" },
      { wordA: "pull", wordB: "pool", phonemeA: "/ʊ/", phonemeB: "/uː/" },
      { wordA: "full", wordB: "fool", phonemeA: "/ʊ/", phonemeB: "/uː/" },
    ],
    spanishTip: "Más relajada que la 'u' española. No tenses los labios — es la 'u' de 'book' y 'good', muy diferente de la /uː/ tensa de 'moon'.",
  },
  "/uː/": {
    difficulty: "easy",
    articulation: [
      "Lips tightly rounded and pushed forward",
      "Tongue high and pushed back",
      "Tense — keep the rounding firm",
    ],
    articulationEs: [
      "Labios bien redondeados y proyectados hacia adelante",
      "Lengua alta y hacia atrás",
      "Tensa — mantén el redondeo firme",
    ],
    minimalPairs: [
      { wordA: "fool", wordB: "full", phonemeA: "/uː/", phonemeB: "/ʊ/" },
      { wordA: "food", wordB: "foot", phonemeA: "/uː/", phonemeB: "/ʊ/" },
      { wordA: "pool", wordB: "pull", phonemeA: "/uː/", phonemeB: "/ʊ/" },
    ],
    spanishTip: "Similar a la 'u' española pero tensa y con los labios más redondeados. Es el sonido de 'moon' y 'food'. La diferencia con /ʊ/ ('book') es la tensión, no solo la duración.",
  },
  "/ʌ/": {
    difficulty: "hard",
    articulation: [
      "Lips neutral and unrounded",
      "Jaw slightly open, tongue central, a bit back",
      "Short and relaxed — it appears in stressed syllables (cup, luck)",
    ],
    articulationEs: [
      "Labios neutros, sin redondear",
      "Mandíbula entreabierta, lengua central, algo atrás",
      "Corta y relajada — aparece en sílabas tónicas (cup, luck)",
    ],
    minimalPairs: [
      { wordA: "cup", wordB: "cap", phonemeA: "/ʌ/", phonemeB: "/æ/" },
      { wordA: "cut", wordB: "cat", phonemeA: "/ʌ/", phonemeB: "/æ/" },
      { wordA: "luck", wordB: "lock", phonemeA: "/ʌ/", phonemeB: "/ɑ/" },
    ],
    spanishTip: "Parecida a una 'a' con la boca menos abierta y la lengua más central. No es /a/ ni /o/. Es la prima tónica del schwa /ə/: misma zona de la boca, pero en sílaba acentuada — 'cup', 'but', 'love'.",
  },
  "/ɜr/": {
    difficulty: "hard",
    articulation: [
      "Tongue bunched in the center of the mouth, tip curled slightly back — touching nothing",
      "Lips slightly rounded",
      "Vowel and R fuse into a single r-colored sound — hold it",
    ],
    articulationEs: [
      "Lengua agrupada en el centro de la boca, punta ligeramente curvada hacia atrás — sin tocar nada",
      "Labios un poco redondeados",
      "La vocal y la R se funden en un solo sonido con color de R — sostenlo",
    ],
    minimalPairs: [
      { wordA: "hurt", wordB: "heart", phonemeA: "/ɜr/", phonemeB: "/ɑ/" },
      { wordA: "shirt", wordB: "short", phonemeA: "/ɜr/", phonemeB: "/ɔ/" },
      { wordA: "bird", wordB: "beard", phonemeA: "/ɜr/", phonemeB: "/ɪ/" },
    ],
    spanishTip: "No existe en español. Es la vocal con R americana de 'bird', 'word', 'nurse'. No digas vocal + R separadas ni vibres la R: es un único sonido continuo donde la lengua flota curvada.",
  },
  "/ə/": {
    difficulty: "medium",
    articulation: [
      "Completely relaxed — lips, tongue and jaw all neutral",
      "Tongue in central mid position",
      "Only in unstressed syllables — never emphasize it",
    ],
    articulationEs: [
      "Completamente relajado — labios, lengua y mandíbula neutros",
      "Lengua en posición central media",
      "Solo en sílabas átonas — nunca lo acentúes",
    ],
    // El schwa nunca contrasta en sílaba tónica, así que no tiene pares mínimos.
    // Se domina con ritmo y reducción (sílaba fuerte clara, débiles reducidas).
    minimalPairs: [],
    spanishTip: "El sonido más común del inglés y no existe en español. Aparece solo en sílabas átonas: a-BOUT, SO-fa, ba-NA-na (/bəˈnænə/). No tiene pares mínimos — se practica con ritmo: di la sílaba fuerte clara y deja las débiles casi sin vocal, con la boca totalmente relajada.",
  },
  "/p/": {
    difficulty: "easy",
    articulation: [
      "Both lips pressed firmly together",
      "Build up air pressure behind the lips",
      "Release with a small burst of air (aspiration at start of word)",
    ],
    articulationEs: [
      "Ambos labios firmemente cerrados",
      "Acumula presión de aire detrás de los labios",
      "Suelta con un pequeño soplo de aire (aspiración al inicio de palabra)",
    ],
    minimalPairs: [
      { wordA: "pat", wordB: "bat", phonemeA: "/p/", phonemeB: "/b/" },
      { wordA: "pig", wordB: "big", phonemeA: "/p/", phonemeB: "/b/" },
      { wordA: "pie", wordB: "buy", phonemeA: "/p/", phonemeB: "/b/" },
    ],
    spanishTip: "Muy similar a la /p/ española. La diferencia es que en inglés, al inicio de palabra, va seguida de un pequeño soplo de aire (aspiración). Prueba con un papel frente a la boca.",
  },
  "/b/": {
    difficulty: "easy",
    articulation: [
      "Both lips pressed firmly together",
      "Vocal cords vibrate during the sound",
      "Less air released than /p/",
    ],
    articulationEs: [
      "Ambos labios firmemente cerrados",
      "Las cuerdas vocales vibran durante el sonido",
      "Sale menos aire que en /p/",
    ],
    minimalPairs: [
      { wordA: "ban", wordB: "van", phonemeA: "/b/", phonemeB: "/v/" },
      { wordA: "berry", wordB: "very", phonemeA: "/b/", phonemeB: "/v/" },
      { wordA: "bat", wordB: "pat", phonemeA: "/b/", phonemeB: "/p/" },
    ],
    spanishTip: "Igual que la 'b' española al inicio de sílaba (no entre vocales). En posición final ('cab' vs 'cap') la pista clave no es vibrar la /b/: es alargar la vocal anterior — la vocal de 'cab' dura más que la de 'cap'.",
    finalConsonantPairs: [
      { wordVoiced: "robe", wordVoiceless: "rope", voicedIpa: "/b/", voicelessIpa: "/p/" },
      { wordVoiced: "cab", wordVoiceless: "cap", voicedIpa: "/b/", voicelessIpa: "/p/" },
      { wordVoiced: "rib", wordVoiceless: "rip", voicedIpa: "/b/", voicelessIpa: "/p/" },
      { wordVoiced: "tab", wordVoiceless: "tap", voicedIpa: "/b/", voicelessIpa: "/p/" },
    ],
  },
  "/t/": {
    difficulty: "easy",
    articulation: [
      "Tongue tip touches the alveolar ridge (just behind the upper teeth)",
      "Release sharply with a burst of air",
      "Aspirated at the start of stressed syllables",
    ],
    articulationEs: [
      "La punta de la lengua toca la cresta alveolar (detrás de los dientes superiores)",
      "Suelta con un golpe de aire",
      "Aspirada al inicio de sílabas tónicas",
    ],
    minimalPairs: [
      { wordA: "ten", wordB: "den", phonemeA: "/t/", phonemeB: "/d/" },
      { wordA: "tip", wordB: "dip", phonemeA: "/t/", phonemeB: "/d/" },
      { wordA: "town", wordB: "down", phonemeA: "/t/", phonemeB: "/d/" },
    ],
    spanishTip: "Similar a la 't' española pero la lengua toca la cresta alveolar (no los dientes) y al inicio lleva aspiración. En americano, entre vocales ('water', 'city') se convierte en un golpecito como la 'r' suave de 'cara' — se llama flap y es lo correcto.",
  },
  "/d/": {
    difficulty: "easy",
    articulation: [
      "Tongue tip touches the alveolar ridge",
      "Vocal cords vibrate during the release",
      "Less air than /t/",
    ],
    articulationEs: [
      "La punta de la lengua toca la cresta alveolar",
      "Las cuerdas vocales vibran al soltar",
      "Sale menos aire que en /t/",
    ],
    minimalPairs: [
      { wordA: "den", wordB: "ten", phonemeA: "/d/", phonemeB: "/t/" },
      { wordA: "day", wordB: "they", phonemeA: "/d/", phonemeB: "/ð/" },
      { wordA: "dare", wordB: "there", phonemeA: "/d/", phonemeB: "/ð/" },
    ],
    spanishTip: "Como la 'd' española al inicio de sílaba — pero en inglés sigue siendo oclusiva entre vocales (en español ahí se suaviza a /ð/, y eso en inglés cambia la palabra: 'day' ≠ 'they'). En final ('bad' vs 'bat'), alarga la vocal de 'bad'.",
    finalConsonantPairs: [
      { wordVoiced: "bad", wordVoiceless: "bat", voicedIpa: "/d/", voicelessIpa: "/t/" },
      { wordVoiced: "bid", wordVoiceless: "bit", voicedIpa: "/d/", voicelessIpa: "/t/" },
      { wordVoiced: "road", wordVoiceless: "wrote", voicedIpa: "/d/", voicelessIpa: "/t/" },
      { wordVoiced: "played", wordVoiceless: "plate", voicedIpa: "/d/", voicelessIpa: "/t/" },
    ],
  },
  "/k/": {
    difficulty: "easy",
    articulation: [
      "Back of tongue presses against the velum (soft palate)",
      "Build air pressure, then release",
      "Aspirated at the start of stressed syllables",
    ],
    articulationEs: [
      "La parte trasera de la lengua presiona el velo del paladar",
      "Acumula presión de aire y suelta",
      "Aspirada al inicio de sílabas tónicas",
    ],
    minimalPairs: [
      { wordA: "came", wordB: "game", phonemeA: "/k/", phonemeB: "/g/" },
      { wordA: "coat", wordB: "goat", phonemeA: "/k/", phonemeB: "/g/" },
      { wordA: "class", wordB: "glass", phonemeA: "/k/", phonemeB: "/g/" },
    ],
    spanishTip: "Igual que la 'c' (antes de a, o, u) o 'qu' en español. En inglés lleva más aspiración al inicio de palabra. Sonido familiar para hispanohablantes.",
  },
  "/g/": {
    difficulty: "easy",
    articulation: [
      "Back of tongue presses against the velum",
      "Vocal cords vibrate",
      "Voiced version of /k/",
    ],
    articulationEs: [
      "La parte trasera de la lengua presiona el velo del paladar",
      "Las cuerdas vocales vibran",
      "Versión sonora de /k/",
    ],
    minimalPairs: [
      { wordA: "game", wordB: "came", phonemeA: "/g/", phonemeB: "/k/" },
      { wordA: "goat", wordB: "coat", phonemeA: "/g/", phonemeB: "/k/" },
      { wordA: "gold", wordB: "cold", phonemeA: "/g/", phonemeB: "/k/" },
    ],
    spanishTip: "Igual que la 'g' española al inicio de sílaba (como en 'gato', no como en 'agua'). En final ('bag' vs 'back'), la pista es la vocal: más larga antes de /g/.",
    finalConsonantPairs: [
      { wordVoiced: "bag", wordVoiceless: "back", voicedIpa: "/g/", voicelessIpa: "/k/" },
      { wordVoiced: "pig", wordVoiceless: "pick", voicedIpa: "/g/", voicelessIpa: "/k/" },
      { wordVoiced: "log", wordVoiceless: "lock", voicedIpa: "/g/", voicelessIpa: "/k/" },
      { wordVoiced: "dug", wordVoiceless: "duck", voicedIpa: "/g/", voicelessIpa: "/k/" },
    ],
  },
  "/f/": {
    difficulty: "easy",
    articulation: [
      "Upper front teeth rest on the lower lip",
      "Force air through the small gap",
      "Voiceless — no vocal cord vibration",
    ],
    articulationEs: [
      "Los dientes superiores descansan sobre el labio inferior",
      "Fuerza el aire a través del pequeño hueco",
      "Sorda — sin vibración de cuerdas vocales",
    ],
    minimalPairs: [
      { wordA: "fan", wordB: "van", phonemeA: "/f/", phonemeB: "/v/" },
      { wordA: "fat", wordB: "vat", phonemeA: "/f/", phonemeB: "/v/" },
      { wordA: "fine", wordB: "vine", phonemeA: "/f/", phonemeB: "/v/" },
    ],
    spanishTip: "Igual que la 'f' española. Los dientes superiores tocan el labio inferior y sale aire continuo. Sonido idéntico al español.",
  },
  "/v/": {
    difficulty: "hard",
    articulation: [
      "Upper front teeth rest on the lower lip — same position as /f/",
      "Vocal cords vibrate while air flows through",
      "Do not let both lips touch — that would be /b/",
    ],
    articulationEs: [
      "Los dientes superiores sobre el labio inferior — igual que en /f/",
      "Las cuerdas vocales vibran mientras sale el aire",
      "No juntes ambos labios — eso sería /b/",
    ],
    minimalPairs: [
      { wordA: "van", wordB: "ban", phonemeA: "/v/", phonemeB: "/b/" },
      { wordA: "vat", wordB: "bat", phonemeA: "/v/", phonemeB: "/b/" },
      { wordA: "vine", wordB: "fine", phonemeA: "/v/", phonemeB: "/f/" },
    ],
    spanishTip: "No existe en español estándar. El labio inferior toca los dientes superiores y las cuerdas vocales vibran — los labios nunca se tocan entre sí. En final ('save' vs 'safe'), alarga la vocal de 'save'.",
    finalConsonantPairs: [
      { wordVoiced: "leave", wordVoiceless: "leaf", voicedIpa: "/v/", voicelessIpa: "/f/" },
      { wordVoiced: "live", wordVoiceless: "life", voicedIpa: "/v/", voicelessIpa: "/f/" },
      { wordVoiced: "save", wordVoiceless: "safe", voicedIpa: "/v/", voicelessIpa: "/f/" },
      { wordVoiced: "halve", wordVoiceless: "half", voicedIpa: "/v/", voicelessIpa: "/f/" },
    ],
  },
  "/θ/": {
    difficulty: "hard",
    articulation: [
      "Tongue tip placed between or just behind the front teeth",
      "Force air over the tongue — no vibration",
      "Gentle friction, not a hard sound",
    ],
    articulationEs: [
      "La punta de la lengua entre los dientes o justo detrás",
      "Fuerza el aire sobre la lengua — sin vibración",
      "Fricción suave, no un sonido fuerte",
    ],
    minimalPairs: [
      { wordA: "think", wordB: "sink", phonemeA: "/θ/", phonemeB: "/s/" },
      { wordA: "thin", wordB: "tin", phonemeA: "/θ/", phonemeB: "/t/" },
      { wordA: "three", wordB: "tree", phonemeA: "/θ/", phonemeB: "/t/" },
    ],
    spanishTip: "Como la 'c' o 'z' del español castellano (cena, zapato). En Latinoamérica no existe este sonido — practica sacando levemente la lengua entre los dientes y soplando.",
  },
  "/ð/": {
    difficulty: "hard",
    articulation: [
      "Tongue tip between or just behind the front teeth — same as /θ/",
      "Vocal cords vibrate while air flows over tongue",
      "Voiced version of /θ/ — feel the buzz",
    ],
    articulationEs: [
      "La punta de la lengua entre los dientes — igual que en /θ/",
      "Las cuerdas vocales vibran mientras el aire pasa sobre la lengua",
      "Versión sonora de /θ/ — siente la vibración",
    ],
    minimalPairs: [
      { wordA: "then", wordB: "ten", phonemeA: "/ð/", phonemeB: "/t/" },
      { wordA: "those", wordB: "dose", phonemeA: "/ð/", phonemeB: "/d/" },
      { wordA: "either", wordB: "ether", phonemeA: "/ð/", phonemeB: "/θ/" },
    ],
    spanishTip: "Ya lo tienes: es la 'd' suave del español entre vocales ('cada', 'lado'). La diferencia es que en inglés aparece al inicio de palabras frecuentes: 'the', 'this', 'that', 'they' — y ahí los hispanohablantes tienden a endurecerla a /d/.",
  },
  "/s/": {
    difficulty: "easy",
    articulation: [
      "Tongue tip near the alveolar ridge, not touching",
      "Air flows through the narrow channel creating a hiss",
      "Lips slightly spread, teeth close together",
    ],
    articulationEs: [
      "La punta de la lengua cerca de la cresta alveolar, sin tocarla",
      "El aire pasa por el canal estrecho creando un siseo",
      "Labios ligeramente estirados, dientes juntos",
    ],
    minimalPairs: [
      { wordA: "sue", wordB: "zoo", phonemeA: "/s/", phonemeB: "/z/" },
      { wordA: "sip", wordB: "zip", phonemeA: "/s/", phonemeB: "/z/" },
      { wordA: "seal", wordB: "zeal", phonemeA: "/s/", phonemeB: "/z/" },
    ],
    spanishTip: "Igual que la 's' española. Atención: en inglés la 's' al final de palabras o en plurales a veces suena /z/ (dogs, runs). El sonido aislado es igual al español.",
  },
  "/z/": {
    difficulty: "hard",
    articulation: [
      "Same position as /s/ — tongue near alveolar ridge",
      "Vocal cords vibrate creating a buzz",
      "Voiced version of /s/",
    ],
    articulationEs: [
      "Misma posición que /s/ — lengua cerca de la cresta alveolar",
      "Las cuerdas vocales vibran creando un zumbido",
      "Versión sonora de /s/",
    ],
    minimalPairs: [
      { wordA: "zoo", wordB: "sue", phonemeA: "/z/", phonemeB: "/s/" },
      { wordA: "zip", wordB: "sip", phonemeA: "/z/", phonemeB: "/s/" },
      { wordA: "zeal", wordB: "seal", phonemeA: "/z/", phonemeB: "/s/" },
    ],
    spanishTip: "No existe en español estándar pero es altísimamente frecuente: plurales y verbos ('dogs', 'runs', 'is', 'was'). Pon la mano en el cuello y siente la vibración. En final ('rise' vs 'rice'), alarga la vocal de 'rise'.",
    finalConsonantPairs: [
      { wordVoiced: "buzz", wordVoiceless: "bus", voicedIpa: "/z/", voicelessIpa: "/s/" },
      { wordVoiced: "his", wordVoiceless: "hiss", voicedIpa: "/z/", voicelessIpa: "/s/" },
      { wordVoiced: "rise", wordVoiceless: "rice", voicedIpa: "/z/", voicelessIpa: "/s/" },
      { wordVoiced: "plays", wordVoiceless: "place", voicedIpa: "/z/", voicelessIpa: "/s/" },
    ],
  },
  "/ʃ/": {
    difficulty: "medium",
    articulation: [
      "Tongue further back than /s/, near the palate",
      "Lips slightly rounded and pushed forward",
      "Broader, lower-pitched sound than /s/",
    ],
    articulationEs: [
      "Lengua más atrás que en /s/, cerca del paladar",
      "Labios ligeramente redondeados y proyectados hacia adelante",
      "Sonido más ancho y grave que /s/",
    ],
    minimalPairs: [
      { wordA: "she", wordB: "see", phonemeA: "/ʃ/", phonemeB: "/s/" },
      { wordA: "ship", wordB: "sip", phonemeA: "/ʃ/", phonemeB: "/s/" },
      { wordA: "shoe", wordB: "sue", phonemeA: "/ʃ/", phonemeB: "/s/" },
    ],
    spanishTip: "Parecido a decir '¡shh!' para pedir silencio. No existe como fonema independiente en español pero el sonido es intuitivo. Es el 'sh' de 'she', 'shop', 'English'.",
  },
  "/ʒ/": {
    difficulty: "hard",
    articulation: [
      "Same tongue position as /ʃ/ — back from the alveolar ridge",
      "Lips slightly rounded and pushed forward",
      "Vocal cords vibrate — voiced version of /ʃ/",
    ],
    articulationEs: [
      "Misma posición que /ʃ/ — lengua atrás de la cresta alveolar",
      "Labios ligeramente redondeados y proyectados",
      "Las cuerdas vocales vibran — versión sonora de /ʃ/",
    ],
    minimalPairs: [
      { wordA: "glazier", wordB: "glacier", phonemeA: "/ʒ/", phonemeB: "/ʃ/" },
      { wordA: "version", wordB: "virgin", phonemeA: "/ʒ/", phonemeB: "/dʒ/" },
      { wordA: "composure", wordB: "composer", phonemeA: "/ʒ/", phonemeB: "/z/" },
    ],
    spanishTip: "No existe en español estándar. Es como /ʃ/ pero con vibración. Aparece en 'vision', 'measure', 'usual'. En el español rioplatense, la 'll' y la 'y' suenan muy parecido.",
  },
  "/h/": {
    difficulty: "easy",
    articulation: [
      "Produced at the glottis — the vocal cords are open",
      "Breathe out gently with the mouth slightly open",
      "No contact points in the mouth",
    ],
    articulationEs: [
      "Se produce en la glotis — las cuerdas vocales están abiertas",
      "Espira suavemente con la boca entreabierta",
      "Ningún punto de contacto en la boca",
    ],
    minimalPairs: [
      { wordA: "hat", wordB: "at", phonemeA: "/h/", phonemeB: "∅" },
      { wordA: "hit", wordB: "it", phonemeA: "/h/", phonemeB: "∅" },
      { wordA: "hold", wordB: "old", phonemeA: "/h/", phonemeB: "∅" },
    ],
    spanishTip: "La 'h' en inglés siempre se pronuncia (es un soplo de aire). En español la 'h' es muda. No la confundas con la 'j' española — la /h/ inglesa es mucho más suave, solo aire.",
  },
  "/tʃ/": {
    difficulty: "easy",
    articulation: [
      "Start by pressing tongue to the alveolar ridge, like /t/",
      "Release into the /ʃ/ fricative smoothly",
      "Lips slightly rounded and pushed forward",
    ],
    articulationEs: [
      "Empieza presionando la lengua en la cresta alveolar, como en /t/",
      "Suelta hacia la fricativa /ʃ/ con fluidez",
      "Labios ligeramente redondeados y proyectados hacia adelante",
    ],
    minimalPairs: [
      { wordA: "chair", wordB: "share", phonemeA: "/tʃ/", phonemeB: "/ʃ/" },
      { wordA: "cheap", wordB: "sheep", phonemeA: "/tʃ/", phonemeB: "/ʃ/" },
      { wordA: "chin", wordB: "gin", phonemeA: "/tʃ/", phonemeB: "/dʒ/" },
    ],
    spanishTip: "Igual que la 'ch' española de 'mucho', 'chico'. Lo difícil no es producirlo sino no usarlo de más: 'share' y 'chair' son palabras distintas.",
  },
  "/dʒ/": {
    difficulty: "easy",
    articulation: [
      "Start with tongue touching alveolar ridge, like /d/",
      "Release into the /ʒ/ fricative",
      "Vocal cords vibrate throughout",
    ],
    articulationEs: [
      "Empieza con la lengua tocando la cresta alveolar, como en /d/",
      "Suelta hacia la fricativa /ʒ/",
      "Las cuerdas vocales vibran todo el tiempo",
    ],
    minimalPairs: [
      { wordA: "gin", wordB: "chin", phonemeA: "/dʒ/", phonemeB: "/tʃ/" },
      { wordA: "jet", wordB: "yet", phonemeA: "/dʒ/", phonemeB: "/j/" },
      { wordA: "jam", wordB: "yam", phonemeA: "/dʒ/", phonemeB: "/j/" },
    ],
    spanishTip: "Similar a la 'y' o 'll' del español rioplatense pronunciada con fuerza, o a una 'ch' con vibración. Es la 'j' de 'juice', 'job', 'jump'. No la confundas con /j/ ('yet' ≠ 'jet').",
  },
  "/m/": {
    difficulty: "easy",
    articulation: [
      "Both lips pressed together",
      "Air flows through the nose, not the mouth",
      "Vocal cords vibrate throughout",
    ],
    articulationEs: [
      "Ambos labios juntos",
      "El aire sale por la nariz, no por la boca",
      "Las cuerdas vocales vibran todo el tiempo",
    ],
    minimalPairs: [
      { wordA: "mail", wordB: "nail", phonemeA: "/m/", phonemeB: "/n/" },
      { wordA: "meet", wordB: "neat", phonemeA: "/m/", phonemeB: "/n/" },
      { wordA: "might", wordB: "night", phonemeA: "/m/", phonemeB: "/n/" },
    ],
    spanishTip: "Idéntico a la 'm' española. Sin diferencias. Uno de los sonidos más fáciles para hispanohablantes.",
  },
  "/n/": {
    difficulty: "easy",
    articulation: [
      "Tongue tip presses against the alveolar ridge",
      "Air flows through the nose",
      "Vocal cords vibrate",
    ],
    articulationEs: [
      "La punta de la lengua presiona la cresta alveolar",
      "El aire sale por la nariz",
      "Las cuerdas vocales vibran",
    ],
    minimalPairs: [
      { wordA: "night", wordB: "might", phonemeA: "/n/", phonemeB: "/m/" },
      { wordA: "sin", wordB: "sing", phonemeA: "/n/", phonemeB: "/ŋ/" },
      { wordA: "nail", wordB: "mail", phonemeA: "/n/", phonemeB: "/m/" },
    ],
    spanishTip: "Muy similar a la 'n' española. La diferencia es que la lengua toca la cresta alveolar (no los dientes). Prácticamente idéntico al español.",
  },
  "/ŋ/": {
    difficulty: "medium",
    articulation: [
      "Back of tongue presses against the velum (soft palate)",
      "Air flows through the nose",
      "Mouth stays open — same back position as /k/ and /g/",
    ],
    articulationEs: [
      "La parte trasera de la lengua presiona el velo del paladar",
      "El aire sale por la nariz",
      "La boca queda abierta — misma posición trasera que /k/ y /g/",
    ],
    minimalPairs: [
      { wordA: "sing", wordB: "sin", phonemeA: "/ŋ/", phonemeB: "/n/" },
      { wordA: "wing", wordB: "win", phonemeA: "/ŋ/", phonemeB: "/n/" },
      { wordA: "bang", wordB: "ban", phonemeA: "/ŋ/", phonemeB: "/n/" },
    ],
    spanishTip: "Existe en español antes de /k/ o /g/ (como en 'banco', 'tango') pero nunca al final de palabra. En inglés aparece solo al final: 'sing', 'ring', 'going'. Practica terminando palabras con este sonido sin añadir una /g/ ni una /k/.",
  },
  "/l/": {
    difficulty: "easy",
    articulation: [
      "Tongue tip presses on the alveolar ridge",
      "Air flows around the sides of the tongue",
      "In 'dark l' (syllable-final), the back of tongue rises toward the velum",
    ],
    articulationEs: [
      "La punta de la lengua presiona la cresta alveolar",
      "El aire sale por los lados de la lengua",
      "En la 'l oscura' (final de sílaba) la parte trasera sube hacia el velo",
    ],
    minimalPairs: [
      { wordA: "light", wordB: "right", phonemeA: "/l/", phonemeB: "/r/" },
      { wordA: "led", wordB: "red", phonemeA: "/l/", phonemeB: "/r/" },
      { wordA: "late", wordB: "rate", phonemeA: "/l/", phonemeB: "/r/" },
    ],
    spanishTip: "Similar a la 'l' española pero en inglés hay dos variantes: 'clear l' (al inicio de sílaba) y 'dark l' (al final, como en 'milk', 'full'). La 'dark l' suena más profunda y no existe en español.",
  },
  "/r/": {
    difficulty: "hard",
    articulation: [
      "Tongue tip curls back slightly or bunches up — never touches the palate",
      "Sides of tongue may touch upper back teeth",
      "Lips slightly rounded, no trill or tap",
    ],
    articulationEs: [
      "La punta se curva hacia atrás o la lengua se agrupa — nunca toca el paladar",
      "Los lados de la lengua pueden tocar los molares superiores",
      "Labios ligeramente redondeados, sin vibrar ni golpear",
    ],
    minimalPairs: [
      { wordA: "red", wordB: "led", phonemeA: "/r/", phonemeB: "/l/" },
      { wordA: "rate", wordB: "late", phonemeA: "/r/", phonemeB: "/l/" },
      { wordA: "rain", wordB: "lane", phonemeA: "/r/", phonemeB: "/l/" },
    ],
    spanishTip: "Nunca se vibra como la 'r' española. La lengua no toca el paladar — flota en el aire, curvada hacia atrás. En americano la R se pronuncia SIEMPRE, también al final: 'car', 'bird', 'her'. Practica con 'red', 'run', 'right'.",
  },
  "/j/": {
    difficulty: "easy",
    articulation: [
      "Tongue body raised toward the hard palate",
      "No contact — glide smoothly into the following vowel",
      "Like the beginning of the /iː/ sound",
    ],
    articulationEs: [
      "El cuerpo de la lengua sube hacia el paladar duro",
      "Sin contacto — deslízate suavemente hacia la vocal siguiente",
      "Como el inicio del sonido /iː/",
    ],
    minimalPairs: [
      { wordA: "yet", wordB: "jet", phonemeA: "/j/", phonemeB: "/dʒ/" },
      { wordA: "yam", wordB: "jam", phonemeA: "/j/", phonemeB: "/dʒ/" },
      { wordA: "year", wordB: "ear", phonemeA: "/j/", phonemeB: "∅" },
    ],
    spanishTip: "Como la 'y' española suave de 'yo', 'ya' — sin fricción. El error típico es endurecerla a /dʒ/: 'yet' no es 'jet', 'year' no es 'jier'. Deslízate suave hacia la vocal.",
  },
  "/w/": {
    difficulty: "easy",
    articulation: [
      "Lips tightly rounded at the start, then relax",
      "Back of tongue raised toward the velum",
      "Glide quickly into the following vowel",
    ],
    articulationEs: [
      "Labios bien redondeados al inicio, luego se relajan",
      "La parte trasera de la lengua sube hacia el velo",
      "Deslízate rápidamente hacia la vocal siguiente",
    ],
    minimalPairs: [
      { wordA: "wet", wordB: "yet", phonemeA: "/w/", phonemeB: "/j/" },
      { wordA: "wine", wordB: "vine", phonemeA: "/w/", phonemeB: "/v/" },
      { wordA: "west", wordB: "vest", phonemeA: "/w/", phonemeB: "/v/" },
    ],
    spanishTip: "Similar al sonido de la 'u' en diptongos españoles como 'fue', 'bueno', 'agua'. Redondea los labios como para decir 'u' y luego deslízate rápidamente a la siguiente vocal.",
  },
  "/eɪ/": {
    difficulty: "medium",
    articulation: [
      "Start with mouth at mid-front position, like a closed 'e'",
      "Glide smoothly upward and forward to near /ɪ/",
      "The first element is longer and more prominent",
    ],
    articulationEs: [
      "Empieza con la boca en posición media-delantera, como una 'e' cerrada",
      "Deslízate suavemente hacia arriba y adelante hasta cerca de /ɪ/",
      "El primer elemento es más largo y prominente",
    ],
    minimalPairs: [
      { wordA: "day", wordB: "die", phonemeA: "/eɪ/", phonemeB: "/aɪ/" },
      { wordA: "late", wordB: "light", phonemeA: "/eɪ/", phonemeB: "/aɪ/" },
      { wordA: "pain", wordB: "pine", phonemeA: "/eɪ/", phonemeB: "/aɪ/" },
    ],
    spanishTip: "Parecido al diptongo 'ei' en 'rey' o 'seis' en español. Empieza en /e/ y deslízate hacia arriba. Es la vocal de 'day', 'name', 'plate'.",
  },
  "/aɪ/": {
    difficulty: "medium",
    articulation: [
      "Start with mouth wide open, like the Spanish 'a'",
      "Glide up to near-high front /ɪ/",
      "First element is open and long, second is brief",
    ],
    articulationEs: [
      "Empieza con la boca muy abierta, como la 'a' española",
      "Deslízate hacia arriba hasta /ɪ/ delantera",
      "El primer elemento es abierto y largo, el segundo breve",
    ],
    minimalPairs: [
      { wordA: "time", wordB: "tame", phonemeA: "/aɪ/", phonemeB: "/eɪ/" },
      { wordA: "light", wordB: "late", phonemeA: "/aɪ/", phonemeB: "/eɪ/" },
      { wordA: "price", wordB: "place", phonemeA: "/aɪ/", phonemeB: "/eɪ/" },
    ],
    spanishTip: "Parecido al diptongo 'ai' en 'aire' o 'baile' en español. Empieza abierto y sube. Es la vocal de 'I', 'time', 'night', 'my'.",
  },
  "/ɔɪ/": {
    difficulty: "medium",
    articulation: [
      "Start with lips rounded, like /ɔ/",
      "Glide forward and upward to /ɪ/",
      "The rounded first element is key",
    ],
    articulationEs: [
      "Empieza con los labios redondeados, como en /ɔ/",
      "Deslízate hacia adelante y arriba hasta /ɪ/",
      "El primer elemento redondeado es la clave",
    ],
    minimalPairs: [
      { wordA: "boy", wordB: "bay", phonemeA: "/ɔɪ/", phonemeB: "/eɪ/" },
      { wordA: "coin", wordB: "cone", phonemeA: "/ɔɪ/", phonemeB: "/oʊ/" },
      { wordA: "oil", wordB: "ale", phonemeA: "/ɔɪ/", phonemeB: "/eɪ/" },
    ],
    spanishTip: "Parecido al diptongo 'oi' en 'hoy' o 'voy' en español. Empieza redondeado y deslízate hacia adelante. Es la vocal de 'boy', 'oil', 'coin'.",
  },
  "/oʊ/": {
    difficulty: "medium",
    articulation: [
      "Start at mid-back position with rounded lips, like a Spanish 'o'",
      "Glide toward /ʊ/, rounding the lips a bit more",
      "Two moments: 'o' then a brief 'u' — never a flat single 'o'",
    ],
    articulationEs: [
      "Empieza en posición media-trasera con labios redondeados, como una 'o' española",
      "Deslízate hacia /ʊ/, redondeando un poco más los labios",
      "Dos momentos: 'o' y una 'u' breve — nunca una 'o' plana",
    ],
    minimalPairs: [
      { wordA: "low", wordB: "law", phonemeA: "/oʊ/", phonemeB: "/ɔ/" },
      { wordA: "coat", wordB: "caught", phonemeA: "/oʊ/", phonemeB: "/ɔ/" },
      { wordA: "no", wordB: "now", phonemeA: "/oʊ/", phonemeB: "/aʊ/" },
    ],
    spanishTip: "No es la 'o' española pura — es un diptongo: 'go' suena 'gou', 'no' suena 'nou'. Si dices una 'o' corta y plana se nota el acento. Es la vocal de 'go', 'home', 'boat'.",
  },
  "/aʊ/": {
    difficulty: "medium",
    articulation: [
      "Start with mouth wide open, like the Spanish 'a'",
      "Round the lips and glide back to /ʊ/",
      "Strong movement from front open to back rounded",
    ],
    articulationEs: [
      "Empieza con la boca muy abierta, como la 'a' española",
      "Redondea los labios y deslízate hacia /ʊ/",
      "Movimiento fuerte: de delantera abierta a trasera redondeada",
    ],
    minimalPairs: [
      { wordA: "now", wordB: "no", phonemeA: "/aʊ/", phonemeB: "/oʊ/" },
      { wordA: "down", wordB: "done", phonemeA: "/aʊ/", phonemeB: "/ʌ/" },
      { wordA: "out", wordB: "oat", phonemeA: "/aʊ/", phonemeB: "/oʊ/" },
    ],
    spanishTip: "Parecido al diptongo 'au' en 'auto' o 'causa' en español. Empieza abierto y redondea hacia /u/. Es la vocal de 'now', 'out', 'how', 'town'.",
  },
};

// Contrastes con mayor interferencia L1 + carga funcional para hispanohablantes.
// /z/ incluido por frecuencia (plurales, is/was); /ɔ/ por el contraste law/low.
export const HARD_FOR_SPANISH_SPEAKERS = [
  "/æ/",
  "/ʌ/",
  "/ɜr/",
  "/ɔ/",
  "/ɪ/",
  "/ð/",
  "/θ/",
  "/v/",
  "/z/",
  "/ʒ/",
  "/r/",
];
