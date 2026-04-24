import type { ExerciseDesign, ProgressiveHint as DesignHint } from "@/lib/exercise/design";
import type { FillBlankArgs, MultipleChoiceArgs, ProgressiveHint } from "./registry";

function normalizeHint(hint: string | ProgressiveHint | undefined): DesignHint | undefined {
  if (!hint) return undefined;
  if (typeof hint === "string") return { level1: hint, level2: hint };
  return hint;
}

export function fillBlankToDesign(args: FillBlankArgs): ExerciseDesign {
  return {
    id: `fill_blank:${args.topic}`,
    type: "fill_blank",
    instruction: args.instruction ?? "Fill in the blank.",
    learningGoal: args.learningGoal ?? args.topic,
    sentence: args.sentence,
    correctAnswer: args.answer,
    constraint: { type: "exact_match", value: args.answer },
    acceptableAlternatives:
      args.acceptableAlternatives ??
      args.acceptableAnswers?.map(v => ({ value: v, reason: "Acceptable variant" })),
    commonWrongAnswers: args.commonWrongAnswers,
    topic: args.topic,
    difficulty: "a1",
    hint: normalizeHint(args.hint),
  };
}

export function multipleChoiceToDesign(args: MultipleChoiceArgs): ExerciseDesign {
  const correctAnswer = args.options[args.correctIndex];
  return {
    id: `multiple_choice:${args.topic}`,
    type: "multiple_choice",
    instruction: args.instruction ?? "Choose the correct option.",
    learningGoal: args.learningGoal ?? args.topic,
    question: args.question,
    correctAnswer,
    constraint: { type: "any_correct_option", correctIndex: args.correctIndex },
    commonWrongAnswers: args.commonWrongAnswers,
    topic: args.topic,
    difficulty: "a1",
    hint: args.hint,
  };
}
