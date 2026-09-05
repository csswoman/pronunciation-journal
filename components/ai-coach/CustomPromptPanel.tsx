"use client";

import Button from "@/components/ui/Button";
import { SendHorizonal } from "@/components/icons";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";

interface CustomPromptPanelProps {
  onSubmit: (text: string) => void;
  isDisabled: boolean;
  placeholder?: string;
  variant?: "hero" | "chat";
  helperText?: string;
  prefill?: string;
  onPrefillConsumed?: () => void;
}

export default function CustomPromptPanel({
  onSubmit,
  isDisabled,
  placeholder = "Escribe a tu AI Coach...",
  variant = "chat",
  helperText,
  prefill,
  onPrefillConsumed,
}: CustomPromptPanelProps) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefill === undefined) return;
    setText(prefill);
    onPrefillConsumed?.();
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, variant === "hero" ? 200 : 160) + "px";
    });
  }, [prefill, onPrefillConsumed, variant]);

  const handleSubmit = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!text.trim() || isDisabled) return;
    onSubmit(text.trim());
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, variant === "hero" ? 200 : 160) + "px";
    }
  };

  if (variant === "hero") {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border-2 border-border-default bg-surface-raised p-5 transition-all focus-within:border-primary"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={4}
          autoFocus
          className="w-full resize-none bg-transparent text-base leading-relaxed focus:outline-none max-h-48 text-fg"
        />
        <div className="flex items-center justify-between gap-3">
          {helperText && (
            <p className="text-body-sm text-fg-subtle">{helperText}</p>
          )}
          <Button
            type="submit"
            disabled={!text.trim() || isDisabled}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-lg text-body-sm font-semibold transition-colors disabled:opacity-40 bg-primary text-white hover:bg-primary-hover"
          >
            {isDisabled
              ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <SendHorizonal size={15} strokeWidth={2} />}
            Enviar
          </Button>
        </div>
      </form>
    );
  }

  // variant === "chat"
  const hasText = text.trim().length > 0;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border px-3.5 py-1.5 transition-[border-color,box-shadow] duration-150 bg-surface-raised shadow-xs",
          focused
            ? "border-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_18%,transparent)]"
            : "border-border-default hover:border-border-default/80",
        )}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-body-sm leading-relaxed focus:outline-none max-h-40 py-1 text-fg placeholder:text-fg-subtle"
        />

        <button
          type="button"
          role="switch"
          aria-checked={feedbackEnabled}
          onClick={() => setFeedbackEnabled((v) => !v)}
          title={feedbackEnabled ? "Desactivar correcciones de IA" : "Activar correcciones de IA"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xxs font-medium transition-colors cursor-pointer select-none shrink-0",
            feedbackEnabled
              ? "bg-success-soft text-success border border-success/25"
              : "bg-surface-sunken text-fg-subtle border border-border-subtle hover:text-fg",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full transition-colors",
              feedbackEnabled ? "bg-success" : "bg-fg-subtle",
            )}
          />
          <span>Feedback IA</span>
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasText || isDisabled}
          aria-label="Enviar"
          className="flex h-[36px] w-[36px] flex-shrink-0 items-center justify-center rounded-full border-none bg-primary text-white shadow-xs transition-transform duration-150 hover:scale-105 active:scale-95 disabled:bg-surface-sunken disabled:text-fg-subtle disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
        >
          {isDisabled
            ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <SendHorizonal size={16} strokeWidth={2.5} className="text-white" />}
        </button>
      </div>

      <div className="flex items-center justify-between px-2 text-tiny text-fg-subtle">
        <p className="hidden sm:block m-0 text-xxs text-fg-subtle">
          <kbd className="px-1 py-px rounded text-xxs font-mono bg-surface-sunken text-fg-muted border border-border-subtle">
            ↵
          </kbd>
          {" "}enviar ·{" "}
          <kbd className="px-1 py-px rounded text-xxs font-mono bg-surface-sunken text-fg-muted border border-border-subtle">
            Shift + ↵
          </kbd>
          {" "}nueva línea
        </p>
      </div>
    </div>
  );
}
