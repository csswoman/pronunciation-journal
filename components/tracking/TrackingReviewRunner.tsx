"use client";

// Planned structure:
// <TrackingReviewRunner>
//   <PracticeSession />
// </TrackingReviewRunner>

import PracticeSession from "@/components/practice/PracticeSession";
import type { PracticeExercise } from "@/lib/practice/types";

interface TrackingReviewRunnerProps {
  exercises: PracticeExercise[];
  onFinish: () => void;
}

export default function TrackingReviewRunner({ exercises, onFinish }: TrackingReviewRunnerProps) {
  return (
    <PracticeSession
      context="review"
      exercises={exercises}
      sessionLength={exercises.length}
      sessionLabel="Contenido guardado"
      onSessionComplete={onFinish}
      onExit={onFinish}
    />
  );
}
