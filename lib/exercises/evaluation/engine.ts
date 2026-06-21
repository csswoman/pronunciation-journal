import { evaluateExercise } from "../evaluator";
import { evaluateSpeak } from "./speakEvaluator";
import type { EvaluationEngine, EvaluationInput } from "./types";
import type { EvaluationResult } from "../design";

export const defaultEvaluationEngine: EvaluationEngine = {
  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const { exercise, expected, actual, userLevel } = input;

    // Modo speak -> speakEvaluator
    if (exercise.mode === "speak") {
      return evaluateSpeak(input);
    }

    // Modo word_card -> siempre correcto (flashcard pasiva)
    if (exercise.mode === "word_card") {
      return {
        correct: true,
        category: "correct",
        errorCode: "correct",
        userAnswer: typeof actual === "object" && "value" in actual ? actual.value : "",
        expectedAnswer: expected,
        feedback: { immediate: "Noted.", explanation: "Flashcard acknowledged." },
        score: 100,
        gradedBy: "client",
      };
    }

    // Modos text-based: fill_blank, multiple_choice, dictation, reorder, match_pairs
    // Requieren ExerciseDesign para evaluacion pedagogica completa
    if (!input.design) {
      throw new Error(
        `engine: mode "${exercise.mode}" requires EvaluationInput.design. ` +
        `Pass the ExerciseDesign of the exercise being evaluated.`
      );
    }

    const answerValue =
      actual.kind === "selection"
        ? (Array.isArray(actual.chosen) ? actual.chosen.join(", ") : actual.chosen)
        : actual.kind === "text"
        ? actual.value
        : "";

    return evaluateExercise(answerValue, input.design, userLevel);
  }
};
