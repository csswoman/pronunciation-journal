import type { GrammarStudyDeckData } from "./types";

/** Demo deck mirroring english-journal-grammar-cards.html — replace with CMS/DB later. */
export const MOCK_GRAMMAR_DECK: GrammarStudyDeckData = {
  meta: {
    eyebrow: "Mazo de estudio · sin voltear",
    title: "Gramática",
    titleEmphasis: "esencial",
  },
  cards: [
    {
      id: "to-be",
      index: 1,
      tag: "Verbo básico",
      title: "El verbo to be (presente)",
      titleItalic: ["to be"],
      lede: "En inglés un solo verbo cubre ser y estar. Cambia de forma según el sujeto.",
      blocks: [
        {
          type: "conjugation",
          rows: [
            { pronoun: "I", form: "am", hint: "I'm" },
            { pronoun: "You", form: "are", hint: "you're" },
            { pronoun: "He / She / It", form: "is", hint: "he's · she's · it's" },
            { pronoun: "We", form: "are", hint: "we're" },
            { pronoun: "They", form: "are", hint: "they're" },
          ],
        },
      ],
      tip: {
        label: "Negativo y pregunta:",
        body: "niega añadiendo not (I'm not, she isn't, they aren't). Pregunta invirtiendo: Is she…? Are you…?",
      },
    },
    {
      id: "irregular-verbs",
      index: 2,
      tag: "Verbos",
      title: "Verbos irregulares (los más usados)",
      lede: "Su pasado no termina en -ed; hay que memorizarlos. Estas tres columnas son las que necesitas.",
      blocks: [
        {
          type: "verb-table",
          headers: ["Base", "Pasado", "Participio", "Español"],
          rows: [
            ["be", "was / were", "been", "ser / estar"],
            ["have", "had", "had", "tener"],
            ["go", "went", "gone", "ir"],
            ["do", "did", "done", "hacer"],
            ["make", "made", "made", "hacer/crear"],
            ["take", "took", "taken", "tomar"],
            ["see", "saw", "seen", "ver"],
            ["get", "got", "gotten", "obtener"],
            ["know", "knew", "known", "saber/conocer"],
            ["say", "said", "said", "decir"],
          ],
        },
      ],
      tip: {
        label: "Truco:",
        body: "agrúpalos por patrón. make/take riman; know/grow/throw hacen -ew → -own.",
      },
    },
    {
      id: "present-simple-s",
      index: 3,
      tag: "Tiempos",
      title: "Presente simple: la -s de la 3ª persona",
      titleItalic: ["-s"],
      lede: "Acciones habituales o hechos. El único cambio importante: he/she/it añade -s.",
      blocks: [
        {
          type: "conjugation",
          rows: [
            { pronoun: "I / You / We / They", form: "work" },
            { pronoun: "He / She / It", form: "works", hint: "+ s" },
          ],
        },
        {
          type: "pairs",
          lines: [
            { variant: "bad", text: "She work here." },
            { variant: "good", text: "She works here.", note: "Ella trabaja aquí" },
            { variant: "bad", text: "Does she works?" },
            { variant: "good", text: "Does she work?", note: 'la -s ya está en "does"' },
          ],
        },
      ],
      tip: {
        label: "Pregunta y negativo:",
        body: "usa do / does + verbo base. Do you…? · He doesn't…",
      },
    },
    {
      id: "articles",
      index: 4,
      tag: "Artículos",
      title: "Artículos: a · an · the",
      titleItalic: ["a · an · the"],
      lede: "Depende del sonido, no de la letra. Esto confunde mucho al principio.",
      blocks: [
        {
          type: "contrast",
          columns: [
            {
              label: "a",
              rule: "+ sonido consonante",
              examples: ["a book", "a university (yu-)"],
            },
            {
              label: "an",
              rule: "+ sonido vocal",
              examples: ["an apple", "an hour (h muda)"],
            },
          ],
        },
        {
          type: "rules",
          rows: [
            {
              key: "the",
              value: "el / la / los / las — algo específico o ya conocido",
              highlights: ["el / la / los / las"],
            },
          ],
        },
      ],
      tip: {
        label: "Clave:",
        body: '"university" lleva a porque suena "yuniversity"; "hour" lleva an porque la h no se pronuncia.',
      },
    },
    {
      id: "there-is",
      index: 5,
      tag: "Estructura",
      title: "There is / There are = “hay”",
      titleItalic: ["There is", "There are"],
      lede: "Para decir que algo existe. Cambia según singular o plural.",
      blocks: [
        {
          type: "rules",
          rows: [
            {
              key: "There is",
              value: "+ singular · There is a problem",
              highlights: ["There is a problem"],
              hint: "hay un problema",
            },
            {
              key: "There are",
              value: "+ plural · There are two cats",
              highlights: ["There are two cats"],
              hint: "hay dos gatos",
            },
          ],
        },
      ],
      tip: {
        label: "Contracción:",
        body: "There's (singular) es muy común al hablar. El plural no se contrae: there are.",
      },
    },
    {
      id: "l1-traps",
      index: 6,
      tag: "Errores comunes",
      title: "Trampas para hispanohablantes",
      lede: "Calcos del español que suenan mal en inglés. Memoriza la versión correcta.",
      blocks: [
        {
          type: "pairs",
          lines: [
            { variant: "bad", text: "I have 25 years." },
            {
              variant: "good",
              text: "I am 25 years old.",
              note: 'la edad va con "to be", no "have"',
            },
            { variant: "bad", text: "I am agree." },
            { variant: "good", text: "I agree.", note: '"agree" ya es verbo, sin "am"' },
          ],
        },
        {
          type: "rules",
          rows: [
            {
              key: "actually",
              value: "= en realidad (no “actualmente” → eso es currently)",
              highlights: ["en realidad"],
            },
            {
              key: "embarrassed",
              value: "= avergonzado (no “embarazada” → eso es pregnant)",
              highlights: ["avergonzado"],
            },
          ],
        },
      ],
      tip: {
        label: "Falsos amigos:",
        body: "son palabras que se parecen pero significan otra cosa. Marca las que ya conoces para no caer.",
      },
    },
  ],
};
