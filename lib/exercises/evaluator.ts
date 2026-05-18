/**
 * Exercise Evaluation Engine
 *
 * Implements deterministic, pedagogically-informed evaluation logic.
 * Uses pattern matching and predefined common errors.
 * Does NOT use AI for grading (only for explanations).
 */

import type { ExerciseDesign, EvaluationResult, AnswerCategory } from "./design";

/**
 * Normalize answer for comparison:
 * - Trim whitespace
 * - Lowercase
 * - Remove punctuation
 * - Collapse multiple spaces
 */
export function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Main evaluation function
 *
 * Process:
 * 1. Exact match against correctAnswer
 * 2. Check acceptable variants
 * 3. Check common wrong answers (with pedagogical feedback)
 * 4. Generic wrong answer feedback
 */
export function evaluateExercise(
  userAnswer: string,
  design: ExerciseDesign
): EvaluationResult {
  const normalized = normalizeAnswer(userAnswer);
  const expectedNormalized = normalizeAnswer(design.correctAnswer);

  // Empty answer
  if (!normalized) {
    return {
      correct: false,
      category: "invalid",
      userAnswer,
      expectedAnswer: design.correctAnswer,
      feedback: {
        immediate: "Please enter an answer.",
        explanation: "Write something in the blank to continue.",
      },
      gradedBy: "client",
      score: 0,
    };
  }

  // 1. Exact match
  if (normalized === expectedNormalized) {
    return correctResult(userAnswer, design, "Exact match");
  }

  // 2. Check acceptable variants
  if (design.acceptableAlternatives) {
    const match = design.acceptableAlternatives.find(
      alt => normalizeAnswer(alt.value) === normalized
    );
    if (match) {
      return correctResult(userAnswer, design, match.reason);
    }
  }

  // 3. Check common wrong answers (critical for pedagogy)
  if (design.commonWrongAnswers) {
    const match = design.commonWrongAnswers.find(
      cwa => normalizeAnswer(cwa.value) === normalized
    );
    if (match) {
      return wrongResult(userAnswer, design, match.feedback, "valid_but_wrong");
    }
  }

  // 4. Generic wrong answer
  return genericWrongResult(userAnswer, design);
}

/**
 * Generate feedback for correct answers
 */
function correctResult(
  userAnswer: string,
  design: ExerciseDesign,
  matchReason: string
): EvaluationResult {
  return {
    correct: true,
    category: "correct",
    userAnswer,
    expectedAnswer: design.correctAnswer,
    feedback: {
      immediate: "✓ Correct!",
      explanation: matchReason === "Exact match"
        ? `Well done! "${userAnswer}" is correct.`
        : `Perfect! "${userAnswer}" ${matchReason}`,
      tip: `Learning goal: ${design.learningGoal}`,
    },
    score: 100,
    gradedBy: "client",
  };
}

/**
 * Generate feedback for wrong answers with specific feedback
 */
function wrongResult(
  userAnswer: string,
  design: ExerciseDesign,
  specificFeedback: string,
  category: AnswerCategory
): EvaluationResult {
  return {
    correct: false,
    category,
    userAnswer,
    expectedAnswer: design.correctAnswer,
    feedback: {
      immediate: "Not quite.",
      explanation: specificFeedback,
      example: `The correct answer is: "${design.correctAnswer}"`,
      tip: design.hint?.level2 || `Instruction: ${design.instruction}`,
    },
    score: 0,
    gradedBy: "client",
  };
}

/**
 * Generate feedback for generic wrong answers
 */
function genericWrongResult(
  userAnswer: string,
  design: ExerciseDesign
): EvaluationResult {
  const levelOfWrongness = analyzeWrongness(userAnswer, design);

  return {
    correct: false,
    category: levelOfWrongness === "form_error" ? "incorrect_form" : "invalid",
    userAnswer,
    expectedAnswer: design.correctAnswer,
    feedback: {
      immediate: "Not quite.",
      explanation:
        levelOfWrongness === "form_error"
          ? `That doesn't look right. The answer should be: "${design.correctAnswer}"`
          : `That's not the word we're looking for. Try: "${design.correctAnswer}"`,
      tip: design.hint?.level1 || "Try again.",
      example: design.sentence
        ? `Example: "${design.sentence.replace("___", `"${design.correctAnswer}"`)}"`
        : undefined,
    },
    score: 0,
    gradedBy: "client",
  };
}

/**
 * Analyze type of error for better feedback
 */
function analyzeWrongness(userAnswer: string, design: ExerciseDesign): string {
  const normalized = normalizeAnswer(userAnswer);

  // Check if it looks like a form error (inflection attempt)
  if (
    design.type === "fill_blank" &&
    hasCommonFormErrors(normalized, design.correctAnswer)
  ) {
    return "form_error";
  }

  return "unknown_error";
}

/**
 * Detect common morphological errors (e.g., "readed" for "read")
 */
function hasCommonFormErrors(userAnswer: string, correctAnswer: string): boolean {
  const correct = normalizeAnswer(correctAnswer);

  // Incorrect -ed ending (regular verb marked wrong)
  if (userAnswer === correct + "ed") return true;

  // Incorrect -ing ending
  if (userAnswer === correct + "ing") return true;

  // Incorrect -s ending (3rd person)
  if (userAnswer === correct + "s") return true;

  // Doubled consonant (e.g., "redd" for "red")
  if (userAnswer.length === correct.length + 1) {
    for (let i = 0; i < correct.length; i++) {
      if (
        correct[i] === correct[i + 1] &&
        userAnswer[i] !== userAnswer[i + 1]
      ) {
        return true;
      }
    }
  }

  return false;
}
