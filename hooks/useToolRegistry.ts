"use client";

import { useCallback } from "react";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import { applyExerciseResult, type UserLearningState } from "@/lib/ai-practice/learning-state";

// Persists ExerciseResult → updates UserLearningState via reducer → saves to Dexie.
// Supabase sync is out of scope for Semana 2.

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
      // Dexie persistence deferred to Semana 4 sync layer
    },
    [learningState, onStateUpdate]
  );

  return { handleResult };
}
