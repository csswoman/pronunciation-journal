export type Difficulty = "easy" | "medium" | "hard";

export interface PhonemeExtra {
  difficulty: Difficulty;
  articulation: string[];
  minimalPairs: { wordA: string; wordB: string; phonemeA: string; phonemeB: string }[];
  spanishTip: string;
}

export const IPA_EXTRA: Record<string, PhonemeExtra> = {
  "/iː/": {
    difficulty: "easy",
    articulation: [
      "Lips spread wide, like a big smile",
      "Tongue high and pushed forward in the mouth",
      "Held longer than the Spanish 'i'",
    ],
    minimalPairs: [
      { wordA: "seat", wordB: "sit", phonemeA: "/iː/", phonemeB: "/ɪ/" },
      { wordA: "feet", wordB: "fit", phonemeA: "/iː/", phonemeB: "/ɪ/" },
      { wordA: "leave", wordB: "live", phonemeA: "/iː/", phonemeB: "/ɪ/" },
    ],
    spanishTip: "Muy similar a la 'i' española pero más larga y con labios más estirados. Mantén la tensión muscular.",
  },
  "/ɪ/": {
    difficulty: "hard",
    articulation: [
      "Lips relaxed, not spread wide",
      "Tongue slightly lower and more central than /iː/",
      "Short and lax — do not tense the muscles",
    ],
    minimalPairs: [
      { wordA: "sit", wordB: "seat", phonemeA: "/ɪ/", phonemeB: "/iː/" },
      { wordA: "bit", wordB: "beat", phonemeA: "/ɪ/", phonemeB: "/iː/" },
      { wordA: "ship", wordB: "sheep", phonemeA: "/ɪ/", phonemeB: "/iː/" },
    ],
    spanishTip: "Más corta y relajada que la 'i' española. No es /i/ ni /e/ — está entre las dos. Relaja la mandíbula y no estires los labios.",
  },
  "/e/": {
    difficulty: "medium",
    articulation: [
      "Lips slightly spread, jaw half open",
      "Tongue at mid-front position",
      "Shorter than the Spanish 'e'",
    ],
    minimalPairs: [
      { wordA: "bed", wordB: "bad", phonemeA: "/e/", phonemeB: "/æ/" },
      { wordA: "pen", wordB: "pan", phonemeA: "/e/", phonemeB: "/æ/" },
      { wordA: "set", wordB: "sat", phonemeA: "/e/", phonemeB: "/æ/" },
    ],
    spanishTip: "Similar a la 'e' española pero más breve y relajada. No la alargues ni la conviertas en diptongo.",
  },
  "/æ/": {
    difficulty: "hard",
    articulation: [
      "Mouth wide open, more than for /e/",
      "Tongue low and pushed forward",
      "Lips spread horizontally, almost like a grimace",
    ],
    minimalPairs: [
      { wordA: "cat", wordB: "cut", phonemeA: "/æ/", phonemeB: "/ʌ/" },
      { wordA: "bad", wordB: "bed", phonemeA: "/æ/", phonemeB: "/e/" },
      { wordA: "man", wordB: "men", phonemeA: "/æ/", phonemeB: "/e/" },
    ],
    spanishTip: "No existe en español. Es más abierta que la 'a'. Imagina decir 'a' con la boca muy abierta horizontalmente y la lengua hacia adelante.",
  },
  "/ɑː/": {
    difficulty: "medium",
    articulation: [
      "Mouth fully open, jaw dropped low",
      "Tongue low and pulled back",
      "Lips unrounded and relaxed",
    ],
    minimalPairs: [
      { wordA: "car", wordB: "cup", phonemeA: "/ɑː/", phonemeB: "/ʌ/" },
      { wordA: "heart", wordB: "hurt", phonemeA: "/ɑː/", phonemeB: "/ɜː/" },
      { wordA: "farm", wordB: "firm", phonemeA: "/ɑː/", phonemeB: "/ɜː/" },
    ],
    spanishTip: "Parecida a la 'a' española pero más larga y con la lengua más atrás. Es la 'a' de 'car' — imagina al médico diciéndote 'abre la boca'.",
  },
  "/ɒ/": {
    difficulty: "medium",
    articulation: [
      "Lips rounded and mouth wide open",
      "Tongue low and back",
      "Short sound — do not hold it",
    ],
    minimalPairs: [
      { wordA: "hot", wordB: "hut", phonemeA: "/ɒ/", phonemeB: "/ʌ/" },
      { wordA: "cot", wordB: "cut", phonemeA: "/ɒ/", phonemeB: "/ʌ/" },
      { wordA: "top", wordB: "tap", phonemeA: "/ɒ/", phonemeB: "/æ/" },
    ],
    spanishTip: "Parecida a una 'o' española pero con la boca muy abierta. Es más abierta que la 'o' del español — no redondees tanto los labios.",
  },
  "/ɔː/": {
    difficulty: "hard",
    articulation: [
      "Lips rounded and pushed forward",
      "Tongue low-back, slightly raised",
      "Long sound — hold it clearly",
    ],
    minimalPairs: [
      { wordA: "law", wordB: "low", phonemeA: "/ɔː/", phonemeB: "/əʊ/" },
      { wordA: "caught", wordB: "coat", phonemeA: "/ɔː/", phonemeB: "/əʊ/" },
      { wordA: "tall", wordB: "toll", phonemeA: "/ɔː/", phonemeB: "/əʊ/" },
    ],
    spanishTip: "No existe exactamente en español. Es una 'o' larga con los labios bien redondeados y la boca medio abierta. Practica con 'all', 'ball', 'call'.",
  },
  "/ʊ/": {
    difficulty: "medium",
    articulation: [
      "Lips loosely rounded, not tightly pursed",
      "Tongue near-high and back, but relaxed",
      "Short and lax — do not hold it",
    ],
    minimalPairs: [
      { wordA: "book", wordB: "boot", phonemeA: "/ʊ/", phonemeB: "/uː/" },
      { wordA: "pull", wordB: "pool", phonemeA: "/ʊ/", phonemeB: "/uː/" },
      { wordA: "full", wordB: "fool", phonemeA: "/ʊ/", phonemeB: "/uː/" },
    ],
    spanishTip: "Más corta y relajada que la 'u' española. No tenses los labios — es la 'u' de 'book', muy diferente de la 'u' de 'moon'.",
  },
  "/uː/": {
    difficulty: "easy",
    articulation: [
      "Lips tightly rounded and pushed forward",
      "Tongue high and pushed back",
      "Long sound — sustain it",
    ],
    minimalPairs: [
      { wordA: "moon", wordB: "man", phonemeA: "/uː/", phonemeB: "/æ/" },
      { wordA: "food", wordB: "foot", phonemeA: "/uː/", phonemeB: "/ʊ/" },
      { wordA: "pool", wordB: "pull", phonemeA: "/uː/", phonemeB: "/ʊ/" },
    ],
    spanishTip: "Similar a la 'u' española pero más larga y con los labios más redondeados. Mantén la tensión — es el sonido de 'moon' y 'food'.",
  },
  "/ʌ/": {
    difficulty: "hard",
    articulation: [
      "Lips neutral and unrounded",
      "Jaw slightly open, tongue mid-back",
      "Short and unstressed — never round the lips",
    ],
    minimalPairs: [
      { wordA: "cup", wordB: "cap", phonemeA: "/ʌ/", phonemeB: "/æ/" },
      { wordA: "cut", wordB: "cat", phonemeA: "/ʌ/", phonemeB: "/æ/" },
      { wordA: "luck", wordB: "lock", phonemeA: "/ʌ/", phonemeB: "/ɒ/" },
    ],
    spanishTip: "Parecida a una 'a' pero con la boca menos abierta y la lengua hacia atrás. No es /a/ ni /o/. Muchos hispanohablantes la pronuncian como 'a', pero es más central y relajada.",
  },
  "/ɜː/": {
    difficulty: "hard",
    articulation: [
      "Lips neutral, slightly parted",
      "Tongue in central neutral position — not touching anything",
      "Long sound with slight tension in center of mouth",
    ],
    minimalPairs: [
      { wordA: "bird", wordB: "bad", phonemeA: "/ɜː/", phonemeB: "/æ/" },
      { wordA: "word", wordB: "ward", phonemeA: "/ɜː/", phonemeB: "/ɔː/" },
      { wordA: "hurt", wordB: "heart", phonemeA: "/ɜː/", phonemeB: "/ɑː/" },
    ],
    spanishTip: "No existe en español. La lengua flota en el centro de la boca sin tocar nada. Es el sonido de 'bird', 'word', 'nurse' — muy diferente a cualquier vocal española.",
  },
  "/ə/": {
    difficulty: "medium",
    articulation: [
      "Completely relaxed — lips, tongue and jaw all neutral",
      "Tongue in central mid position",
      "Always unstressed — never emphasize it",
    ],
    minimalPairs: [
      { wordA: "about", wordB: "out", phonemeA: "/ə/", phonemeB: "/aʊ/" },
      { wordA: "sofa", wordB: "sofa (stressed)", phonemeA: "/ə/", phonemeB: "/æ/" },
      { wordA: "the (weak)", wordB: "thee (strong)", phonemeA: "/ə/", phonemeB: "/iː/" },
    ],
    spanishTip: "El sonido más común en inglés y no existe en español. Es la vocal átona de sílabas relajadas como 'a-bout', 'sof-a'. Relaja completamente la boca — no hagas ningún esfuerzo.",
  },
  "/p/": {
    difficulty: "easy",
    articulation: [
      "Both lips pressed firmly together",
      "Build up air pressure behind the lips",
      "Release with a small burst of air (aspiration at start of word)",
    ],
    minimalPairs: [
      { wordA: "pen", wordB: "ben", phonemeA: "/p/", phonemeB: "/b/" },
      { wordA: "pat", wordB: "bat", phonemeA: "/p/", phonemeB: "/b/" },
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
    minimalPairs: [
      { wordA: "bed", wordB: "red", phonemeA: "/b/", phonemeB: "/r/" },
      { wordA: "bat", wordB: "pat", phonemeA: "/b/", phonemeB: "/p/" },
      { wordA: "back", wordB: "pack", phonemeA: "/b/", phonemeB: "/p/" },
    ],
    spanishTip: "Igual que la 'b' española al inicio de sílaba (no entre vocales). Las cuerdas vocales vibran. Es un sonido natural para hispanohablantes.",
  },
  "/t/": {
    difficulty: "easy",
    articulation: [
      "Tongue tip touches the alveolar ridge (just behind the upper teeth)",
      "Release sharply with a burst of air",
      "Aspirated at the start of stressed syllables",
    ],
    minimalPairs: [
      { wordA: "ten", wordB: "den", phonemeA: "/t/", phonemeB: "/d/" },
      { wordA: "tip", wordB: "dip", phonemeA: "/t/", phonemeB: "/d/" },
      { wordA: "town", wordB: "down", phonemeA: "/t/", phonemeB: "/d/" },
    ],
    spanishTip: "Similar a la 't' española pero la lengua toca la cresta alveolar (no los dientes). Al inicio de palabra lleva aspiración — un pequeño soplo de aire.",
  },
  "/d/": {
    difficulty: "easy",
    articulation: [
      "Tongue tip touches the alveolar ridge",
      "Vocal cords vibrate during the release",
      "Less air than /t/",
    ],
    minimalPairs: [
      { wordA: "dog", wordB: "log", phonemeA: "/d/", phonemeB: "/l/" },
      { wordA: "den", wordB: "ten", phonemeA: "/d/", phonemeB: "/t/" },
      { wordA: "day", wordB: "say", phonemeA: "/d/", phonemeB: "/s/" },
    ],
    spanishTip: "Similar a la 'd' española al inicio de sílaba (no entre vocales). La lengua toca la cresta alveolar, no los dientes. Sonido natural para hispanohablantes.",
  },
  "/k/": {
    difficulty: "easy",
    articulation: [
      "Back of tongue presses against the velum (soft palate)",
      "Build air pressure, then release",
      "Aspirated at the start of stressed syllables",
    ],
    minimalPairs: [
      { wordA: "cat", wordB: "bat", phonemeA: "/k/", phonemeB: "/b/" },
      { wordA: "coat", wordB: "goat", phonemeA: "/k/", phonemeB: "/g/" },
      { wordA: "cup", wordB: "pup", phonemeA: "/k/", phonemeB: "/p/" },
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
    minimalPairs: [
      { wordA: "go", wordB: "no", phonemeA: "/g/", phonemeB: "/n/" },
      { wordA: "goat", wordB: "coat", phonemeA: "/g/", phonemeB: "/k/" },
      { wordA: "gold", wordB: "cold", phonemeA: "/g/", phonemeB: "/k/" },
    ],
    spanishTip: "Igual que la 'g' española al inicio de sílaba (como en 'gato', no como en 'agua'). Sonido natural para hispanohablantes.",
  },
  "/f/": {
    difficulty: "easy",
    articulation: [
      "Upper front teeth rest on the lower lip",
      "Force air through the small gap",
      "Voiceless — no vocal cord vibration",
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
    minimalPairs: [
      { wordA: "van", wordB: "ban", phonemeA: "/v/", phonemeB: "/b/" },
      { wordA: "vat", wordB: "bat", phonemeA: "/v/", phonemeB: "/b/" },
      { wordA: "vine", wordB: "fine", phonemeA: "/v/", phonemeB: "/f/" },
    ],
    spanishTip: "No existe en español estándar. El labio inferior toca los dientes superiores y las cuerdas vocales vibran. No confundas con /b/ — los labios no se tocan entre sí.",
  },
  "/θ/": {
    difficulty: "hard",
    articulation: [
      "Tongue tip placed between or just behind the front teeth",
      "Force air over the tongue — no vibration",
      "Gentle friction, not a hard sound",
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
    minimalPairs: [
      { wordA: "this", wordB: "thin", phonemeA: "/ð/", phonemeB: "/θ/" },
      { wordA: "then", wordB: "ten", phonemeA: "/ð/", phonemeB: "/t/" },
      { wordA: "those", wordB: "dose", phonemeA: "/ð/", phonemeB: "/d/" },
    ],
    spanishTip: "Como /θ/ pero con vibración de cuerdas vocales. 'This' y 'think' usan el mismo placement de lengua pero /ð/ vibra. Es la 'th' de palabras frecuentes: 'the', 'this', 'that', 'they'.",
  },
  "/s/": {
    difficulty: "easy",
    articulation: [
      "Tongue tip near the alveolar ridge, not touching",
      "Air flows through the narrow channel creating a hiss",
      "Lips slightly spread, teeth close together",
    ],
    minimalPairs: [
      { wordA: "see", wordB: "zee", phonemeA: "/s/", phonemeB: "/z/" },
      { wordA: "sip", wordB: "zip", phonemeA: "/s/", phonemeB: "/z/" },
      { wordA: "seal", wordB: "zeal", phonemeA: "/s/", phonemeB: "/z/" },
    ],
    spanishTip: "Igual que la 's' española. Atención: en inglés la 's' al final de palabras o en plurales a veces suena /z/ (dogs, runs). El sonido aislado es igual al español.",
  },
  "/z/": {
    difficulty: "medium",
    articulation: [
      "Same position as /s/ — tongue near alveolar ridge",
      "Vocal cords vibrate creating a buzz",
      "Voiced version of /s/",
    ],
    minimalPairs: [
      { wordA: "zoo", wordB: "sue", phonemeA: "/z/", phonemeB: "/s/" },
      { wordA: "zip", wordB: "sip", phonemeA: "/z/", phonemeB: "/s/" },
      { wordA: "zeal", wordB: "seal", phonemeA: "/z/", phonemeB: "/s/" },
    ],
    spanishTip: "No existe en español estándar pero es igual a /s/ con vibración. Aparece mucho en inglés en plurales y verbos: 'dogs', 'runs', 'lives'. Pon la mano en el cuello y siente la vibración.",
  },
  "/ʃ/": {
    difficulty: "medium",
    articulation: [
      "Tongue further back than /s/, near the palate",
      "Lips slightly rounded and pushed forward",
      "Broader, lower-pitched sound than /s/",
    ],
    minimalPairs: [
      { wordA: "she", wordB: "see", phonemeA: "/ʃ/", phonemeB: "/s/" },
      { wordA: "ship", wordB: "sip", phonemeA: "/ʃ/", phonemeB: "/s/" },
      { wordA: "shoe", wordB: "zoo", phonemeA: "/ʃ/", phonemeB: "/z/" },
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
    minimalPairs: [
      { wordA: "vision", wordB: "fission", phonemeA: "/ʒ/", phonemeB: "/ʃ/" },
      { wordA: "measure", wordB: "mesher", phonemeA: "/ʒ/", phonemeB: "/ʃ/" },
      { wordA: "genre", wordB: "general", phonemeA: "/ʒ/", phonemeB: "/dʒ/" },
    ],
    spanishTip: "No existe en español estándar. Es como /ʃ/ pero con vibración. Aparece en palabras como 'vision', 'measure', 'pleasure'. En algunos dialectos del español rioplatense, la 'll' y 'y' suenan similar.",
  },
  "/h/": {
    difficulty: "easy",
    articulation: [
      "Produced at the glottis — the vocal cords are open",
      "Breathe out gently with the mouth slightly open",
      "No contact points in the mouth",
    ],
    minimalPairs: [
      { wordA: "hat", wordB: "at", phonemeA: "/h/", phonemeB: "∅" },
      { wordA: "hit", wordB: "it", phonemeA: "/h/", phonemeB: "∅" },
      { wordA: "hot", wordB: "got", phonemeA: "/h/", phonemeB: "/g/" },
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
    minimalPairs: [
      { wordA: "church", wordB: "shirt", phonemeA: "/tʃ/", phonemeB: "/ʃ/" },
      { wordA: "cheap", wordB: "sheep", phonemeA: "/tʃ/", phonemeB: "/ʃ/" },
      { wordA: "chin", wordB: "gin", phonemeA: "/tʃ/", phonemeB: "/dʒ/" },
    ],
    spanishTip: "Igual que la 'ch' española de 'mucho', 'chico'. Es el sonido más fácil de las africadas para hispanohablantes — ya lo conoces.",
  },
  "/dʒ/": {
    difficulty: "easy",
    articulation: [
      "Start with tongue touching alveolar ridge, like /d/",
      "Release into the /ʒ/ fricative",
      "Vocal cords vibrate throughout",
    ],
    minimalPairs: [
      { wordA: "judge", wordB: "budge", phonemeA: "/dʒ/", phonemeB: "/b/" },
      { wordA: "gin", wordB: "chin", phonemeA: "/dʒ/", phonemeB: "/tʃ/" },
      { wordA: "jet", wordB: "yet", phonemeA: "/dʒ/", phonemeB: "/j/" },
    ],
    spanishTip: "Similar a la 'y' o 'll' del español rioplatense (como en 'yo' o 'lluvia' pronunciadas con más fuerza). También parecida a la 'ch' pero con vibración. Es la 'j' de 'juice', 'job', 'jump'.",
  },
  "/m/": {
    difficulty: "easy",
    articulation: [
      "Both lips pressed together",
      "Air flows through the nose, not the mouth",
      "Vocal cords vibrate throughout",
    ],
    minimalPairs: [
      { wordA: "man", wordB: "ban", phonemeA: "/m/", phonemeB: "/b/" },
      { wordA: "meet", wordB: "beat", phonemeA: "/m/", phonemeB: "/b/" },
      { wordA: "mail", wordB: "nail", phonemeA: "/m/", phonemeB: "/n/" },
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
    minimalPairs: [
      { wordA: "no", wordB: "go", phonemeA: "/n/", phonemeB: "/g/" },
      { wordA: "night", wordB: "might", phonemeA: "/n/", phonemeB: "/m/" },
      { wordA: "nail", wordB: "tail", phonemeA: "/n/", phonemeB: "/t/" },
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
    minimalPairs: [
      { wordA: "sing", wordB: "sin", phonemeA: "/ŋ/", phonemeB: "/n/" },
      { wordA: "ring", wordB: "rin", phonemeA: "/ŋ/", phonemeB: "/n/" },
      { wordA: "bang", wordB: "ban", phonemeA: "/ŋ/", phonemeB: "/n/" },
    ],
    spanishTip: "Existe en español antes de /k/ o /g/ (como en 'banco', 'tango') pero nunca al final de palabra. En inglés aparece solo al final: 'sing', 'ring', 'going'. Practica terminando palabras con este sonido.",
  },
  "/l/": {
    difficulty: "easy",
    articulation: [
      "Tongue tip presses on the alveolar ridge",
      "Air flows around the sides of the tongue",
      "In 'dark l' (syllable-final), the back of tongue rises toward the velum",
    ],
    minimalPairs: [
      { wordA: "leg", wordB: "beg", phonemeA: "/l/", phonemeB: "/b/" },
      { wordA: "led", wordB: "red", phonemeA: "/l/", phonemeB: "/r/" },
      { wordA: "late", wordB: "rate", phonemeA: "/l/", phonemeB: "/r/" },
    ],
    spanishTip: "Similar a la 'l' española pero en inglés hay dos variantes: 'clear l' (al inicio de sílaba) y 'dark l' (al final, como en 'milk', 'full'). La 'dark l' suena más profunda y no existe en español.",
  },
  "/r/": {
    difficulty: "hard",
    articulation: [
      "Tongue tip curls back slightly or stays behind lower teeth — never touches the palate",
      "Sides of tongue may touch upper back teeth",
      "Lips slightly rounded, no trill or tap",
    ],
    minimalPairs: [
      { wordA: "red", wordB: "led", phonemeA: "/r/", phonemeB: "/l/" },
      { wordA: "rate", wordB: "late", phonemeA: "/r/", phonemeB: "/l/" },
      { wordA: "rain", wordB: "lane", phonemeA: "/r/", phonemeB: "/l/" },
    ],
    spanishTip: "Nunca se vibra como la 'r' española. La lengua no toca el paladar — flota en el aire. Es más parecida a una vocal que a una consonante. Practica con 'red', 'run', 'right'.",
  },
  "/j/": {
    difficulty: "easy",
    articulation: [
      "Tongue body raised toward the hard palate",
      "No contact — glide smoothly into the following vowel",
      "Like the beginning of the /iː/ sound",
    ],
    minimalPairs: [
      { wordA: "yes", wordB: "less", phonemeA: "/j/", phonemeB: "/l/" },
      { wordA: "yet", wordB: "get", phonemeA: "/j/", phonemeB: "/g/" },
      { wordA: "yam", wordB: "jam", phonemeA: "/j/", phonemeB: "/dʒ/" },
    ],
    spanishTip: "Igual que la 'y' española en 'yo', 'ya', 'yoga' (sin el yeísmo fuerte). Es el sonido de 'yes', 'yellow', 'you'. Sonido natural para hispanohablantes.",
  },
  "/w/": {
    difficulty: "easy",
    articulation: [
      "Lips tightly rounded at the start, then relax",
      "Back of tongue raised toward the velum",
      "Glide quickly into the following vowel",
    ],
    minimalPairs: [
      { wordA: "wet", wordB: "yet", phonemeA: "/w/", phonemeB: "/j/" },
      { wordA: "wine", wordB: "vine", phonemeA: "/w/", phonemeB: "/v/" },
      { wordA: "west", wordB: "best", phonemeA: "/w/", phonemeB: "/b/" },
    ],
    spanishTip: "Similar al sonido de la 'u' en diptongos españoles como 'fue', 'bueno', 'agua'. Redondea los labios como para decir 'u' y luego deslízate rápidamente a la siguiente vocal.",
  },
  "/eɪ/": {
    difficulty: "medium",
    articulation: [
      "Start with mouth at mid-front /e/ position",
      "Glide smoothly upward and forward to near /ɪ/",
      "The first element is longer and more prominent",
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
      "Start with mouth wide open, like /æ/ or /ɑː/",
      "Glide up to near-high front /ɪ/",
      "First element is open and long, second is brief",
    ],
    minimalPairs: [
      { wordA: "time", wordB: "team", phonemeA: "/aɪ/", phonemeB: "/iː/" },
      { wordA: "light", wordB: "late", phonemeA: "/aɪ/", phonemeB: "/eɪ/" },
      { wordA: "price", wordB: "place", phonemeA: "/aɪ/", phonemeB: "/eɪ/" },
    ],
    spanishTip: "Parecido al diptongo 'ai' en 'aire' o 'baile' en español. Empieza abierto y sube. Es la vocal de 'I', 'time', 'night', 'my'.",
  },
  "/ɔɪ/": {
    difficulty: "medium",
    articulation: [
      "Start with lips rounded, like /ɔː/",
      "Glide forward and upward to /ɪ/",
      "The rounded first element is key",
    ],
    minimalPairs: [
      { wordA: "boy", wordB: "bay", phonemeA: "/ɔɪ/", phonemeB: "/eɪ/" },
      { wordA: "coin", wordB: "cone", phonemeA: "/ɔɪ/", phonemeB: "/əʊ/" },
      { wordA: "oil", wordB: "ale", phonemeA: "/ɔɪ/", phonemeB: "/eɪ/" },
    ],
    spanishTip: "Parecido al diptongo 'oi' en 'hoy' o 'voy' en español. Empieza redondeado y deslízate hacia adelante. Es la vocal de 'boy', 'oil', 'coin'.",
  },
  "/əʊ/": {
    difficulty: "medium",
    articulation: [
      "Start with central neutral /ə/ position",
      "Round and push lips forward to /ʊ/",
      "First element is relaxed, second is rounded",
    ],
    minimalPairs: [
      { wordA: "go", wordB: "guy", phonemeA: "/əʊ/", phonemeB: "/aɪ/" },
      { wordA: "low", wordB: "law", phonemeA: "/əʊ/", phonemeB: "/ɔː/" },
      { wordA: "coat", wordB: "caught", phonemeA: "/əʊ/", phonemeB: "/ɔː/" },
    ],
    spanishTip: "No es igual a la 'o' española — es un diptongo. Empieza relajado (schwa) y redondea los labios hacia /u/. En inglés británico es /əʊ/, en americano más como /oʊ/. Es la vocal de 'go', 'home', 'no'.",
  },
  "/aʊ/": {
    difficulty: "medium",
    articulation: [
      "Start with mouth wide open, like /æ/ or /ɑː/",
      "Round the lips and glide back to /ʊ/",
      "Strong movement from front open to back rounded",
    ],
    minimalPairs: [
      { wordA: "now", wordB: "no", phonemeA: "/aʊ/", phonemeB: "/əʊ/" },
      { wordA: "down", wordB: "done", phonemeA: "/aʊ/", phonemeB: "/ʌ/" },
      { wordA: "out", wordB: "ought", phonemeA: "/aʊ/", phonemeB: "/ɔː/" },
    ],
    spanishTip: "Parecido al diptongo 'au' en 'auto' o 'causa' en español. Empieza abierto y redondea hacia /u/. Es la vocal de 'now', 'out', 'how', 'town'.",
  },
  "/ɪə/": {
    difficulty: "medium",
    articulation: [
      "Start near /ɪ/ — tongue high front, relaxed",
      "Glide toward the central schwa /ə/",
      "Centering diphthong — moves toward center",
    ],
    minimalPairs: [
      { wordA: "here", wordB: "hair", phonemeA: "/ɪə/", phonemeB: "/eə/" },
      { wordA: "fear", wordB: "fair", phonemeA: "/ɪə/", phonemeB: "/eə/" },
      { wordA: "ear", wordB: "air", phonemeA: "/ɪə/", phonemeB: "/eə/" },
    ],
    spanishTip: "No existe en español. Empieza en /ɪ/ (como una 'i' relajada) y desliza hacia el schwa. Es el sonido de 'here', 'near', 'ear', 'fear'.",
  },
  "/eə/": {
    difficulty: "medium",
    articulation: [
      "Start at mid-front /e/ position",
      "Glide toward the central schwa /ə/",
      "Centering diphthong — moves toward center of mouth",
    ],
    minimalPairs: [
      { wordA: "there", wordB: "here", phonemeA: "/eə/", phonemeB: "/ɪə/" },
      { wordA: "fair", wordB: "fear", phonemeA: "/eə/", phonemeB: "/ɪə/" },
      { wordA: "hair", wordB: "here", phonemeA: "/eə/", phonemeB: "/ɪə/" },
    ],
    spanishTip: "No existe en español. Empieza en /e/ y desliza hacia el schwa. Es el sonido de 'there', 'hair', 'care', 'fair'. Muchos lo pronuncian como vocal simple /ɛː/ en inglés moderno.",
  },
  "/ʊə/": {
    difficulty: "medium",
    articulation: [
      "Start near /ʊ/ — lips loosely rounded",
      "Glide toward the central schwa /ə/",
      "Becoming rare in modern British English — often replaced by /ɔː/",
    ],
    minimalPairs: [
      { wordA: "tour", wordB: "tor", phonemeA: "/ʊə/", phonemeB: "/ɔː/" },
      { wordA: "pure", wordB: "pore", phonemeA: "/ʊə/", phonemeB: "/ɔː/" },
      { wordA: "sure", wordB: "shore", phonemeA: "/ʊə/", phonemeB: "/ɔː/" },
    ],
    spanishTip: "No existe en español. Empieza redondeado (/u/ relajada) y desliza hacia el schwa. Es el sonido de 'tour', 'pure', 'sure'. En inglés moderno muchos hablantes lo sustituyen por /ɔː/.",
  },
};

export const HARD_FOR_SPANISH_SPEAKERS = [
  "/æ/",
  "/ʌ/",
  "/ɜː/",
  "/ɔː/",
  "/ɪ/",
  "/ð/",
  "/θ/",
  "/v/",
  "/ʒ/",
  "/r/",
];
