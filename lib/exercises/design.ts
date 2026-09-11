import type { ExerciseType } from './taxonomy';
import type { ExerciseErrorCode } from './error-taxonomy';
import type {
  TranscriptAbstentionReason,
  TranscriptSource,
} from '@/lib/speech/transcript-quality';

export type ProgressiveHint = {
  level1: string;
  level2: string;
  level3?: string;
};

export type ExerciseDesign = {
  id: string;
  /** Canonical taxonomy (domain + mode + optional variant). */
  exerciseType?: ExerciseType;
  /** Legacy flat type (kept for compatibility during migration). */
  type: "fill_blank" | "multiple_choice" | "speaking" | "word_card";

  instruction: string;
  learningGoal: string;

  sentence?: string;
  question?: string;
  prompt?: string;

  correctAnswer: string;
  constraint:
    | { type: "exact_match"; value: string }
    | { type: "acceptable_variants"; values: string[] }
    | { type: "any_correct_option"; correctIndex: number }
    | { type: "semantic_match"; expectedMeaning: string };

  acceptableAlternatives?: { value: string; reason: string }[];
  commonWrongAnswers?: { value: string; feedback: string }[];

  topic: string;
  difficulty: "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

  hint?: ProgressiveHint;
};

export type AnswerCategory = "correct" | "valid_but_wrong" | "incorrect_form" | "invalid";

export type EvaluationResult = {
  correct: boolean;
  category: AnswerCategory;
  errorCode: ExerciseErrorCode;
  userAnswer: string;
  expectedAnswer: string;
  feedback: {
    immediate: string;
    explanation: string;
    tip?: string;
    example?: string;
  };
  score?: number;
  suggestedPerceptionTarget?: string;
  gradedBy: "client" | "model";
  /**
   * False cuando la evidencia no bastó para puntuar (transcripción vacía o
   * confianza demasiado baja). Un intento no puntuable no es aprobado ni
   * suspendido: se excluye de precisión y de mastery, igual que exige el
   * contrato de `SpokenAttempt`. Ausente significa puntuable.
   */
  scorable?: boolean;
  /** Por qué se abstuvo la evaluación; sólo presente si `scorable` es false. */
  abstentionReason?: TranscriptAbstentionReason;
  /** Qué reconocedor produjo el texto evaluado, para auditar la nota. */
  transcriptSource?: TranscriptSource;
  /**
   * Salvedad sobre una nota que sí se otorgó: la evidencia era ambigua (p. ej.
   * el reconocedor escribió un homófono del objetivo). No invalida el intento,
   * lo hace auditable.
   */
  scoreCaveat?: string;
};
