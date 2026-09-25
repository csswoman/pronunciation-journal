export interface AudioSlideData {
  overline: string;
  chipLabel: string;
  sentence: string;
  highlightedWord: string;
  ipa: string;
  waveBarCount: number;
  toastMessage: string;
  toastDelaySeconds: number;
}

export interface MinimalPairItem {
  word: string;
  ipa: string;
  label: string;
  tag: string;
}

export interface WordSlideData {
  overline: string;
  chipLabel: string;
  pair1: MinimalPairItem;
  pair2: MinimalPairItem;
  explanation: string;
  toastMessage: string;
  toastDelaySeconds: number;
}

export interface ChunkSlideData {
  overline: string;
  promptSpanish: string;
  targetSentence: string[];
  chunkIndices: number[];
  bankPieces: string[];
  toastMessage: string;
  toastDelaySeconds: number;
}

export interface WordSearchTarget {
  word: string;
  coords: Array<{ r: number; c: number }>;
  tone: "butter" | "coral" | "mint";
  delayStart: number;
  step: number;
}

export interface WordSearchLegend {
  word: string;
  color: string;
  checkDelay: number;
}

export interface WordSearchSlideData {
  overline: string;
  chipLabel: string;
  grid: string[][];
  targetWords: WordSearchTarget[];
  legendItems: WordSearchLegend[];
}

export const AUDIO_SLIDE_DATA: AudioSlideData = {
  overline: "ESCUCHA Y REPITE",
  chipLabel: "Sonido /ə/",
  sentence: "a cup of coffee",
  highlightedWord: "of",
  ipa: "/ə kʌp əv 'kɒfi/",
  waveBarCount: 26,
  toastMessage: "¡Eso es! Dijiste /əv/, la forma débil.",
  toastDelaySeconds: 2.2,
};

export const WORD_SLIDE_DATA: WordSlideData = {
  overline: "PARES MÍNIMOS · VOCAL /ɪ/ VS /iː/",
  chipLabel: "Contraste B1",
  pair1: {
    word: "ship",
    ipa: "/ʃɪp/",
    label: "VOCAL CORTA",
    tag: "Lengua relajada",
  },
  pair2: {
    word: "sheep",
    ipa: "/ʃiːp/",
    label: "VOCAL LARGA",
    tag: "Sonrisa y tensión",
  },
  explanation: "En 'ship' la vocal es corta y relajada (/ɪ/). En 'sheep' tensas la lengua y extiendes los labios (/iː/).",
  toastMessage: "¡Excelente! Identificaste la vocal corta /ɪ/ en 'ship'.",
  toastDelaySeconds: 1.8,
};

export const CHUNK_SLIDE_DATA: ChunkSlideData = {
  overline: "CHUNK · ORDENA LA FRASE",
  promptSpanish: "Tengo muchas ganas de verte.",
  targetSentence: ["I'm", "looking", "forward", "to", "seeing", "you"],
  chunkIndices: [1, 2, 3], // looking, forward, to
  bankPieces: ["forward", "you", "I'm", "to", "seeing", "looking"],
  toastMessage: "Correcto. “looking forward to” va en bloque.",
  toastDelaySeconds: 2.8,
};

export const WORD_SEARCH_SLIDE_DATA: WordSearchSlideData = {
  overline: "JUEGO · SOPA DE LETRAS",
  chipLabel: "Encuentra 3",
  grid: [
    ["T", "P", "L", "E", "A", "R", "S"],
    ["M", "C", "H", "U", "N", "K", "O"],
    ["B", "A", "R", "I", "T", "E", "S"],
    ["L", "F", "O", "G", "Y", "N", "O"],
    ["D", "E", "P", "A", "Z", "R", "U"],
    ["W", "E", "A", "K", "I", "L", "N"],
    ["H", "V", "T", "J", "M", "Q", "D"],
  ],
  targetWords: [
    {
      word: "CHUNK",
      coords: [
        { r: 1, c: 1 },
        { r: 1, c: 2 },
        { r: 1, c: 3 },
        { r: 1, c: 4 },
        { r: 1, c: 5 },
      ],
      tone: "butter",
      delayStart: 0.5,
      step: 0.12,
    },
    {
      word: "SOUND",
      coords: [
        { r: 2, c: 6 },
        { r: 3, c: 6 },
        { r: 4, c: 6 },
        { r: 5, c: 6 },
        { r: 6, c: 6 },
      ],
      tone: "coral",
      delayStart: 1.6,
      step: 0.12,
    },
    {
      word: "WEAK",
      coords: [
        { r: 5, c: 0 },
        { r: 5, c: 1 },
        { r: 5, c: 2 },
        { r: 5, c: 3 },
      ],
      tone: "mint",
      delayStart: 2.7,
      step: 0.12,
    },
  ],
  legendItems: [
    { word: "CHUNK", color: "#f8e08e", checkDelay: 1.2 },
    { word: "SOUND", color: "#f7b7a6", checkDelay: 2.3 },
    { word: "WEAK", color: "#a8e6c9", checkDelay: 3.3 },
  ],
};
