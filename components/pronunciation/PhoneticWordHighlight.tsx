"use client";

import { useMemo } from "react";
import { alignWordToPhoneme } from "@/lib/pronunciation/spelling-alignment";
import { cn } from "@/lib/cn";

interface Props {
  word: string;
  phonemeOrIpa?: string;
  className?: string;
  highlightClassName?: string;
}

export function PhoneticWordHighlight({
  word,
  phonemeOrIpa,
  className,
  highlightClassName,
}: Props) {
  const segments = useMemo(() => {
    if (!phonemeOrIpa) return [{ text: word, isTarget: false }];
    return alignWordToPhoneme(word, phonemeOrIpa);
  }, [word, phonemeOrIpa]);

  return (
    <span className={cn("inline-block select-text", className)}>
      {segments.map((seg, i) =>
        seg.isTarget ? (
          <span
            key={i}
            className={cn(
              "text-primary font-bold underline decoration-primary/60 decoration-2 underline-offset-4",
              highlightClassName,
            )}
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
}
