import type { TargetPitchPoint } from "./pitch-detector";

export interface IntonationSentence {
  id: string;
  text: string;
  pattern: "rising" | "falling" | "fall-rise" | "rise-fall";
  patternNameEs: string;
  category: "questions" | "statements" | "nuance" | "connected";
  descriptionEs: string;
  targetCurve: TargetPitchPoint[];
}

export const INTONATION_PATTERNS: IntonationSentence[] = [
  // --- Rising (↗) ---
  {
    id: "rising-ready",
    text: "Are you ready?",
    pattern: "rising",
    patternNameEs: "Ascendente ↗ (Pregunta Sí/No)",
    category: "questions",
    descriptionEs: "En preguntas de Sí/No en inglés, el tono sube con claridad en la última palabra.",
    targetCurve: [
      { timePct: 0.1, semitones: -0.5, label: "Are" },
      { timePct: 0.4, semitones: 0.0, label: "you" },
      { timePct: 0.7, semitones: 1.5, label: "rea-" },
      { timePct: 0.95, semitones: 4.5, label: "dy? ↗", isNuclearStress: true },
    ],
  },
  {
    id: "rising-coffee",
    text: "Do you want some coffee?",
    pattern: "rising",
    patternNameEs: "Ascendente ↗ (Ofrecimiento / Pregunta)",
    category: "questions",
    descriptionEs: "La voz se mantiene moderada al inicio y salta hacia arriba en 'coffee'.",
    targetCurve: [
      { timePct: 0.1, semitones: -0.5, label: "Do" },
      { timePct: 0.3, semitones: -0.2, label: "you" },
      { timePct: 0.5, semitones: 0.5, label: "want" },
      { timePct: 0.7, semitones: 0.8, label: "some" },
      { timePct: 0.95, semitones: 4.0, label: "coffee? ↗", isNuclearStress: true },
    ],
  },
  {
    id: "rising-sure",
    text: "Is that really true?",
    pattern: "rising",
    patternNameEs: "Ascendente ↗ (Comprobación / Sorpresa)",
    category: "questions",
    descriptionEs: "Sube el tono al final para expresar sorpresa o verificar un hecho.",
    targetCurve: [
      { timePct: 0.15, semitones: -0.5, label: "Is" },
      { timePct: 0.4, semitones: 0.2, label: "that" },
      { timePct: 0.65, semitones: 1.0, label: "really" },
      { timePct: 0.95, semitones: 5.0, label: "true? ↗", isNuclearStress: true },
    ],
  },

  // --- Falling (↘) ---
  {
    id: "falling-statement-name",
    text: "My name is David.",
    pattern: "falling",
    patternNameEs: "Descendente ↘ (Afirmación)",
    category: "statements",
    descriptionEs: "En declaraciones afirmativas, la voz cae con firmeza al final para transmitir seguridad.",
    targetCurve: [
      { timePct: 0.15, semitones: 0.5, label: "My" },
      { timePct: 0.4, semitones: 2.2, label: "name", isNuclearStress: true },
      { timePct: 0.65, semitones: 0.0, label: "is" },
      { timePct: 0.95, semitones: -3.5, label: "David. ↘" },
    ],
  },
  {
    id: "falling-wh-question",
    text: "Where are you going?",
    pattern: "falling",
    patternNameEs: "Descendente ↘ (Pregunta Wh-)",
    category: "questions",
    descriptionEs: "¡Curiosidad inglesa! Las preguntas con Where, What, Why, How terminan con entonación descendente ↘.",
    targetCurve: [
      { timePct: 0.15, semitones: 3.0, label: "Where", isNuclearStress: true },
      { timePct: 0.45, semitones: 1.0, label: "are" },
      { timePct: 0.7, semitones: 0.0, label: "you" },
      { timePct: 0.95, semitones: -3.0, label: "going? ↘" },
    ],
  },
  {
    id: "falling-time",
    text: "What time is the meeting?",
    pattern: "falling",
    patternNameEs: "Descendente ↘ (Pregunta informativa)",
    category: "questions",
    descriptionEs: "Empieza alto en 'What time' y cae progresivamente al terminar.",
    targetCurve: [
      { timePct: 0.15, semitones: 2.5, label: "What" },
      { timePct: 0.35, semitones: 2.0, label: "time" },
      { timePct: 0.55, semitones: 0.5, label: "is the" },
      { timePct: 0.95, semitones: -3.5, label: "meeting? ↘", isNuclearStress: true },
    ],
  },

  // --- Fall-Rise (↘↗) ---
  {
    id: "fall-rise-think",
    text: "Well, I think so...",
    pattern: "fall-rise",
    patternNameEs: "Caída-Subida ↘↗ (Duda / Reserva)",
    category: "nuance",
    descriptionEs: "Expresa que no estás 100% seguro o que hay un matiz pendiente: el tono cae y luego sube sutilmente.",
    targetCurve: [
      { timePct: 0.15, semitones: 1.5, label: "Well," },
      { timePct: 0.45, semitones: -2.5, label: "I think" },
      { timePct: 0.95, semitones: 2.5, label: "so... ↘↗", isNuclearStress: true },
    ],
  },
  {
    id: "fall-rise-polite",
    text: "She's nice, but...",
    pattern: "fall-rise",
    patternNameEs: "Caída-Subida ↘↗ (Contraste implícito)",
    category: "nuance",
    descriptionEs: "Señala que viene un 'pero' o que hay más información no dicha.",
    targetCurve: [
      { timePct: 0.2, semitones: 1.0, label: "She's" },
      { timePct: 0.5, semitones: -3.0, label: "nice," },
      { timePct: 0.95, semitones: 2.0, label: "but... ↘↗", isNuclearStress: true },
    ],
  },

  // --- Rise-Fall (↗↘) ---
  {
    id: "rise-fall-enthusiasm",
    text: "That's incredible!",
    pattern: "rise-fall",
    patternNameEs: "Subida-Caída ↗↘ (Énfasis / Entusiasmo)",
    category: "nuance",
    descriptionEs: "Un pico alto de energía melódica en la sílaba acentuada y una caída rápida.",
    targetCurve: [
      { timePct: 0.15, semitones: -0.5, label: "That's" },
      { timePct: 0.55, semitones: 4.5, label: "in-CRE-", isNuclearStress: true },
      { timePct: 0.95, semitones: -3.5, label: "dible! ↗↘" },
    ],
  },
];
