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
    lessonId: string
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
      lessonId: string
    ): Promise<ScoringResult> => {
      setIsProcessing(true);

      try {
        // Score the pronunciation
        const scoringResult = scorePronunciation(transcript, target);
        setResult(scoringResult);

        // Calculate XP and feedback
        const xp = calculateXP(scoringResult.accuracy);
        setXpEarned(xp);
        setFeedback(getFeedbackMessage(scoringResult.accuracy));

        // Save attempt to IndexedDB
        await saveAttempt({
          word: target.toLowerCase(),
          lessonId,
          transcript: scoringResult.transcript,
          accuracy: scoringResult.accuracy,
          isCorrect: scoringResult.isCorrect,
          timestamp: new Date().toISOString(),
        });

        // Update daily progress
        await updateDailyProgress(scoringResult.accuracy, target.toLowerCase(), xp);

        // Update user stats
        await updateUserStats(scoringResult.accuracy, xp);

        // Update SRS data
        const wordId = `${lessonId}:${target.toLowerCase()}`;
        let srsData = await getSRSData(wordId);
        if (!srsData) {
          srsData = createSRSEntry(wordId, target.toLowerCase());
        }
        const quality = accuracyToQuality(scoringResult.accuracy);
        const updatedSRS = updateSRS(srsData, quality);
        await saveSRSData(updatedSRS);

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
