export type ProgressiveHint = {
  level1: string;
  level2: string;
  level3?: string;
};

export type ExerciseDesign = {
  id: string;
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
  userAnswer: string;
  expectedAnswer: string;
  feedback: {
    immediate: string;
    explanation: string;
    tip?: string;
    example?: string;
  };
  score?: number;
  gradedBy: "client" | "model";
};
