"use client";

import { useState, useRef, useEffect } from "react";

interface CustomPromptPanelProps {
  onSubmit: (text: string) => void;
  isDisabled: boolean;
  placeholder?: string;
  /** "hero" = large elevated input on select screen; "chat" = compact sticky reply bar */
  variant?: "hero" | "chat";
  helperText?: string;
  /** Controlled prefill value — when set, replaces input content and focuses */
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When a prefill arrives, set the text and move cursor to end
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

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || isDisabled) return;
    onSubmit(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
        className="flex flex-col gap-3 p-4 rounded-2xl border transition-all focus-within:shadow-lg"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--line-divider)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
        onBlur={(e) => {
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
          rows={3}
          autoFocus
          className="w-full resize-none bg-transparent text-base leading-relaxed focus:outline-none max-h-48"
          style={{ color: "var(--text-primary)" }}
        />
        <div className="flex items-center justify-between gap-3">
          {helperText && (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {helperText}
            </p>
          )}
          <button
            type="submit"
            disabled={!text.trim() || isDisabled}
            className="ml-auto flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.backgroundColor = "var(--btn-regular-bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.backgroundColor = "var(--primary)";
            }}
          >
            {isDisabled ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
            Send
          </button>
        </div>
      </form>
    );
  }

  // variant === "chat"
  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-3 rounded-2xl border transition-all focus-within:shadow-md"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
      onBlur={(e) => {
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
        rows={1}
        className="flex-1 resize-none bg-transparent text-sm leading-relaxed focus:outline-none max-h-40 py-1"
        style={{ color: "var(--text-primary)" }}
      />
      <button
        type="submit"
        disabled={!text.trim() || isDisabled}
        className="flex-shrink-0 w-9 h-9 rounded-xl text-white transition-colors flex items-center justify-center disabled:opacity-40"
        style={{ backgroundColor: "var(--primary)" }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled)
            e.currentTarget.style.backgroundColor = "var(--btn-regular-bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.disabled)
            e.currentTarget.style.backgroundColor = "var(--primary)";
        }}
        aria-label="Send"
      >
        {isDisabled ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </form>
  );
}
