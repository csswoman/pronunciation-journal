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
          className="w-full resize-none bg-transparent text-base leading-relaxed focus:outline-none max-h-48 text-fg"
        />
        <div className="flex items-center justify-between gap-3">
          {helperText && (
            <p className="text-body-sm text-fg-subtle">{helperText}</p>
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
      <div
        className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full border transition-[border-color,box-shadow] duration-150"
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
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed focus:outline-none max-h-40 py-1.5 text-fg"
        />

        <button
          type="button"
          aria-label="Voice input"
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          <Mic size={16} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasText || isDisabled}
          aria-label="Send"
          className="w-[38px] h-[38px] rounded-full flex-shrink-0 flex items-center justify-center transition-[transform,opacity] duration-150 disabled:opacity-40 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--on-primary)",
            border: "none",
          }}
        >
          {isDisabled
            ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <SendHorizonal size={16} strokeWidth={2.25} />}
        </button>
      </div>

      {/* Hint bar */}
      <div className="flex items-center justify-between px-1">
        <p className="text-tiny text-fg-subtle">
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
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--success)" }} />
          <span className="text-tiny text-fg-subtle">AI feedback on</span>
        </div>
      </div>
    </div>
  );
}
