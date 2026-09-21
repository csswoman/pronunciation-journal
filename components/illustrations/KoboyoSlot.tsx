import type React from "react";
import { getIllustration, type IllustrationKey } from "@/lib/illustrations/registry";
import { cn } from "@/lib/cn";

export interface KoboyoSlotProps {
  name: string;
  variant?: "hero" | "card" | "closing";
  /** @deprecated El slot adapta su altura al variant. Se mantiene por compatibilidad. */
  heightText?: string;
  className?: string;
}

const NAME_TO_KEY: Record<string, IllustrationKey> = {
  "adult learning a language": "domainDictionary",
  "practising a skill": "domainSpeaking",
  "pupil reading aloud": "domainReading",
  "writing in a notebook": "domainWriting",
  "teaching a friend": "journalLanguageBook",
  celebrating: "stateCompletado",
};

export function KoboyoSlot({
  name,
  variant = "card",
  className,
}: KoboyoSlotProps) {
  const key = NAME_TO_KEY[name] ?? "domainSpeaking";
  const Illustration = getIllustration(key);

  if (variant === "closing") {
    return (
      <div
        className={cn(
          "flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64",
          className
        )}
      >
        <Illustration className="h-48 w-auto text-[var(--text-primary)] transition-transform hover:scale-105 duration-300" />
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "flex h-32 w-full items-center justify-center",
          className
        )}
      >
        <Illustration className="h-28 w-auto text-[var(--text-primary)]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-28 w-full items-center justify-center",
        className
      )}
    >
      <Illustration className="h-24 w-auto text-[var(--text-primary)]" />
    </div>
  );
}
