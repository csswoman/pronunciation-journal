"use client";

import { useState } from "react";
import { Sparkles, X } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";

interface AICoachTriggerProps {
  variant?: "fab" | "nav" | "labeled";
  className?: string;
}

function TriggerIcon({ isOpen }: { isOpen: boolean }) {
  return isOpen ? (
    <X size={18} strokeWidth={2.25} aria-hidden />
  ) : (
    <Sparkles size={18} strokeWidth={2} aria-hidden />
  );
}

export default function AICoachTrigger({ variant = "fab", className }: AICoachTriggerProps) {
  const { isOpen, toggle } = useAICoachStore();
  const [hovered, setHovered] = useState(false);

  const shadow = hovered
    ? "0 0 0 4px color-mix(in oklch, var(--primary) 25%, transparent), 0 6px 20px color-mix(in oklch, var(--primary) 45%, transparent)"
    : isOpen
      ? "0 0 0 4px color-mix(in oklch, var(--primary) 25%, transparent), 0 4px 16px color-mix(in oklch, var(--primary) 35%, transparent)"
      : "0 4px 16px color-mix(in oklch, var(--primary) 30%, transparent)";

  const navShadow = isOpen
    ? "0 0 0 4px color-mix(in oklch, var(--primary) 25%, transparent), 0 6px 18px color-mix(in oklch, var(--primary) 40%, transparent)"
    : "0 4px 14px color-mix(in oklch, var(--primary) 35%, transparent)";

  if (variant === "nav") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Cerrar el asistente de práctica" : "Abrir el asistente de práctica"}
        title="Asistente de práctica"
        className={cn(
          "flex shrink-0 items-center justify-center w-14 h-14 -mt-5 rounded-full text-on-primary transition-all duration-200 active:scale-95",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none",
          className,
        )}
        style={{ backgroundColor: "var(--primary)", boxShadow: navShadow }}
      >
        <TriggerIcon isOpen={isOpen} />
      </button>
    );
  }

  if (variant === "labeled") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Cerrar el asistente de práctica" : "Abrir el asistente de práctica"}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex min-h-11 items-center gap-2 rounded-xl px-3.5 font-label text-on-primary transition-all duration-200 lg:bottom-8 lg:right-8",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none",
          className,
        )}
        style={{
          backgroundColor: isOpen
            ? "var(--primary)"
            : "color-mix(in oklch, var(--primary) 88%, transparent)",
          boxShadow: shadow,
          transform: hovered ? "scale(1.03)" : "scale(1)",
        }}
      >
        <TriggerIcon isOpen={isOpen} />
        <span>{isOpen ? "Cerrar" : "Coach"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? "Cerrar el asistente de práctica" : "Abrir el asistente de práctica"}
      title="Asistente de práctica"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-2xl text-on-primary transition-all duration-200 lg:bottom-8 lg:right-8",
        className,
      )}
      style={{
        backgroundColor: isOpen
          ? "var(--primary)"
          : "color-mix(in oklch, var(--primary) 88%, transparent)",
        boxShadow: shadow,
        transform: hovered ? "scale(1.06)" : "scale(1)",
      }}
    >
      <TriggerIcon isOpen={isOpen} />
    </button>
  );
}
