"use client";

import { useEffect, useRef } from "react";
import { Flame } from "@/components/icons";
import { useRetriggerOnIncrease } from "@/hooks/useRetrigger";
import { playUiCue } from "@/lib/ui-sounds/cues";

interface StreakChipProps {
  days: number;
}

/** Amber streak chip — flame icon + day count, shown beside the home title. */
export default function StreakChip({ days }: StreakChipProps) {
  const countRef = useRetriggerOnIncrease<HTMLSpanElement>(
    days,
    "animate-notification-bounce",
  );
  const prevDays = useRef<number | null>(null);

  useEffect(() => {
    const previous = prevDays.current;
    prevDays.current = days;
    if (previous !== null && days > previous) {
      playUiCue("streak");
    }
  }, [days]);

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-racha-soft px-2.5 py-1 text-tiny text-racha">
      <Flame size={14} aria-hidden />
      <span ref={countRef} className="font-medium tabular-nums">
        {days} {days === 1 ? "día" : "días"}
      </span>
    </span>
  );
}
