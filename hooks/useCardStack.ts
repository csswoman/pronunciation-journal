"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ToolCall, ExerciseResult } from "@/lib/ai-practice/types";
import { fetchExerciseCard, cycleExercisePrompt } from "@/lib/ai-practice/fetch-card";
import { applyExerciseResult, type UserLearningState } from "@/lib/ai-practice/learning-state";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import { logEvent } from "@/lib/ai-practice/events";
import { useAuth } from "@/components/auth/AuthProvider";

export interface ExerciseCard {
  id: string;
  toolCall: ToolCall;
}

const BUFFER_SIZE = 3;
const ADVANCE_DELAY_MS = 1500;

export function useCardStack() {
  const { user } = useAuth();
  const [cards, setCards] = useState<ExerciseCard[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [learningState, setLearningState] = useState<UserLearningState | null>(null);

  const promptIndexRef = useRef(BUFFER_SIZE);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (user?.id) getUserLearningState(user.id).then(setLearningState).catch(() => {});
  }, [user?.id]);

  // Fill initial buffer with 3 parallel fetches
  useEffect(() => {
    const prompts = Array.from({ length: BUFFER_SIZE }, (_, i) => cycleExercisePrompt(i));
    Promise.all(prompts.map(p => fetchExerciseCard(p)))
      .then(results => {
        const valid = results.filter((tc): tc is ToolCall => tc !== null);
        setCards(valid.map(tc => ({ id: tc.id, toolCall: tc })));
      })
      .finally(() => setInitializing(false));
  }, []);

  const fetchAndAppend = useCallback(() => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const prompt = cycleExercisePrompt(promptIndexRef.current++);
    fetchExerciseCard(prompt)
      .then(tc => {
        if (tc) setCards(prev => [...prev, { id: tc.id, toolCall: tc }]);
      })
      .finally(() => { fetchingRef.current = false; });
  }, []);

  const advance = useCallback(() => {
    setCards(prev => prev.slice(1));
    setExiting(false);
  }, []);

  const advanceNow = useCallback(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    advance();
  }, [advance]);

  const onCardAnswer = useCallback((callId: string, result: ExerciseResult) => {
    // Mark active card as answered so widgets disable their inputs
    setCards(prev => prev.map((c, i) =>
      i === 0 && c.toolCall.id === callId
        ? { ...c, toolCall: { ...c.toolCall, status: "answered" as const, result } }
        : c
    ));

    if (learningState) setLearningState(applyExerciseResult(learningState, result));

    logEvent("exercise_answered", {
      exerciseType: cards[0]?.toolCall.name ?? "unknown",
      topic: result.topic,
      correct: result.correct,
      latencyMs: 0,
    }).catch(() => {});

    if (!result.correct) return;

    logEvent("exercise_correct", { exerciseType: cards[0]?.toolCall.name ?? "unknown", topic: result.topic }).catch(() => {});
    fetchAndAppend(); // start pre-fetching immediately when card becomes active
    setExiting(true);
    exitTimerRef.current = setTimeout(advance, ADVANCE_DELAY_MS);
  }, [learningState, fetchAndAppend, advance]);

  return { cards, initializing, exiting, onCardAnswer, advanceNow };
}
