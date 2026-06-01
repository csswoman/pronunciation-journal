"use client";

import { useCallback, useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface SpeakButtonProps {
  /** Text to speak aloud (English). */
  text: string;
  /** Optional accessible label override. */
  label?: string;
  className?: string;
  /** Visual size — "sm" inline, "md" standalone. */
  size?: "sm" | "md";
}

/**
 * Plays a phrase using the browser Web Speech API. Degrades gracefully:
 * if speech synthesis is unavailable the button hides itself.
 */
export default function SpeakButton({ text, label, className, size = "sm" }: SpeakButtonProps) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.95;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    synth.speak(utter);
  }, [text]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={speak}
      className={cn("gd-speak", `gd-speak--${size}`, speaking && "gd-speak--on", className)}
      aria-label={label ?? `Escuchar: ${text}`}
      title="Escuchar"
    >
      <Volume2 size={size === "md" ? 16 : 13} strokeWidth={2.25} aria-hidden />
    </button>
  );
}
