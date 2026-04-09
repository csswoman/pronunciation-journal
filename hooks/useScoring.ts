"use client";

import { useState, useCallback } from "react";
import { scorePronunciation, calculateXP, getFeedbackMessage } from "@/lib/scoring";
import { saveAttempt, updateDailyProgress, updateUserStats } from "@/lib/db";
import { updateSRS, accuracyToQuality, createSRSEntry } from "@/lib/srs";
import { saveSRSData, getSRSData } from "@/lib/db";
import type { ScoringResult } from "@/lib/types";

interface UseScoringReturn {
  result: ScoringResult | null;
  xpEarned: number;
  feedback: { message: string; emoji: string; color: string } | null;
  isProcessing: boolean;
  scoreAndSave: (
    transcript: string,
    target: string,
    lessonId: string,
    threshold?: number
  ) => Promise<ScoringResult>;
  reset: () => void;
}

export function useScoring(): UseScoringReturn {
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [feedback, setFeedback] = useState<{
    message: string;
    emoji: string;
    color: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const scoreAndSave = useCallback(
    async (
      transcript: string,
      target: string,
      lessonId: string,
      threshold = 70
    ): Promise<ScoringResult> => {
      setIsProcessing(true);

      try {
        // Score the pronunciation
        const scoringResult = await scorePronunciation(transcript, target, threshold);
        setResult(scoringResult);

        // Calculate XP and feedback — hard mode gives bonus XP
        const xp = Math.round(calculateXP(scoringResult.accuracy) * (threshold >= 85 ? 1.5 : 1));
        setXpEarned(xp);
        setFeedback(getFeedbackMessage(scoringResult.accuracy, threshold));


        // Persist in background — DB failures must never block the feedback UI
        (async () => {
          try {
            await saveAttempt({
              word: target.toLowerCase(),
              lessonId,
              transcript: scoringResult.transcript,
              accuracy: scoringResult.accuracy,
              isCorrect: scoringResult.isCorrect,
              timestamp: new Date().toISOString(),
            });
            await updateDailyProgress(scoringResult.accuracy, target.toLowerCase(), xp);
            await updateUserStats(scoringResult.accuracy, xp);
            const wordId = `${lessonId}:${target.toLowerCase()}`;
            let srsData = await getSRSData(wordId);
            if (!srsData) srsData = createSRSEntry(wordId, target.toLowerCase());
            const quality = accuracyToQuality(scoringResult.accuracy);
            await saveSRSData(updateSRS(srsData, quality));
          } catch (err) {
            console.warn("[DB] Persistence failed (non-critical):", err);
          }
        })();

        return scoringResult;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setXpEarned(0);
    setFeedback(null);
  }, []);

  return {
    result,
    xpEarned,
    feedback,
    isProcessing,
    scoreAndSave,
    reset,
  };
}
