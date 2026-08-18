"use client";

import { useEffect, type RefObject } from "react";
import type { Side, Verdict } from "./minimal-pairs-types";

/** Keyboard shortcuts + scroll quiz actions into view when a round starts. */
export function useMinimalPairsInteractions({
  quizTarget,
  verdict,
  quizActionsRef,
  handleGuess,
  goToNextPair,
}: {
  quizTarget: Side | null;
  verdict: Verdict;
  quizActionsRef: RefObject<HTMLDivElement | null>;
  handleGuess: (guess: Side) => void;
  goToNextPair: (startQuiz?: boolean) => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest("input, textarea, select")) return;

      if (quizTarget && !verdict) {
        if (event.key.toLowerCase() === "a") handleGuess("A");
        if (event.key.toLowerCase() === "b") handleGuess("B");
        return;
      }

      if (event.key !== "Enter" && event.key !== "ArrowRight") return;
      event.preventDefault();
      if (quizTarget && verdict) {
        goToNextPair(true);
      } else if (!quizTarget) {
        goToNextPair();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToNextPair, handleGuess, quizTarget, verdict]);

  useEffect(() => {
    if (!quizTarget) return;
    const frame = window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      quizActionsRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "end",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [quizActionsRef, quizTarget]);
}
