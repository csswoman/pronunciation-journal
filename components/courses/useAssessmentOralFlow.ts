"use client";

import { useEffect, useState } from "react";
import type { AssessmentResult, ClientAssessmentQuestion } from "@/lib/courses/assessment";
import { AssessmentPayloadSchema } from "@/lib/courses/assessment-schema";
import {
  requiresCheckpointOralEvidence,
  type AssessmentOralChallenge,
} from "@/lib/courses/assessment-oral-shared";
import type { CefrLevelId } from "@/lib/courses/types";
import type { useAssessmentScoring } from "./useAssessmentScoring";

interface UseAssessmentOralFlowOptions {
  mode: "placement" | "checkpoint";
  userId?: string;
  checkpointLevel: CefrLevelId | null;
  answers: Record<string, number>;
  questions: ClientAssessmentQuestion[];
  scoring: ReturnType<typeof useAssessmentScoring>;
}

export function useAssessmentOralFlow({
  mode,
  userId,
  checkpointLevel,
  answers,
  questions,
  scoring,
}: UseAssessmentOralFlowOptions) {
  const needsOralEvidence = mode === "checkpoint"
    && checkpointLevel !== null
    && requiresCheckpointOralEvidence(checkpointLevel);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [initialChallenge, setInitialChallenge] = useState<AssessmentOralChallenge | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [pendingLookupDone, setPendingLookupDone] = useState(() => !needsOralEvidence || !userId);

  useEffect(() => {
    if (!needsOralEvidence || !userId || !checkpointLevel) return;
    let active = true;
    setPendingLookupDone(false);
    void fetch(`/api/assessment/oral/attempts?level=${checkpointLevel}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo buscar un checkpoint pendiente.");
        return response.json() as Promise<{ attemptId?: unknown }>;
      })
      .then((body) => {
        if (active && typeof body.attemptId === "string") {
          setAttemptId(body.attemptId);
          setInitialChallenge(null);
        }
      })
      .catch((error: unknown) => {
        if (active) setStartError(error instanceof Error ? error.message : "No se pudo buscar un checkpoint pendiente.");
      })
      .finally(() => {
        if (active) setPendingLookupDone(true);
      });
    return () => { active = false; };
  }, [checkpointLevel, needsOralEvidence, userId]);

  async function beginAttempt() {
    if (!userId || !checkpointLevel || !needsOralEvidence) return;
    scoring.setSaving(true);
    scoring.setEvaluationError(false);
    setStartError(null);
    try {
      const response = await fetch("/api/assessment/oral/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: checkpointLevel, answers }),
      });
      const body = await response.json().catch(() => null) as {
        attemptId?: unknown;
        challenge?: unknown;
        eligible?: unknown;
        result?: unknown;
        error?: string;
      } | null;
      if (typeof body?.attemptId === "string") {
        setAttemptId(body.attemptId);
        const challenge = body.challenge;
        if (challenge && typeof challenge === "object") {
          const candidate = challenge as AssessmentOralChallenge;
          if (
            candidate.level === checkpointLevel
            && typeof candidate.id === "string"
            && typeof candidate.prompt === "string"
          ) setInitialChallenge(candidate);
        } else {
          setInitialChallenge(null);
        }
        return;
      }
      if (!response.ok) throw new Error(body?.error ?? "No se pudo guardar este checkpoint.");
      const parsed = AssessmentPayloadSchema.safeParse(body?.result);
      if (body?.eligible === false && parsed.success) {
        scoring.displayVerifiedResult(parsed.data as AssessmentResult, questions);
        return;
      }
      throw new Error("No se recibió el intento oral esperado.");
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "No se pudo guardar este checkpoint.");
      scoring.setEvaluationError(true);
    } finally {
      scoring.setSaving(false);
    }
  }

  function completeAttempt(result: AssessmentResult) {
    scoring.displayVerifiedResult(result, questions);
    setAttemptId(null);
    setInitialChallenge(null);
  }

  async function deferAttempt(savedAttemptId: string) {
    const result = await scoring.requestServerResult("/api/assessment/results", questions, savedAttemptId);
    completeAttempt(result);
  }

  return {
    attemptId,
    initialChallenge,
    startError,
    needsOralEvidence,
    pendingLookupDone,
    beginAttempt,
    completeAttempt,
    deferAttempt,
  };
}
