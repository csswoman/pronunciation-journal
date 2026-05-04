"use client";

import Button from "@/components/ui/Button";
import { SendHorizonal, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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
  placeholder = "Type your message...",
  variant = "chat",
  helperText,
  prefill,
  onPrefillConsumed,
}: CustomPromptPanelProps) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
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
  }, [prefill]);

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
        className="flex flex-col gap-4 p-5 rounded-xl border-2 transition-all"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--line-divider)" }}
        onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
        onBlur={e => {
          if (!e.currentTarget.contains(e.relatedTarget))
            e.currentTarget.style.borderColor = "var(--line-divider)";
        }}
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
          className="w-full resize-none bg-transparent text-base leading-relaxed focus:outline-none max-h-48"
          style={{ color: "var(--text-primary)" }}
        />
        <div className="flex items-center justify-between gap-3">
          {helperText && (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{helperText}</p>
          )}
          <Button
            type="submit"
            disabled={!text.trim() || isDisabled}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {isDisabled
              ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <SendHorizonal size={15} strokeWidth={2} />}
            Send
          </Button>
        </div>
      </form>
    );
  }

  // variant === "chat"
  const hasText = text.trim().length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Input card */}
      <div
        className="flex items-end gap-2 px-3 py-2 rounded-2xl border transition-colors"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: focused ? "var(--primary)" : "var(--line-divider)",
          boxShadow: focused
            ? "0 0 0 3px color-mix(in oklch, var(--primary) 18%, transparent)"
            : "none",
        }}
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
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed focus:outline-none max-h-40 px-1 py-1.5"
          style={{ color: "var(--text-primary)" }}
        />

        {/* Mic / Send button */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isDisabled && !hasText}
          aria-label={hasText ? "Send" : "Hold to speak"}
          className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors disabled:opacity-60"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          {isDisabled
            ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : hasText
              ? <SendHorizonal size={15} strokeWidth={2} />
              : <Mic size={16} strokeWidth={2} />}
        </Button>
      </div>

      {/* Hint bar */}
      <div className="flex items-center justify-between px-1">
        <p className="text-tiny" style={{ color: "var(--text-tertiary)" }}>
          <kbd
            className="px-1 py-px rounded text-tiny font-mono"
            style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-secondary)" }}
          >
            ↵
          </kbd>
          {" "}to send ·{" "}
          <kbd
            className="px-1 py-px rounded text-tiny font-mono"
            style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-secondary)" }}
          >
            Shift + ↵
          </kbd>
          {" "}for new line
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--primary)" }}
          />
          <span className="text-tiny" style={{ color: "var(--text-tertiary)" }}>
            AI feedback on
          </span>
        </div>
      </div>
    </div>
  );
}
