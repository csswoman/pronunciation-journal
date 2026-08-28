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
      "Spread lips wide horizontally into a firm, exaggerated smile",
      "Raise the front of the tongue high, very close to the hard palate",
      "Tense facial and jaw muscles firmly; hold the sound clear and steady",
    ],
    articulationEs: [
      "Sonríe estirando bien las comisuras de los labios hacia los lados",
      "Eleva la parte delantera de la lengua bien alto, casi tocando el paladar",
      "Tensa los músculos de la cara y la mandíbula: debe sonar firme y definida",
    ],
    minimalPairs: [
      { wordA: "seat", wordB: "sit", phonemeA: "/iː/", phonemeB: "/ɪ/" },
      { wordA: "feet", wordB: "fit", phonemeA: "/iː/", phonemeB: "/ɪ/" },
      { wordA: "leave", wordB: "live", phonemeA: "/iː/", phonemeB: "/ɪ/" },
    ],
    spanishTip: "Es como la 'i' del español pero con más tensión: exagera una sonrisa amplia y aprieta los músculos faciales. La clave que la distingue de /ɪ/ es la firmeza muscular, no solo que dure más tiempo (see, feet, leave).",
  },
  "/ɪ/": {
    difficulty: "hard",
    articulation: [
      "Relax the mouth completely — do not smile or stretch the lips",
      "Drop the jaw slightly and lower the tongue one step below /iː/",
      "Produce a short, lax sound midway between a lazy 'ee' and 'eh'",
    ],
    articulationEs: [
      "Relaja la boca por completo: sin sonreír ni tensar los labios",
      "Deja caer la mandíbula apenas un milímetro y baja un poco la lengua",
      "Emite un sonido corto y flojo, a medio camino entre una 'i' perezosa y una 'e'",
    ],
    minimalPairs: [
      { wordA: "sit", wordB: "seat", phonemeA: "/ɪ/", phonemeB: "/iː/" },
      { wordA: "bit", wordB: "beat", phonemeA: "/ɪ/", phonemeB: "/iː/" },
      { wordA: "ship", wordB: "sheep", phonemeA: "/ɪ/", phonemeB: "/iː/" },
    ],
    spanishTip: "¡El sonido más rentable del inglés! Para el oído hispanohablante suena casi como una 'e' perezosa. Di una 'i', pero afloja toda la fuerza de la mandíbula y no sonrías. Dominar este sonido te evitará confusiones críticas como ship vs sheep o live vs leave.",
  },
  "/ɛ/": {
    difficulty: "medium",
    articulation: [
      "Open the jaw slightly wider than for the Spanish 'e'",
      "Keep lips neutral and slightly parted without spreading too wide",
      "Rest the tongue tip behind lower teeth and emit a short, crisp sound",
    ],
    articulationEs: [
      "Abre la mandíbula un poco más que para la 'e' española (deja caer la barbilla)",
      "Mantén los labios relajados y neutros, sin forzar una sonrisa",
      "Apoya la punta de la lengua detrás de los dientes inferiores y emite un sonido corto",
    ],
    minimalPairs: [
      { wordA: "bed", wordB: "bad", phonemeA: "/ɛ/", phonemeB: "/æ/" },
      { wordA: "pen", wordB: "pan", phonemeA: "/ɛ/", phonemeB: "/æ/" },
      { wordA: "set", wordB: "sat", phonemeA: "/ɛ/", phonemeB: "/æ/" },
    ],
    spanishTip: "Empieza diciendo la 'e' de 'mesa', pero deja caer la mandíbula un centímetro más. Es más abierta y corta que en español. Cuidado con no cerrarla ni convertirla en diptongo: bed se dice con /ɛ/ pura, nunca 'beid'.",
  },
  "/æ/": {
    difficulty: "hard",
    articulation: [
      "Open the mouth wide vertically and stretch the corners of the lips outward",
      "Flatten the tongue low in the mouth with the tip pressed against lower front teeth",
      "Aim to say an 'eh' while holding your mouth open in an 'ah' shape",
    ],
    articulationEs: [
      "Abre la boca en grande verticalmente y a la vez estira los labios hacia los lados",
      "Aplana la lengua en el fondo empujando la punta contra los dientes inferiores",
      "Intenta decir 'e' con la boca abierta en posición de 'a': saldrá un sonido brillante y plano",
    ],
    minimalPairs: [
      { wordA: "cat", wordB: "cut", phonemeA: "/æ/", phonemeB: "/ʌ/" },
      { wordA: "bad", wordB: "bed", phonemeA: "/æ/", phonemeB: "/ɛ/" },
      { wordA: "man", wordB: "men", phonemeA: "/æ/", phonemeB: "/ɛ/" },
    ],
    spanishTip: "No existe en español y es súper importante. Es el híbrido exacto entre 'a' y 'e': pon la boca como si fueras a decir una 'a' gigante, pero intenta pronunciar una 'e'. Es el sonido inconfundible de cat, apple, bad y man.",
  },
  "/ɑ/": {
    difficulty: "medium",
    articulation: [
      "Drop the jaw wide open, like saying 'Ahhh' at the doctor",
      "Pull the body of the tongue low and back into the throat",
      "Keep lips completely relaxed and unrounded, even when spelled with 'o'",
    ],
    articulationEs: [
      "Abre la mandíbula al máximo, como cuando el médico te pide decir '¡Ahhh!'",
      "Lleva la lengua abajo y hacia atrás en la boca",
      "Deja los labios totalmente relajados y sin redondear, aunque la palabra se escriba con 'o'",
    ],
    minimalPairs: [
      { wordA: "hot", wordB: "hut", phonemeA: "/ɑ/", phonemeB: "/ʌ/" },
      { wordA: "cop", wordB: "cap", phonemeA: "/ɑ/", phonemeB: "/æ/" },
      { wordA: "stock", wordB: "stack", phonemeA: "/ɑ/", phonemeB: "/æ/" },
    ],
    spanishTip: "¡El truco de la 'o' americana! En palabras escritas con 'o' como hot, stop, box, coffee o job, la pronunciación estándar en EE.UU. es esta /ɑ/ abierta (suenan 'jat', 'stap', 'baks'). Abre la boca como en el médico y no redondees los labios.",
  },
  "/ɔ/": {
    difficulty: "medium",
    articulation: [
      "Open the jaw and shape lips into a loose, vertical oval",
      "Pull the back of the tongue low and slightly upward",
      "Produce a deep, hollow 'aw' sound from the back of the mouth",
    ],
    articulationEs: [
      "Abre la mandíbula y forma un óvalo vertical suave con los labios",
      "Retrae la parte trasera de la lengua hacia el fondo de la boca",
      "Emite una 'o' profunda, más abierta y ahuecada que la 'o' española",
    ],
    minimalPairs: [
      { wordA: "law", wordB: "low", phonemeA: "/ɔ/", phonemeB: "/oʊ/" },
      { wordA: "caught", wordB: "coat", phonemeA: "/ɔ/", phonemeB: "/oʊ/" },
      { wordA: "bought", wordB: "boat", phonemeA: "/ɔ/", phonemeB: "/oʊ/" },
    ],
    spanishTip: "Es la 'o' profunda y alargada de law, all, talk y caught. Pon la boca en forma de óvalo vertical (como sorprendido). En muchas regiones de EE.UU. suena casi idéntica a /ɑ/ (caught y cot se confunden), así que si te cuesta distinguirlas, no te preocupes: es un fenómeno nativo real.",
  },
  "/ʊ/": {
    difficulty: "medium",
    articulation: [
      "Round lips very loosely without pursing or pushing them forward",
      "Raise the back of the tongue toward the soft palate with zero tension",
      "Emit a short, muted, relaxed 'uh-oo' sound",
    ],
    articulationEs: [
      "Redondea los labios apenas un poco, manteniéndolos suaves y flojos (sin hacer beso)",
      "Eleva la parte trasera de la lengua sin apretar la garganta",
      "Produce un sonido corto, apagado y suave: una 'u' floja y perezosa",
    ],
    minimalPairs: [
      { wordA: "book", wordB: "boot", phonemeA: "/ʊ/", phonemeB: "/uː/" },
      { wordA: "pull", wordB: "pool", phonemeA: "/ʊ/", phonemeB: "/uː/" },
      { wordA: "full", wordB: "fool", phonemeA: "/ʊ/", phonemeB: "/uː/" },
    ],
    spanishTip: "La 'u' relajada. En español siempre apretamos los labios hacia adelante como dando un beso para decir 'u'. Para /ʊ/ (book, good, look, put), no hagas beso: relaja los labios y emite un sonido corto y suave. Es el opuesto de la /uː/ tensa de moon.",
  },
  "/uː/": {
    difficulty: "easy",
    articulation: [
      "Tightly round and push lips outward as if whistling or kissing",
      "Raise the back of the tongue high toward the soft palate",
      "Maintain muscular tension and produce a clear, sustained 'oo' sound",
    ],
    articulationEs: [
      "Redondea los labios con fuerza empujándolos hacia afuera, como para dar un beso o silbar",
      "Sube la parte trasera de la lengua bien alto hacia el velo del paladar",
      "Mantén la tensión firme y emite una 'u' larga, limpia y definida",
    ],
    minimalPairs: [
      { wordA: "fool", wordB: "full", phonemeA: "/uː/", phonemeB: "/ʊ/" },
      { wordA: "food", wordB: "foot", phonemeA: "/uː/", phonemeB: "/ʊ/" },
      { wordA: "pool", wordB: "pull", phonemeA: "/uː/", phonemeB: "/ʊ/" },
    ],
    spanishTip: "Esta sí es la 'u' del beso: proyecta los labios hacia afuera y aprieta con firmeza. Es más tensa y definida que la 'u' del español. Piensa en blue, shoe, food y moon. Contrasta directamente con la /ʊ/ relajada de foot y book.",
  },
  "/ʌ/": {
    difficulty: "hard",
    articulation: [
      "Keep lips neutral and resting naturally, not rounded or spread",
      "Rest the tongue centrally in the mouth, slightly pulled back",
      "Release a short, punchy impulse of voice from the chest/belly",
    ],
    articulationEs: [
      "Entreabre la boca de forma neutra, sin redondear los labios ni sonreír",
      "Deja la lengua en el centro de la boca, apenas un toque hacia atrás",
      "Suelta un golpe de voz corto y seco desde el abdomen, como un quejido leve",
    ],
    minimalPairs: [
      { wordA: "cup", wordB: "cap", phonemeA: "/ʌ/", phonemeB: "/æ/" },
      { wordA: "cut", wordB: "cat", phonemeA: "/ʌ/", phonemeB: "/æ/" },
      { wordA: "luck", wordB: "lock", phonemeA: "/ʌ/", phonemeB: "/ɑ/" },
    ],
    spanishTip: "El sonido del 'pequeño golpe en el estómago': imagina que sueltas un 'uh' corto y seco al recibir un toque en el abdomen. No es una 'a' abierta ni una 'o'. Es el sonido tónico de cup, bus, love, money y sun. ¡Aparece siempre en la sílaba con fuerza de voz!",
  },
  "/ɜr/": {
    difficulty: "hard",
    articulation: [
      "Bunch or curl the tongue tip backward in the center of the mouth — touching nothing",
      "Press the sides of the tongue against upper back molars with lips slightly rounded",
      "Sustain vocal cord vibration into a single, fused rhotic vowel sound",
    ],
    articulationEs: [
      "Ahueca o enrolla la punta de la lengua hacia atrás en el centro de la boca: ¡sin tocar nada!",
      "Apoya los laterales de la lengua contra las muelas superiores y redondea un poco los labios",
      "Haz vibrar la voz de forma continua: la vocal y la 'r' son un solo sonido inseparable",
    ],
    minimalPairs: [
      { wordA: "hurt", wordB: "heart", phonemeA: "/ɜr/", phonemeB: "/ɑ/" },
      { wordA: "shirt", wordB: "short", phonemeA: "/ɜr/", phonemeB: "/ɔ/" },
      { wordA: "bird", wordB: "beard", phonemeA: "/ɜr/", phonemeB: "/ɪ/" },
    ],
    spanishTip: "¡La famosa vocal con R americana! El gran secreto: no intentes pronunciar una vocal y luego una R por separado (no digas 'b-e-r-d' ni 'b-i-r-d'). La lengua flota suspendida hacia atrás y todo el sonido es una masa continua: bird, work, her, first.",
  },
  "/ə/": {
    difficulty: "medium",
    articulation: [
      "Relax every facial muscle completely: lips, jaw, and tongue neutral",
      "Keep the tongue resting mid-center in the mouth",
      "Produce a very brief, weak murmur — only in unstressed syllables",
    ],
    articulationEs: [
      "Desconecta todos los músculos faciales: labios, lengua y mandíbula completamente neutros",
      "Deja la lengua quieta en el centro exacto de la boca",
      "Suelta un murmullo ultra corto y débil, sin fuerza ni acento (como un suspiro apagado)",
    ],
    // El schwa nunca contrasta en sílaba tónica, así que no tiene pares mínimos.
    // Se domina con ritmo y reducción (sílaba fuerte clara, débiles reducidas).
    minimalPairs: [],
    spanishTip: "¡El sonido rey del inglés! Es el más común de todos. El error número uno en español es pronunciar cada vocal escrita con la misma fuerza. En inglés, las sílabas débiles se apagan a este murmullo relajado: bə-NA-nə, a-BOUT, SO-fə. ¡Nunca lo acentúes!",
  },
  "/p/": {
    difficulty: "easy",
    articulation: [
      "Press both lips firmly together, blocking all airflow",
      "Build up air pressure behind the lips with vocal cords silent",
      "Release abruptly with a crisp puff of air (aspiration at word starts)",
    ],
    articulationEs: [
      "Junta ambos labios con firmeza bloqueando por completo la salida del aire",
      "Acumula presión de aire detrás de los labios sin activar las cuerdas vocales",
      "Abre los labios de golpe liberando una pequeña explosión de aire",
    ],
    minimalPairs: [
      { wordA: "pat", wordB: "bat", phonemeA: "/p/", phonemeB: "/b/" },
      { wordA: "pig", wordB: "big", phonemeA: "/p/", phonemeB: "/b/" },
      { wordA: "pie", wordB: "buy", phonemeA: "/p/", phonemeB: "/b/" },
    ],
    spanishTip: "Es como tu 'p' española, pero con un 'puff' de aire al inicio de palabras tónicas (pen, park, power). Pon una hoja de papel a dos centímetros de tus labios: al decir paper, la hoja debe moverse con la ráfaga de aire.",
  },
  "/b/": {
    difficulty: "easy",
    articulation: [
      "Press both lips firmly together to stop airflow",
      "Vibrate vocal cords in the throat just before opening",
      "Release lips smoothly with voiced resonance and minimal puff of air",
    ],
    articulationEs: [
      "Cierra ambos labios con fuerza para cortar el paso del aire",
      "Haz vibrar las cuerdas vocales en la garganta antes de abrir la boca",
      "Separa los labios con un sonido sonoro y con mucho menos escape de aire que en /p/",
    ],
    minimalPairs: [
      { wordA: "ban", wordB: "van", phonemeA: "/b/", phonemeB: "/v/" },
      { wordA: "berry", wordB: "very", phonemeA: "/b/", phonemeB: "/v/" },
      { wordA: "bat", wordB: "pat", phonemeA: "/b/", phonemeB: "/p/" },
    ],
    spanishTip: "En español suavizamos la 'b' entre vocales (en lobo casi no cerramos los labios). En inglés, la /b/ siempre junta los dos labios con firmeza (habit, baby). Al final de palabra (cab vs cap), el secreto es hacer que la vocal anterior suene más larga.",
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
      "Press tongue tip firmly against the bumpy gum ridge behind upper teeth (not the teeth!)",
      "Trap air behind the seal with vocal cords resting",
      "Snap the tongue away, releasing a sharp puff of air",
    ],
    articulationEs: [
      "Apoya la punta de la lengua en la encía superior detrás de los dientes (la cresta alveolar, ¡no los dientes!)",
      "Acumula aire detrás de la lengua sin hacer vibrar la garganta",
      "Desprende la lengua rápidamente disparando un chasquido de aire nítido",
    ],
    minimalPairs: [
      { wordA: "ten", wordB: "den", phonemeA: "/t/", phonemeB: "/d/" },
      { wordA: "tip", wordB: "dip", phonemeA: "/t/", phonemeB: "/d/" },
      { wordA: "town", wordB: "down", phonemeA: "/t/", phonemeB: "/d/" },
    ],
    spanishTip: "En español la 't' es dental (tocas los dientes y es seca). En inglés apoyas la lengua más arriba, en la encía, y sale un soplo de aire (tea, time). Además, entre dos vocales (water, city, butter) se convierte en un toque suave idéntico a la 'r' de cara (el flap T americano).",
  },
  "/d/": {
    difficulty: "easy",
    articulation: [
      "Press tongue tip firmly against the gum ridge behind upper front teeth",
      "Engage vocal cords to vibrate in the throat",
      "Release the seal with a firm, voiced tap",
    ],
    articulationEs: [
      "Coloca la punta de la lengua firmemente contra la encía superior detrás de los dientes",
      "Enciende la vibración de las cuerdas vocales en la garganta",
      "Suelta el contacto con un golpe sonoro y definido",
    ],
    minimalPairs: [
      { wordA: "den", wordB: "ten", phonemeA: "/d/", phonemeB: "/t/" },
      { wordA: "day", wordB: "they", phonemeA: "/d/", phonemeB: "/ð/" },
      { wordA: "dare", wordB: "there", phonemeA: "/d/", phonemeB: "/ð/" },
    ],
    spanishTip: "¡Cuidado con suavizarla! En español decimos lado o cada casi sin tocar los dientes (suena como /ð/). En inglés, la /d/ NUNCA se suaviza: siempre golpea la encía con firmeza (day ≠ they). Al final de palabra (bad vs bat), alarga la vocal antes de la /d/.",
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
      "Raise the back of the tongue to seal against the soft palate",
      "Hold air pressure with vocal cords silent",
      "Drop tongue sharply, releasing a crisp burst of air",
    ],
    articulationEs: [
      "Sube la parte trasera de la lengua sellando el paso del aire contra el paladar blando",
      "Retén la presión de aire sin activar las cuerdas vocales",
      "Baja la lengua de golpe soltando una ráfaga crujiente de aire",
    ],
    minimalPairs: [
      { wordA: "came", wordB: "game", phonemeA: "/k/", phonemeB: "/g/" },
      { wordA: "coat", wordB: "goat", phonemeA: "/k/", phonemeB: "/g/" },
      { wordA: "class", wordB: "glass", phonemeA: "/k/", phonemeB: "/g/" },
    ],
    spanishTip: "Es como la 'k' o la 'c' de casa, pero con un detalle americano: al inicio de palabras como cat, key o cool, expulsa una ráfaga de aire más fuerte y definida. Si pones la mano frente a la boca debes sentir el soplido.",
  },
  "/g/": {
    difficulty: "easy",
    articulation: [
      "Raise back of the tongue to seal against the soft palate",
      "Vibrate vocal cords in the throat before release",
      "Release the tongue seal with a solid, resonant voice burst",
    ],
    articulationEs: [
      "Sube la parte trasera de la lengua bloqueando el paladar blando en la misma posición que para /k/",
      "Activa la vibración de las cuerdas vocales en la garganta antes de soltar",
      "Libera el bloqueo con un sonido sólido y limpio",
    ],
    minimalPairs: [
      { wordA: "game", wordB: "came", phonemeA: "/g/", phonemeB: "/k/" },
      { wordA: "goat", wordB: "coat", phonemeA: "/g/", phonemeB: "/k/" },
      { wordA: "gold", wordB: "cold", phonemeA: "/g/", phonemeB: "/k/" },
    ],
    spanishTip: "En español entre vocales (como en agua o amigo) la 'g' se vuelve suave y raspadita. En inglés, la /g/ siempre mantiene un bloqueo firme y sonoro (again, sugar). Al final de palabra (bag vs back), haz durar más la vocal antes de la /g/ sonora.",
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
      "Gently rest upper front teeth on the inner edge of the lower lip",
      "Blow a continuous stream of air through the small contact gap",
      "Keep vocal cords completely silent (voiceless)",
    ],
    articulationEs: [
      "Apoya suavemente el borde de los dientes superiores sobre la parte interna del labio inferior",
      "Sopla un flujo de aire continuo y constante por la rendija",
      "Mantén la garganta en silencio (sin vibración de cuerdas vocales)",
    ],
    minimalPairs: [
      { wordA: "fan", wordB: "van", phonemeA: "/f/", phonemeB: "/v/" },
      { wordA: "fat", wordB: "vat", phonemeA: "/f/", phonemeB: "/v/" },
      { wordA: "fine", wordB: "vine", phonemeA: "/f/", phonemeB: "/v/" },
    ],
    spanishTip: "¡Sonido amigo! Es idéntico a la 'f' española de fuego o café. Simplemente coloca los dientes superiores sobre el labio inferior y sopla aire continuo sin encender la voz en la garganta.",
  },
  "/v/": {
    difficulty: "hard",
    articulation: [
      "Place upper front teeth on the lower lip — exactly as for /f/",
      "Vibrate vocal cords to produce a buzzing motor sensation as air flows",
      "Never let top and bottom lips touch each other (that would make /b/)",
    ],
    articulationEs: [
      "Apoya los dientes superiores sobre el labio inferior exactamente igual que para hacer una /f/",
      "Enciende la voz: haz vibrar la garganta creando un zumbido eléctrico mientras sale el aire",
      "PROHIBIDO juntar los dos labios (si juntas los dos labios dirás /b/ y no /v/)",
    ],
    minimalPairs: [
      { wordA: "van", wordB: "ban", phonemeA: "/v/", phonemeB: "/b/" },
      { wordA: "vat", wordB: "bat", phonemeA: "/v/", phonemeB: "/b/" },
      { wordA: "vine", wordB: "fine", phonemeA: "/v/", phonemeB: "/f/" },
    ],
    spanishTip: "En español 'b' y 'v' suenan exactamente igual (boca y vaca usan los dos labios). En inglés, la /v/ es un sonido completamente distinto: dientes superiores sobre el labio inferior con vibración de motor (very, van, love). Siente el cosquilleo en el labio inferior.",
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
      "Place the tip of the tongue gently between upper and lower front teeth",
      "Blow a soft, continuous stream of air over the tongue without voicing",
      "Produce a gentle friction hiss with zero popping or clicking",
    ],
    articulationEs: [
      "Saca apenas la punta de la lengua entre los dientes superiores e inferiores (muérdela suavemente sin apretar)",
      "Sopla aire continuo y silencioso sobre la lengua, sin encender la garganta",
      "Genera una suave brisa sin golpes secos ni siseos de 's'",
    ],
    minimalPairs: [
      { wordA: "think", wordB: "sink", phonemeA: "/θ/", phonemeB: "/s/" },
      { wordA: "thin", wordB: "tin", phonemeA: "/θ/", phonemeB: "/t/" },
      { wordA: "three", wordB: "tree", phonemeA: "/θ/", phonemeB: "/t/" },
    ],
    spanishTip: "Es la 'z' de España (zapato, cielo). Si eres de Latinoamérica, saca la puntita de la lengua entre los dientes como mordiéndotela despacio y sopla aire suave. No la conviertas en 's' (sink ≠ think) ni en 't' (tin ≠ thin). Es la 'th' de think, three y thanks.",
  },
  "/ð/": {
    difficulty: "hard",
    articulation: [
      "Place the tongue tip lightly between or just behind the front teeth — same as /θ/",
      "Vibrate vocal cords continuously while blowing air over the tongue",
      "Feel the buzzing vibration right at the tip of the tongue",
    ],
    articulationEs: [
      "Coloca la punta de la lengua asomando ligeramente entre los dientes (igual que en /θ/)",
      "Haz vibrar las cuerdas vocales mientras dejas salir el aire (debe zumbar en la punta de la lengua)",
      "Mantén el flujo de aire constante sin tapar la boca de golpe",
    ],
    minimalPairs: [
      { wordA: "then", wordB: "ten", phonemeA: "/ð/", phonemeB: "/t/" },
      { wordA: "those", wordB: "dose", phonemeA: "/ð/", phonemeB: "/d/" },
      { wordA: "either", wordB: "ether", phonemeA: "/ð/", phonemeB: "/θ/" },
    ],
    spanishTip: "¡Buenas noticias: ya dominas este sonido! Es exactamente la 'd' suave que usas en español al decir cada o todo. El reto es que en inglés aparece al principio de palabras esenciales: the, this, that, they. No la endurezcas diciendo una 'd' fuerte: deja la lengua entre los dientes y hazla zumbar.",
  },
  "/s/": {
    difficulty: "easy",
    articulation: [
      "Bring teeth close together with lips parted in a slight smile",
      "Place tongue tip near the upper gum ridge without touching, creating a narrow slit",
      "Blow a clean, sharp, continuous hiss (like a snake 'ssss')",
    ],
    articulationEs: [
      "Junta los dientes casi por completo y estira ligeramente las comisuras de los labios",
      "Acerca la punta de la lengua a la encía superior sin llegar a tocarla, dejando un canal estrecho",
      "Expulsa un siseo limpio, agudo y continuo como el sonido de una serpiente ('ssss')",
    ],
    minimalPairs: [
      { wordA: "sue", wordB: "zoo", phonemeA: "/s/", phonemeB: "/z/" },
      { wordA: "sip", wordB: "zip", phonemeA: "/s/", phonemeB: "/z/" },
      { wordA: "seal", wordB: "zeal", phonemeA: "/s/", phonemeB: "/z/" },
    ],
    spanishTip: "Es igual a tu 's' de sol. La gran trampa: en inglés, muchas palabras escritas con 's' al final (como plurales dogs o verbos runs, is, has) en realidad se pronuncian con la vibrante /z/. Reserva la /s/ limpia y sorda para palabras como see, bus y yes.",
  },
  "/z/": {
    difficulty: "hard",
    articulation: [
      "Keep teeth and tongue in the exact same position as for /s/",
      "Engage vocal cords to produce a strong buzzing bee sound ('zzzz')",
      "Feel the intense buzzing resonance on your front teeth and in your throat",
    ],
    articulationEs: [
      "Coloca la boca y la lengua exactamente igual que para hacer una 's' (dientes casi juntos)",
      "Enciende la vibración en las cuerdas vocales: crea el zumbido de una abeja ('zzzz')",
      "Siente la vibración intensa en tus dientes frontales y en la garganta",
    ],
    minimalPairs: [
      { wordA: "zoo", wordB: "sue", phonemeA: "/z/", phonemeB: "/s/" },
      { wordA: "zip", wordB: "sip", phonemeA: "/z/", phonemeB: "/s/" },
      { wordA: "zeal", wordB: "seal", phonemeA: "/z/", phonemeB: "/s/" },
    ],
    spanishTip: "¡El zumbido de la abeja! No existe en español, pero es ultra frecuente en inglés (is, was, easy, music, dogs, eyes). Pon tus dedos en la garganta mientras haces 'ssss' y luego enciende la voz: notarás un zumbido inmediato. Este sonido distingue rice (arroz) de rise (levantarse).",
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
      "Flare lips slightly forward into a soft rounded circle (like blowing a kiss)",
      "Draw tongue body back slightly from the gum ridge toward the palate",
      "Blow a wide, gentle, low-pitched rush of air — the universal 'shhh!' sound",
    ],
    articulationEs: [
      "Proyecta los labios hacia adelante en un círculo suave (como mandando un beso al aire)",
      "Lleva la lengua un paso más atrás que para la 's', ensanchándola hacia el paladar",
      "Sopla un chorro de aire amplio y suave, más grave que la 's': el sonido universal de '¡shhh!'",
    ],
    minimalPairs: [
      { wordA: "she", wordB: "see", phonemeA: "/ʃ/", phonemeB: "/s/" },
      { wordA: "ship", wordB: "sip", phonemeA: "/ʃ/", phonemeB: "/s/" },
      { wordA: "shoe", wordB: "sue", phonemeA: "/ʃ/", phonemeB: "/s/" },
    ],
    spanishTip: "Es el gesto universal de pedir silencio: '¡Shhh!'. Aunque no existe en el abecedario español, lo conoces de sobra. Cuidado con no convertirlo en una 'ch' seca: la /ʃ/ es continua y suave, como en she, shoe, fashion y English (cheap no es lo mismo que sheep).",
  },
  "/ʒ/": {
    difficulty: "hard",
    articulation: [
      "Set lips and tongue in the exact 'shhh' position (/ʃ/)",
      "Activate vocal cords to add a deep, resonant buzz to the airflow",
      "Maintain a smooth, continuous voiced friction without hard stops",
    ],
    articulationEs: [
      "Pon los labios y la lengua en la posición exacta de pedir silencio ('shhh')",
      "Activa las cuerdas vocales para que el sonido 'sh' vibre con un zumbido rico y profundo",
      "Deja fluir el aire continuo sintiendo el cosquilleo en el paladar y los labios",
    ],
    minimalPairs: [
      { wordA: "glazier", wordB: "glacier", phonemeA: "/ʒ/", phonemeB: "/ʃ/" },
      { wordA: "version", wordB: "virgin", phonemeA: "/ʒ/", phonemeB: "/dʒ/" },
      { wordA: "composure", wordB: "composer", phonemeA: "/ʒ/", phonemeB: "/z/" },
    ],
    spanishTip: "Imagina decir '¡shhh!' pero encendiendo el motor de la garganta. Si has escuchado el acento argentino o uruguayo al decir playa o yo, es casi idéntico. Es el sonido suave y elegante de vision, measure, treasure, casual y decision.",
  },
  "/h/": {
    difficulty: "easy",
    articulation: [
      "Open mouth loosely with lips and tongue completely relaxed",
      "Breathe out warm air from deep in the throat, as if fogging up a mirror",
      "Keep airflow gentle and whispery without any scratchy friction",
    ],
    articulationEs: [
      "Entreabre la boca de forma relajada, sin tocar nada con la lengua ni los labios",
      "Espira aire tibio desde el fondo de la garganta, exactamente como si quisieras empañar un cristal o tus lentes",
      "Haz que el aire pase suave y limpio, sin raspar la garganta",
    ],
    minimalPairs: [
      { wordA: "hat", wordB: "at", phonemeA: "/h/", phonemeB: "∅" },
      { wordA: "hit", wordB: "it", phonemeA: "/h/", phonemeB: "∅" },
      { wordA: "hold", wordB: "old", phonemeA: "/h/", phonemeB: "∅" },
    ],
    spanishTip: "¡Dos reglas de oro! 1) En inglés la 'h' NO es muda (hello, happy, house se pronuncian). 2) NO es la 'j' fuerte española de jamón ni raspa la garganta: es simplemente un suspiro de aire tibio, como cuando echas vaho para empañar un espejo.",
  },
  "/tʃ/": {
    difficulty: "easy",
    articulation: [
      "Start with tongue sealing the gum ridge like /t/",
      "Push lips slightly forward and rounded",
      "Release the seal crisply into an explosive 'sh' sound",
    ],
    articulationEs: [
      "Empieza bloqueando el aire con la lengua en la encía superior, como para hacer una 't'",
      "Redondea un poco los labios hacia adelante",
      "Suelta el bloqueo de golpe transformándolo de inmediato en un sonido 'sh' crujiente y seco",
    ],
    minimalPairs: [
      { wordA: "chair", wordB: "share", phonemeA: "/tʃ/", phonemeB: "/ʃ/" },
      { wordA: "cheap", wordB: "sheep", phonemeA: "/tʃ/", phonemeB: "/ʃ/" },
      { wordA: "chin", wordB: "gin", phonemeA: "/tʃ/", phonemeB: "/dʒ/" },
    ],
    spanishTip: "Es idéntico a la 'ch' española de chocolate y chico. Lo crucial no es cómo se hace, sino cuándo usarlo: no lo confundas con el sonido suave 'sh' (/ʃ/). Decir chair (silla) tiene un golpe seco 'ch', mientras que share (compartir) es un suspiro continuo 'sh'.",
  },
  "/dʒ/": {
    difficulty: "easy",
    articulation: [
      "Start with tongue sealing firmly against the gum ridge like /d/",
      "Engage vocal cords with full power from the start",
      "Release the seal into an explosive, voiced 'zh' burst",
    ],
    articulationEs: [
      "Apoya la lengua firmemente en la encía superior como si fueras a decir una 'd'",
      "Haz vibrar con fuerza las cuerdas vocales desde el primer instante",
      "Suelta la lengua con un golpe explosivo y sonoro: una 'ch' potente con vibración ('dy')",
    ],
    minimalPairs: [
      { wordA: "gin", wordB: "chin", phonemeA: "/dʒ/", phonemeB: "/tʃ/" },
      { wordA: "jet", wordB: "yet", phonemeA: "/dʒ/", phonemeB: "/j/" },
      { wordA: "jam", wordB: "yam", phonemeA: "/dʒ/", phonemeB: "/j/" },
    ],
    spanishTip: "Es la 'ch' española pero con vibración en la garganta. Es el sonido de la 'j' inglesa en job, juice, jump y judge. Cuidado con no confundirla con la /j/ suave de yes: jet (avión) empieza con golpe fuerte /dʒ/, mientras que yet (todavía) empieza suave como 'ie'.",
  },
  "/m/": {
    difficulty: "easy",
    articulation: [
      "Close both lips gently together to seal the mouth",
      "Vibrate vocal cords and direct all sound through the nose",
      "Hold the nasal hum steadily before opening lips",
    ],
    articulationEs: [
      "Junta ambos labios suavemente cerrando la boca",
      "Haz vibrar las cuerdas vocales dejando que todo el aire resuene por la nariz",
      "Mantén el zumbido nasal continuo antes de abrir los labios",
    ],
    minimalPairs: [
      { wordA: "mail", wordB: "nail", phonemeA: "/m/", phonemeB: "/n/" },
      { wordA: "meet", wordB: "neat", phonemeA: "/m/", phonemeB: "/n/" },
      { wordA: "might", wordB: "night", phonemeA: "/m/", phonemeB: "/n/" },
    ],
    spanishTip: "¡Sonido 100% natural para ti! Es exactamente igual a la 'm' española de mamá y mar. En inglés, asegúrate de mantener los labios bien cerrados cuando aparece al final de palabras como time, dream y from para que no se convierta en 'n'.",
  },
  "/n/": {
    difficulty: "easy",
    articulation: [
      "Press tongue tip against the upper gum ridge behind front teeth",
      "Vibrate vocal cords and let the sound resonate through the nose",
      "Release the tongue gently as you transition into the next vowel",
    ],
    articulationEs: [
      "Apoya la punta de la lengua contra la encía superior (la cresta alveolar detrás de los dientes)",
      "Deja que el sonido resuene a través de la nariz con las cuerdas vocales activas",
      "Despega la lengua con suavidad al pasar a la siguiente vocal",
    ],
    minimalPairs: [
      { wordA: "night", wordB: "might", phonemeA: "/n/", phonemeB: "/m/" },
      { wordA: "sin", wordB: "sing", phonemeA: "/n/", phonemeB: "/ŋ/" },
      { wordA: "nail", wordB: "mail", phonemeA: "/n/", phonemeB: "/m/" },
    ],
    spanishTip: "Prácticamente igual a la 'n' española de nube o pan. La única sutileza: en inglés la lengua apoya un poquito más arriba (en la encía rugosa, no en la cara interna de los dientes). Es el sonido claro de no, night, sun y green.",
  },
  "/ŋ/": {
    difficulty: "medium",
    articulation: [
      "Keep mouth open and press the back of the tongue firmly against the soft palate",
      "Vibrate vocal cords and channel all airflow through the nose",
      "Cut the sound off in the nose without letting a 'g' or 'k' pop at the end",
    ],
    articulationEs: [
      "Abre la boca y sella la parte trasera de la lengua contra el paladar blando (como si fueras a decir 'g')",
      "Deja la boca abierta y expulsa todo el sonido por la nariz con vibración de cuerdas vocales",
      "Corta el sonido en la nariz SIN soltar una 'g' ni una 'k' al final",
    ],
    minimalPairs: [
      { wordA: "sing", wordB: "sin", phonemeA: "/ŋ/", phonemeB: "/n/" },
      { wordA: "wing", wordB: "win", phonemeA: "/ŋ/", phonemeB: "/n/" },
      { wordA: "bang", wordB: "ban", phonemeA: "/ŋ/", phonemeB: "/n/" },
    ],
    spanishTip: "Ya lo haces en español en la 'n' de banco o tango. El truco del profe: en inglés está al final de palabras (sing, king, morning). ¡NUNCA pronuncies la 'g' final! La boca se queda quieta y el sonido se apaga en la nariz: di 'sin-g' cortando antes de que la 'g' explote.",
  },
  "/l/": {
    difficulty: "easy",
    articulation: [
      "Touch the tongue tip to the gum ridge behind upper front teeth",
      "Let voiced air stream freely around both sides of the tongue",
      "For 'dark L' (at word ends), also raise the back of the tongue toward the throat",
    ],
    articulationEs: [
      "Apoya la punta de la lengua firmemente en la encía superior detrás de los dientes frontales",
      "Deja que el aire fluya libremente por ambos lados de la lengua con sonido sonoro",
      "Al final de palabra ('dark L'), eleva además la parte trasera de la lengua hacia la garganta para un tono más profundo y hueco",
    ],
    minimalPairs: [
      { wordA: "light", wordB: "right", phonemeA: "/l/", phonemeB: "/r/" },
      { wordA: "led", wordB: "red", phonemeA: "/l/", phonemeB: "/r/" },
      { wordA: "late", wordB: "rate", phonemeA: "/l/", phonemeB: "/r/" },
    ],
    spanishTip: "En inglés hay dos 'L': 1) Al inicio (light, love) es clara, parecida a la española. 2) Al final o antes de consonante (milk, ball, feel) es la 'Dark L': la parte trasera de la lengua sube y suena más oscura y profunda, casi como una pequeña 'u' hueca en el fondo de la boca.",
  },
  "/r/": {
    difficulty: "hard",
    articulation: [
      "Bunch the tongue in the center or curl the tip back — it must NEVER touch anything!",
      "Press tongue sides against upper back molars and round lips slightly",
      "Emit a smooth, continuous voiced resonance with zero trills, taps, or tongue flaps",
    ],
    articulationEs: [
      "Curva la punta de la lengua hacia atrás o agrúpala en el centro de la boca: ¡NUNCA debe tocar el paladar ni los dientes!",
      "Apoya los bordes laterales de la lengua contra los molares superiores y redondea ligeramente los labios",
      "Emite un rugido suave y continuo con las cuerdas vocales, sin ningún golpe ni aleteo",
    ],
    minimalPairs: [
      { wordA: "red", wordB: "led", phonemeA: "/r/", phonemeB: "/l/" },
      { wordA: "rate", wordB: "late", phonemeA: "/r/", phonemeB: "/l/" },
      { wordA: "rain", wordB: "lane", phonemeA: "/r/", phonemeB: "/l/" },
    ],
    spanishTip: "¡La regla de oro: CERO vibración! En español la 'r' golpea el paladar (pero, perro). En inglés americano, la lengua flota en el aire sin tocar nada y los labios se redondean un poco (red, run, car). Imagina el sonido de un motor suave ('rrr'). Y recuerda: en EE.UU. la R se pronuncia siempre, incluso al final de palabra.",
  },
  "/j/": {
    difficulty: "easy",
    articulation: [
      "Raise the tongue body high toward the hard palate, like preparing for /iː/",
      "Keep vocal cords humming with zero friction or contact",
      "Glide smoothly and instantly into the following vowel",
    ],
    articulationEs: [
      "Eleva el dorso de la lengua cerca del paladar duro, exactamente como si fueras a decir una 'i'",
      "No hagas ningún contacto ni fricción: debe ser ultra suave",
      "Deslízate de inmediato y con fluidez hacia la vocal que le sigue",
    ],
    minimalPairs: [
      { wordA: "yet", wordB: "jet", phonemeA: "/j/", phonemeB: "/dʒ/" },
      { wordA: "yam", wordB: "jam", phonemeA: "/j/", phonemeB: "/dʒ/" },
      { wordA: "year", wordB: "ear", phonemeA: "/j/", phonemeB: "∅" },
    ],
    spanishTip: "Es como el inicio de una 'i' española muy rápida y suave (yes suena 'i-es', yellow suena 'i-élou'). El error más común de los hispanohablantes es endurecerla con fuerza diciendo 'dyes' o 'jes'. Manténla siempre como una 'i' deslizante sin ningún golpe: yes, you, young.",
  },
  "/w/": {
    difficulty: "easy",
    articulation: [
      "Shape lips into a tight, pursed circle like whistling or saying 'oo'",
      "Raise the back of the tongue toward the soft palate",
      "Release lips swiftly, gliding with voiced resonance into the next vowel",
    ],
    articulationEs: [
      "Forma un círculo pequeño y apretado con los labios, proyectándolos como para silbar o decir 'u'",
      "Sube la parte trasera de la lengua hacia el velo del paladar",
      "Suelta los labios rápidamente deslizándote con fuerza sonora hacia la vocal siguiente",
    ],
    minimalPairs: [
      { wordA: "wet", wordB: "yet", phonemeA: "/w/", phonemeB: "/j/" },
      { wordA: "wine", wordB: "vine", phonemeA: "/w/", phonemeB: "/v/" },
      { wordA: "west", wordB: "vest", phonemeA: "/w/", phonemeB: "/v/" },
    ],
    spanishTip: "Empieza exactamente como una 'u' española antes de otra vocal (como en hueso, agua, bueno). Cuidado con dos errores: 1) No le pongas una 'g' antes (no digas 'guater', sino water con 'u' limpia). 2) No toques los dientes con el labio: para /w/ los labios forman un círculo, para /v/ los dientes muerden el labio.",
  },
  "/eɪ/": {
    difficulty: "medium",
    articulation: [
      "Start with mouth mid-open, producing a clear, tense 'eh' sound",
      "Glide upward smoothly by closing the jaw slightly toward /ɪ/",
      "Spend 70% of duration on the starting 'eh' and finish with a light 'ee' glide",
    ],
    articulationEs: [
      "Empieza con la boca entreabierta pronunciando una 'e' clara y tensa",
      "Cierra suavemente la mandíbula mientras deslizas la lengua hacia arriba hacia una 'i'",
      "Dedica el 70% del tiempo a la 'e' y termina con un toque rápido de 'i'",
    ],
    minimalPairs: [
      { wordA: "day", wordB: "die", phonemeA: "/eɪ/", phonemeB: "/aɪ/" },
      { wordA: "late", wordB: "light", phonemeA: "/eɪ/", phonemeB: "/aɪ/" },
      { wordA: "pain", wordB: "pine", phonemeA: "/eɪ/", phonemeB: "/aɪ/" },
    ],
    spanishTip: "Es como el diptongo 'ei' en rey o peine. En inglés muchas letras 'A' suenan así (day, name, make, late). No digas una 'e' corta y plana: deja que el sonido viaje de 'e' a 'i' en un solo movimiento suave y conectado.",
  },
  "/aɪ/": {
    difficulty: "medium",
    articulation: [
      "Open mouth wide into an open, relaxed 'ah' position",
      "Gradually close the jaw, gliding the tongue forward and up toward /ɪ/",
      "Keep the first vowel open and resonant, finishing with a quick, soft glide",
    ],
    articulationEs: [
      "Abre la boca ampliamente en una 'a' abierta y relajada",
      "Cierra la mandíbula progresivamente deslizando la lengua hacia una 'i' suave",
      "Haz que el primer sonido sea largo y sonoro, y el cierre hacia la 'i' sea ligero",
    ],
    minimalPairs: [
      { wordA: "time", wordB: "tame", phonemeA: "/aɪ/", phonemeB: "/eɪ/" },
      { wordA: "light", wordB: "late", phonemeA: "/aɪ/", phonemeB: "/eɪ/" },
      { wordA: "price", wordB: "place", phonemeA: "/aɪ/", phonemeB: "/eɪ/" },
    ],
    spanishTip: "Idéntico al diptongo 'ai' en aire o baile. Es el sonido de la palabra I (yo), y de palabras como my, time, like, night y fly. Comienza con la boca bien abierta y ciérrala con naturalidad hacia una 'i'.",
  },
  "/ɔɪ/": {
    difficulty: "medium",
    articulation: [
      "Start with open, rounded lips forming the deep /ɔ/ vowel",
      "Unround and spread lips as the tongue glides forward and upward to /ɪ/",
      "Connect the two vowel stages in a single seamless fluid motion",
    ],
    articulationEs: [
      "Comienza redondeando los labios en una 'o' abierta y profunda",
      "Estira los labios hacia los lados y sube la lengua deslizándote hacia una 'i'",
      "Conecta ambos sonidos en un único viaje vocal fluido sin pausas",
    ],
    minimalPairs: [
      { wordA: "boy", wordB: "bay", phonemeA: "/ɔɪ/", phonemeB: "/eɪ/" },
      { wordA: "coin", wordB: "cone", phonemeA: "/ɔɪ/", phonemeB: "/oʊ/" },
      { wordA: "oil", wordB: "ale", phonemeA: "/ɔɪ/", phonemeB: "/eɪ/" },
    ],
    spanishTip: "Muy parecido al diptongo 'oi' en hoy o heroico. Redondea bien la boca para la 'o' inicial y luego estírala en una sonrisa para la 'i'. Es el sonido de boy, toy, voice, oil y coin.",
  },
  "/oʊ/": {
    difficulty: "medium",
    articulation: [
      "Start with relaxed, mid-rounded lips on an 'oh' sound",
      "Close lips progressively into a smaller, tighter circle toward /ʊ/",
      "Never hold a static flat 'oh' — always finish with the subtle 'oo' glide",
    ],
    articulationEs: [
      "Empieza con los labios en una 'o' relajada",
      "Cierra progresivamente los labios hacia un círculo pequeño de 'u' ('o-u')",
      "Mantén el movimiento continuo: nunca dejes la 'o' estática o cortante",
    ],
    minimalPairs: [
      { wordA: "low", wordB: "law", phonemeA: "/oʊ/", phonemeB: "/ɔ/" },
      { wordA: "coat", wordB: "caught", phonemeA: "/oʊ/", phonemeB: "/ɔ/" },
      { wordA: "no", wordB: "now", phonemeA: "/oʊ/", phonemeB: "/aʊ/" },
    ],
    spanishTip: "¡El secreto para no sonar plano en inglés! En español la 'o' es estática y corta (no, yo). En inglés americano, la 'o' SIEMPRE viaja hacia una 'u': no suena 'nou', go suena 'gou', home suena 'joum'. Si terminas cerrando los labios hacia la 'u', tu acento mejorará al instante.",
  },
  "/aʊ/": {
    difficulty: "medium",
    articulation: [
      "Open mouth wide into an expansive, front-open 'ah'",
      "Glide back smoothly while rounding and pursing lips into /ʊ/",
      "Emphasize the wide-open start transitioning into the small, round finish",
    ],
    articulationEs: [
      "Abre la boca en grande para una 'a' abierta y luminosa",
      "Redondea los labios rápidamente proyectándolos hacia adelante en una 'u'",
      "Siente el contraste claro: empieza muy abierto y termina en un círculo apretado",
    ],
    minimalPairs: [
      { wordA: "now", wordB: "no", phonemeA: "/aʊ/", phonemeB: "/oʊ/" },
      { wordA: "down", wordB: "done", phonemeA: "/aʊ/", phonemeB: "/ʌ/" },
      { wordA: "out", wordB: "oat", phonemeA: "/aʊ/", phonemeB: "/oʊ/" },
    ],
    spanishTip: "Como el diptongo 'au' en auto o aplauso. Empieza con la boca bien abierta y ciérrala de inmediato en una 'u' redonda con los labios hacia afuera. Es el sonido característico de now, how, house, out y down.",
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
