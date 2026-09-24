"use client";

import { useState } from "react";
import { AssessmentPayloadSchema } from "@/lib/courses/assessment-schema";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { ClientAssessmentQuestion, AssessmentResult } from "@/lib/courses/assessment";
import { ASSESSMENT_LEVEL_ORDER } from "@/lib/courses/assessment-shared";
import type { CefrLevelId } from "@/lib/courses/types";
import { saveGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import {
  buildStarterPlanResult,
  persistLocalAssessmentCache,
  persistVerifiedAssessmentLocally,
} from "./assessment-client-helpers";

type AssessmentEndpoint = "/api/assessment/score" | "/api/assessment/results";

interface UseAssessmentScoringOptions {
  mode: "placement" | "checkpoint";
  concepts: AssessmentConcept[];
  checkpointLabel?: string;
  userId?: string;
  checkpointLevel: CefrLevelId | null;
  answers: Record<string, number>;
  selfRatings: Record<string, ConceptSelfRating>;
}

export function useAssessmentScoring({
  mode,
  concepts,
  checkpointLabel,
  userId,
  checkpointLevel,
  answers,
  selfRatings,
}: UseAssessmentScoringOptions) {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [evaluationError, setEvaluationError] = useState(false);

  async function requestServerResult(
    endpoint: AssessmentEndpoint,
    attemptedQuestions: ClientAssessmentQuestion[],
    assessmentAttemptId?: string,
  ): Promise<AssessmentResult> {
    const evaluatedLevels = ASSESSMENT_LEVEL_ORDER.filter((level) =>
      attemptedQuestions.some((question) => question.level === level),
    );
    const payload = {
      mode,
      ...(evaluatedLevels.length > 0 ? { evaluatedLevels } : {}),
      ...(checkpointLevel ? { checkpointLevel } : {}),
      ...(assessmentAttemptId ? { assessmentAttemptId } : {}),
      answers,
      selfRatings,
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const responseBody = await response.json().catch(() => null) as { result?: unknown } | null;
    if (!response.ok || !responseBody?.result) throw new Error("Assessment scoring failed");
    const parsedResult = AssessmentPayloadSchema.safeParse(responseBody.result);
    if (!parsedResult.success) throw new Error("Assessment scoring response was invalid");
    return parsedResult.data as AssessmentResult;
  }

  function displayVerifiedResult(nextResult: AssessmentResult, attemptedQuestions: ClientAssessmentQuestion[]) {
    setResult(nextResult);
    setEvaluationError(false);
    try {
      persistLocalAssessmentCache({
        userId,
        mode,
        checkpointLabel,
        nextResult,
        answers,
        selfRatings,
        checkpointLevel,
      });
      saveGuestStudyLevel(nextResult.assignedLevel);
    } catch {
      /* Keep the server-verified result visible if local storage is unavailable. */
    }
    if (userId && attemptedQuestions.length > 0) {
      setSaving(true);
      setSaveError(false);
      void persistVerifiedAssessmentLocally(userId, nextResult)
        .catch(() => setSaveError(true))
        .finally(() => setSaving(false));
    }
  }

  async function completeAssessment(attemptedQuestions: ClientAssessmentQuestion[]) {
    if (attemptedQuestions.length === 0) {
      const ratedConcepts = concepts.filter((concept) => selfRatings[concept.lessonSlug] !== undefined);
      setResult(buildStarterPlanResult(ratedConcepts, selfRatings));
      return;
    }
    setSaving(true);
    setEvaluationError(false);
    try {
      const endpoint = userId ? "/api/assessment/results" : "/api/assessment/score";
      const nextResult = await requestServerResult(endpoint, attemptedQuestions);
      displayVerifiedResult(nextResult, attemptedQuestions);
    } catch {
      setEvaluationError(true);
    } finally {
      setSaving(false);
    }
  }

  function retryPersistence() {
    if (!userId || !result) return;
    setSaving(true);
    setSaveError(false);
    void persistVerifiedAssessmentLocally(userId, result)
      .catch(() => setSaveError(true))
      .finally(() => setSaving(false));
  }

  return {
    result,
    saving,
    saveError,
    evaluationError,
    setSaving,
    setEvaluationError,
    requestServerResult,
    displayVerifiedResult,
    completeAssessment,
    retryPersistence,
  };
}
