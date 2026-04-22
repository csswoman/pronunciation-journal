"use client";

import { useCallback } from "react";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import { applyExerciseResult, type UserLearningState } from "@/lib/ai-practice/learning-state";
import { persistLearningState } from "@/lib/ai-practice/persist-state";

interface UseToolRegistryOptions {
  learningState: UserLearningState | null;
  onStateUpdate: (next: UserLearningState) => void;
}

export function useToolRegistry({ learningState, onStateUpdate }: UseToolRegistryOptions) {
  const handleResult = useCallback(
    (result: ExerciseResult) => {
      if (!learningState) return;
      const next = applyExerciseResult(learningState, result);
      onStateUpdate(next);
      persistLearningState(next).catch(console.error);
    },
    [learningState, onStateUpdate]
  );

  return { handleResult };
}
