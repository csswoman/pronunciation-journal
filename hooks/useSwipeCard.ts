"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveSwipeDirection, type SwipeDirectionOptions } from "@/lib/gestures/swipe-direction";

export interface UseSwipeCardOptions extends SwipeDirectionOptions {
  onSwipeLeft?: () => void | Promise<void>;
  onSwipeRight?: () => void | Promise<void>;
  disabled?: boolean;
}

export function useSwipeCard({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  velocityThreshold = 0.5,
  disabled = false,
}: UseSwipeCardOptions = {}) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState<"left" | "right" | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const exitingRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => {
      preference.removeEventListener("change", updatePreference);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const commitSwipe = useCallback((direction: "left" | "right") => {
    if (direction === "left") return onSwipeLeft?.();
    return onSwipeRight?.();
  }, [onSwipeLeft, onSwipeRight]);

  const animateSwipe = useCallback((direction: "left" | "right") => {
    if (disabled || exitingRef.current) return;
    exitingRef.current = true;
    setIsExiting(direction);

    if (reducedMotion) {
      void commitSwipe(direction);
      exitingRef.current = false;
      setIsExiting(null);
      setOffset(0);
      return;
    }

    setOffset(direction === "right" ? 500 : -500);
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      void commitSwipe(direction);
      exitingRef.current = false;
      setOffset(0);
      setIsExiting(null);
    }, 200);
  }, [commitSwipe, disabled, reducedMotion]);

  const triggerSwipe = useCallback(
    (direction: "left" | "right") => animateSwipe(direction),
    [animateSwipe],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabled || exitingRef.current || e.button !== 0) return;
      if (e.target instanceof Element && e.target.closest("button, a, input, textarea, select")) return;

      e.currentTarget.setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;
      startXRef.current = e.clientX;
      lastXRef.current = e.clientX;
      lastTimeRef.current = performance.now();
      velocityRef.current = 0;
      setIsDragging(true);
    },
    [disabled],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;

      const now = performance.now();
      const dt = now - lastTimeRef.current;
      const dx = e.clientX - lastXRef.current;
      if (dt > 0) velocityRef.current = dx / dt;
      lastXRef.current = e.clientX;
      lastTimeRef.current = now;
      setOffset(e.clientX - startXRef.current);
    },
    [],
  );

  const releasePointer = useCallback((e: React.PointerEvent<HTMLElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Pointer capture can be released by the browser during cancellation.
    }
    pointerIdRef.current = null;
  }, []);

  const finishGesture = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      releasePointer(e);
      setIsDragging(false);

      const finalOffset = e.clientX - startXRef.current;
      const direction = resolveSwipeDirection(finalOffset, velocityRef.current, {
        threshold,
        velocityThreshold,
      });

      if (direction) {
        animateSwipe(direction);
      } else {
        setOffset(0);
      }
    },
    [animateSwipe, releasePointer, threshold, velocityThreshold],
  );

  const cancelGesture = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      releasePointer(e);
      velocityRef.current = 0;
      setIsDragging(false);
      setOffset(0);
    },
    [releasePointer],
  );

  const rotation = offset * 0.08;
  const cardStyle: React.CSSProperties = {
    transform: `translate3d(${offset}px, 0, 0) rotate(${rotation}deg)`,
    transition: isDragging || reducedMotion ? "none" : "transform 200ms ease-out, opacity 200ms ease-out",
    opacity: isExiting ? 0 : 1,
    touchAction: "pan-y",
    userSelect: "none",
    cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
  };

  return {
    offset,
    isDragging,
    isExiting,
    triggerSwipe,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishGesture,
      onPointerCancel: cancelGesture,
      style: cardStyle,
    },
  };
}
