export interface ConnectedPhrase {
  id: string;
  phrase: string;
  category: "linking-cv" | "flap-t" | "intrusion" | "weak-forms";
  categoryNameEs: string;
  connectedIpa: string;
  isolatedIpa: string;
  howItSoundsEs: string;
  explanationEs: string;
  linkedWords: [string, string]; // Words that join together
  linkSound?: string; // e.g. "k", "t->ɾ", "w", "j"
}

export const CONNECTED_SPEECH_DATA: ConnectedPhrase[] = [
  // ─── 1. Consonant to Vowel Linking (Liaison) ─────────────────────────
  {
    id: "pick-it-up",
    phrase: "Pick it up",
    category: "linking-cv",
    categoryNameEs: "Enlace Consonante + Vocal (Linking)",
    connectedIpa: "/ˈpɪ.kɪ.tʌp/",
    isolatedIpa: "/pɪk/ /ɪt/ /ʌp/",
    howItSoundsEs: "«pi-ki-tap»",
    explanationEs: "La consonante final 'k' se engancha a 'it' y la 't' se engancha a 'up'. Suena como una sola palabra fluida.",
    linkedWords: ["Pick", "it"],
    linkSound: "k",
  },
  {
    id: "check-in",
    phrase: "Check in",
    category: "linking-cv",
    categoryNameEs: "Enlace Consonante + Vocal (Linking)",
    connectedIpa: "/ˈtʃɛ.kɪn/",
    isolatedIpa: "/tʃɛk/ /ɪn/",
    howItSoundsEs: "«che-kin»",
    explanationEs: "No hagas pausa entre 'check' e 'in'. Pronúncialas juntas como si fuera 'che-kin'.",
    linkedWords: ["Check", "in"],
    linkSound: "k",
  },
  {
    id: "hold-on",
    phrase: "Hold on",
    category: "linking-cv",
    categoryNameEs: "Enlace Consonante + Vocal (Linking)",
    connectedIpa: "/ˈhoʊl.dɑːn/",
    isolatedIpa: "/hoʊld/ /ɑːn/",
    howItSoundsEs: "«hol-don»",
    explanationEs: "La 'd' final de 'hold' salta al inicio de 'on'.",
    linkedWords: ["Hold", "on"],
    linkSound: "d",
  },
  {
    id: "turn-off",
    phrase: "Turn off the light",
    category: "linking-cv",
    categoryNameEs: "Enlace Consonante + Vocal (Linking)",
    connectedIpa: "/ˈtɜːr.nɔːf ðə ˈlaɪt/",
    isolatedIpa: "/tɜːrn/ /ɔːf/ /ðə/ /laɪt/",
    howItSoundsEs: "«tur-noff the light»",
    explanationEs: "La 'n' final se une a la 'o' de 'off'.",
    linkedWords: ["Turn", "off"],
    linkSound: "n",
  },
  {
    id: "an-apple",
    phrase: "An apple a day",
    category: "linking-cv",
    categoryNameEs: "Enlace Consonante + Vocal (Linking)",
    connectedIpa: "/ə.ˈnæ.pəl ə ˈdeɪ/",
    isolatedIpa: "/æn/ /ˈæ.pəl/ /ə/ /deɪ/",
    howItSoundsEs: "«a-napple a day»",
    explanationEs: "En inglés nunca se dice 'an... apple'; siempre se liga como 'a-napple'.",
    linkedWords: ["An", "apple"],
    linkSound: "n",
  },

  // ─── 2. Flap T / Tap Americano (/ɾ/) ────────────────────────────────
  {
    id: "water",
    phrase: "A glass of water",
    category: "flap-t",
    categoryNameEs: "Flap T Americana (/ɾ/ suave)",
    connectedIpa: "/ə ˈɡlæs əv ˈwɑː.ɾɚ/",
    isolatedIpa: "/wɑː.tər/",
    howItSoundsEs: "«guá-rer»",
    explanationEs: "En inglés americano, cuando la 't' queda entre dos vocales, se convierte en un toque suave de lengua (como la 'r' suave de 'cara').",
    linkedWords: ["wa", "ter"],
    linkSound: "ɾ",
  },
  {
    id: "get-out",
    phrase: "Get out of here",
    category: "flap-t",
    categoryNameEs: "Flap T Americana (/ɾ/ suave)",
    connectedIpa: "/ˈɡɛ.ɾaʊ.təv hɪr/",
    isolatedIpa: "/ɡɛt/ /aʊt/ /ʌv/ /hɪr/",
    howItSoundsEs: "«gue-rau-tav hir»",
    explanationEs: "La 't' de 'get' se une a 'out' y se suaviza en Flap T /ɾ/.",
    linkedWords: ["Get", "out"],
    linkSound: "ɾ",
  },
  {
    id: "not-at-all",
    phrase: "Not at all",
    category: "flap-t",
    categoryNameEs: "Flap T Americana (/ɾ/ suave)",
    connectedIpa: "/ˈnɑː.ɾə.tɔːl/",
    isolatedIpa: "/nɑːt/ /æt/ /ɔːl/",
    howItSoundsEs: "«ná-ra-tol»",
    explanationEs: "Ambas 't' se enlazan con las vocales siguientes convirtiéndose en una cascada de sonido fluido.",
    linkedWords: ["Not", "at"],
    linkSound: "ɾ",
  },

  // ─── 3. Vowel to Vowel Intrusion (/w/ and /j/) ───────────────────────
  {
    id: "go-out",
    phrase: "Let's go out",
    category: "intrusion",
    categoryNameEs: "Intrusión Vocal + Vocal (/w/ o /j/)",
    connectedIpa: "/lɛts ˈɡoʊ.waʊt/",
    isolatedIpa: "/lɛts/ /ɡoʊ/ /aʊt/",
    howItSoundsEs: "«lets go-waut»",
    explanationEs: "Al pasar de la vocal redondeada /oʊ/ a /aʊ/, los labios insertan naturalmente un pequeño puente /w/ para no cortar el aire.",
    linkedWords: ["go", "out"],
    linkSound: "w",
  },
  {
    id: "see-it",
    phrase: "I can see it",
    category: "intrusion",
    categoryNameEs: "Intrusión Vocal + Vocal (/w/ o /j/)",
    connectedIpa: "/aɪ kən ˈsiː.jɪt/",
    isolatedIpa: "/aɪ/ /kæn/ /siː/ /ɪt/",
    howItSoundsEs: "«I can see-yit»",
    explanationEs: "Al pasar de la vocal estirada /iː/ a /ɪ/, la lengua inserta un suave desliz /j/ (sonido de 'y').",
    linkedWords: ["see", "it"],
    linkSound: "j",
  },
  {
    id: "i-agree",
    phrase: "I agree with you",
    category: "intrusion",
    categoryNameEs: "Intrusión Vocal + Vocal (/w/ o /j/)",
    connectedIpa: "/aɪ.jə.ˈɡriː wɪð juː/",
    isolatedIpa: "/aɪ/ /ə.ˈɡriː/",
    howItSoundsEs: "«I-yagree with you»",
    explanationEs: "El diptongo /aɪ/ conecta con el schwa mediante un puente /j/ fluido.",
    linkedWords: ["I", "agree"],
    linkSound: "j",
  },

  // ─── 4. Weak Forms & Reductions ──────────────────────────────────────
  {
    id: "fish-and-chips",
    phrase: "Fish and chips",
    category: "weak-forms",
    categoryNameEs: "Formas Débiles y Reducciones",
    connectedIpa: "/ˈfɪʃ.n̩.tʃɪps/",
    isolatedIpa: "/fɪʃ/ /ænd/ /tʃɪps/",
    howItSoundsEs: "«fish-n-chips»",
    explanationEs: "Las palabras gramaticales (and, of, to, can) pierden sus vocales completas. 'And' se reduce solo a 'n'.",
    linkedWords: ["Fish", "and"],
    linkSound: "n",
  },
  {
    id: "cup-of-tea",
    phrase: "A cup of coffee",
    category: "weak-forms",
    categoryNameEs: "Formas Débiles y Reducciones",
    connectedIpa: "/ə ˈkʌ.pə ˈkɔː.fi/",
    isolatedIpa: "/ə/ /kʌp/ /ʌv/ /ˈkɔː.fi/",
    howItSoundsEs: "«a cuppa coffee»",
    explanationEs: "La preposición 'of' se reduce a un simple schwa /ə/ y se pega a 'cup'.",
    linkedWords: ["cup", "of"],
    linkSound: "ə",
  },
];
