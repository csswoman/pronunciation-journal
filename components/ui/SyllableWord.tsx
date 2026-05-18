"use client";

import { memo, useEffect, useState } from "react";
import { resolveSyllableWord, splitBySyllableSeparator, SYLLABLE_SEPARATOR } from "@/lib/pronunciation/syllable-separation";

interface SyllableWordProps {
  word: string;
  className?: string;
  separatorClassName?: string;
}

function SyllableWordBase({ word, className, separatorClassName = "text-[var(--text-primary)]" }: SyllableWordProps) {
  const [displayWord, setDisplayWord] = useState(word);

  useEffect(() => {
    let active = true;
    setDisplayWord(word);

    void resolveSyllableWord(word).then((resolved) => {
      if (active) setDisplayWord(resolved);
    });

    return () => {
      active = false;
    };
  }, [word]);

  const chunks = splitBySyllableSeparator(displayWord);
  if (chunks.length === 1) {
    return <span className={className}>{displayWord}</span>;
  }

  return (
    <span className={className}>
      {chunks.map((chunk, index) => (
        <span key={`${chunk}-${index}`}>
          {index > 0 && <span className={separatorClassName}>{SYLLABLE_SEPARATOR}</span>}
          {chunk}
        </span>
      ))}
    </span>
  );
}

export const SyllableWord = memo(SyllableWordBase);
