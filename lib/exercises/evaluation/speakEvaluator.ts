import { scorePronunciation } from "@/lib/pronunciation/scoring";
import { homophoneCaveat } from "@/lib/pronunciation/homophone-guard";
import {
  transcriptAbstentionReason,
  type TranscriptAbstentionReason,
  type TranscriptSource,
} from "@/lib/speech/transcript-quality";
import { cefrToNumber } from "@/lib/exercises/cefr";
import { findArticulationGuide } from "@/lib/sounds/articulation-guides";
import type { EvaluationResult } from "@/lib/exercises/design";
import type { EvaluationInput } from "./types";
import type { CEFRLevel } from "@/lib/exercises/cefr";
import type { WordResult } from "@/lib/types";

const DEFAULT_THRESHOLD = 70;

function thresholdForLevel(userLevel?: CEFRLevel): number {
  if (!userLevel) return DEFAULT_THRESHOLD;
  // A1=55, A2=60, B1=70, B2=78, C1=85, C2=90
  const thresholds = [55, 60, 70, 78, 85, 90];
  return thresholds[cefrToNumber(userLevel) - 1] ?? DEFAULT_THRESHOLD;
}

/**
 * Extract the first missed phoneme from word-level results to give a specific tip.
 * Returns IPA if available, otherwise the ARPAbet symbol.
 */
function firstMissedPhoneme(wordResults?: WordResult[]): string | null {
  if (!wordResults) return null;
  for (const wr of wordResults) {
    if (!wr.phonemes?.alignment) continue;
    for (const p of wr.phonemes.alignment) {
      if (p.status !== "correct") {
        return p.ipa ?? p.phoneme;
      }
    }
  }
  return null;
}

function feedbackForScore(
  score: number,
  threshold: number,
  transcript: string,
  expected: string,
  userLevel?: CEFRLevel,
  wordResults?: WordResult[]
): EvaluationResult["feedback"] {
  const isEarlyLearner = !userLevel || cefrToNumber(userLevel) <= 2;
  const passed = score >= threshold;
  const missedPhoneme = firstMissedPhoneme(wordResults);
  const guide = missedPhoneme ? findArticulationGuide(missedPhoneme) : null;

  if (passed) {
    return {
      immediate: score >= 90 ? "¡Excelente!" : "¡Bien!",
      explanation: isEarlyLearner
        ? `Dijiste: "${transcript}". ¡Es correcto!`
        : `Precisión: ${Math.round(score)} %. "${transcript}" coincide bien con el objetivo.`,
      tip: score >= 90
        ? undefined
        : missedPhoneme
          ? guide
            ? `Casi perfecto: cuida el sonido ${guide.phoneme} en "${expected}". ${guide.biomechanicsTip}`
            : `Casi perfecto: cuida el sonido /${missedPhoneme}/ en "${expected}".`
          : isEarlyLearner
            ? `Sigue practicando: "${expected}".`
            : `Bien. Intenta pronunciar "${expected}" con aún más claridad.`,
    };
  }

  const phonemeTip = guide
    ? `${guide.biomechanicsTip} (Ojo: ${guide.spanishTrap})`
    : missedPhoneme
      ? `Concéntrate en el sonido /${missedPhoneme}/: escucha el modelo e inténtalo de nuevo.`
      : isEarlyLearner
        ? "Escucha la palabra y repítela despacio."
        : "Separa la palabra en sílabas y vuelve a grabarte.";

  return {
    immediate: isEarlyLearner ? "¡Casi!" : "Todavía no.",
    explanation: isEarlyLearner
      ? `Dijiste: "${transcript}". Inténtalo de nuevo; el objetivo es "${expected}".`
      : `Precisión: ${Math.round(score)} %. Objetivo: "${expected}". Intenta reproducir cada sílaba.`,
    tip: phonemeTip,
  };
}

const ABSTENTION_COPY: Record<TranscriptAbstentionReason, { immediate: string; explanation: string; tip: string }> = {
  empty_transcript: {
    immediate: "No te escuchamos",
    explanation: "No llegó audio con voz. Revisa que el micrófono esté activo y vuelve a intentarlo.",
    tip: "Acerca el micrófono y habla en un tono normal.",
  },
  low_confidence: {
    immediate: "No quedó claro",
    explanation:
      "El audio se oyó demasiado confuso para evaluarlo con honestidad, así que este intento no cuenta ni a favor ni en contra.",
    tip: "Graba en un lugar más silencioso y pronuncia la frase completa.",
  },
};

/**
 * Resultado de abstención: ni aprobado ni suspendido.
 *
 * `correct: false` sólo porque el tipo lo exige; los consumidores deben mirar
 * `scorable` antes de contar el intento. Sin `score`, para que nadie lo lea
 * como un 0 %.
 */
function abstainedResult(
  transcript: string,
  expected: string,
  source: TranscriptSource,
  reason: TranscriptAbstentionReason
): EvaluationResult {
  return {
    correct: false,
    category: "invalid",
    errorCode: "unknown",
    userAnswer: transcript,
    expectedAnswer: expected,
    feedback: ABSTENTION_COPY[reason],
    gradedBy: "client",
    scorable: false,
    abstentionReason: reason,
    transcriptSource: source,
  };
}

export async function evaluateSpeak(input: EvaluationInput): Promise<EvaluationResult> {
  if (input.actual.kind !== "speech") {
    throw new Error("speakEvaluator: expected speech answer");
  }

  const { transcript, confidence, source = "web-speech" } = input.actual;

  // Compuerta de honestidad: sin evidencia suficiente no se inventa una nota.
  const abstention = transcriptAbstentionReason({ transcript, confidence, source });
  if (abstention) {
    return abstainedResult(transcript, input.expected, source, abstention);
  }

  const threshold = input.threshold ?? thresholdForLevel(input.userLevel);
  // Minimal pair and phoneme exercises require exact word matching — "bit" and "beat"
  // differ by 1 edit but must NOT be treated as equivalent, since distinguishing them
  // is the entire learning objective.
  const strictWordMatch =
    input.exercise.variant === "minimal_pair" || input.exercise.variant === "phoneme";
  const scoring = await scorePronunciation(transcript, input.expected, threshold, strictWordMatch);

  const passed = scoring.accuracy >= threshold;
  const missedPhoneme = firstMissedPhoneme(scoring.wordResults);

  // Homófono: el acierto vino de la ortografía del reconocedor, no de una
  // distinción que el audio pruebe. En pares mínimos no puede ocurrir, porque
  // esas palabras no suenan igual.
  const caveat = strictWordMatch
    ? null
    : await homophoneCaveat(input.expected, transcript);

  return {
    correct: passed,
    category: passed ? "correct" : "incorrect_form",
    errorCode: passed ? "correct" : "form_error",
    userAnswer: transcript,
    expectedAnswer: input.expected,
    feedback: feedbackForScore(
      scoring.accuracy,
      threshold,
      transcript,
      input.expected,
      input.userLevel,
      scoring.wordResults
    ),
    score: Math.round(scoring.accuracy),
    ...(caveat ? { scoreCaveat: caveat } : {}),
    suggestedPerceptionTarget: !passed && missedPhoneme ? missedPhoneme : undefined,
    gradedBy: "client",
    scorable: true,
    transcriptSource: source,
    ...(scoring.wordResults ? { wordResults: scoring.wordResults } : {}),
  };
}
