"use client";

import { useEffect, useRef, useState } from "react";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import type { ExerciseSessionSummary } from "./PracticeSession";
import { cn } from "@/lib/cn";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

// Planned structure:
// <ChatView>
//   <MessageStack />
//   <TypingIndicator />
// </ChatView>

const MIN_THINKING_MS = 700;

interface ChatViewProps {
  messages: AIMessage[];
  isStreaming: boolean;
  onSaveWord: (word: string, context: string) => void;
  onSaveTranslation?: (msgIndex: number, translation: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onNext: () => void;
  onExerciseComplete?: (summary: ExerciseSessionSummary) => void;
  align?: "bottom" | "top";
  className?: string;
}

export default function ChatView({
  messages,
  isStreaming,
  onSaveWord,
  onSaveTranslation,
  onSuggestionClick,
  onToolAnswer,
  onNext,
  onExerciseComplete,
  align = "top",
  className,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const thinkingStartRef = useRef<number | null>(null);
  const [thinkingHold, setThinkingHold] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, thinkingHold]);

  // Hold the typing indicator for a minimum duration so the AI doesn't pop in abruptly.
  useEffect(() => {
    if (isStreaming) {
      thinkingStartRef.current ??= Date.now();
      setThinkingHold(true);
      return;
    }
    if (thinkingStartRef.current == null) return;
    const elapsed = Date.now() - thinkingStartRef.current;
    const remaining = Math.max(0, MIN_THINKING_MS - elapsed);
    const t = setTimeout(() => {
      setThinkingHold(false);
      thinkingStartRef.current = null;
    }, remaining);
    return () => clearTimeout(t);
  }, [isStreaming]);

  const visibleMessages = messages.filter((m, i) => {
    if (m.role === "tool") return false;
    if (m.role === "user" && m.hidden) return false;
    if (i === messages.length - 1 && m.role === "model") {
      const hasText = m.contentParts.some((p) => p.type === "text" && p.text.trim().length > 0);
      if (!hasText) return false;
      if (thinkingHold) return false;
      return true;
    }
    return true;
  });

  const showIndicator = isStreaming || thinkingHold;

  const isLastInGroup = visibleMessages.map((msg, i) => {
    const next = visibleMessages[i + 1];
    return !next || next.role !== msg.role;
  });

  const senderChanged = visibleMessages.map((msg, i) => {
    if (i === 0) return true;
    return visibleMessages[i - 1].role !== msg.role;
  });

  const lastVisible = visibleMessages[visibleMessages.length - 1];
  const indicatorVisible = showIndicator && lastVisible?.role !== "model";
  const isTop = align === "top";

  return (
    <div
      className={cn(
        "chat-messages-container flex min-h-full flex-1 w-full flex-col py-3",
        isTop ? "justify-start" : "h-full justify-end",
        className,
      )}
    >
      <div className={cn("flex w-full flex-col px-3 @[22rem]:px-4", !isTop && "mt-auto")}>
        {visibleMessages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              senderChanged[i] ? "mt-4 first:mt-0" : "mt-1.5",
              msg.role === "model" && "animate-message-in",
            )}
          >
            <MessageBubble
              message={msg}
              showAvatar={isLastInGroup[i]}
              onSaveWord={onSaveWord}
              onSaveTranslation={(translation) => onSaveTranslation?.(messages.indexOf(msg), translation)}
              onSuggestionClick={onSuggestionClick}
              onToolAnswer={onToolAnswer}
              onNext={onNext}
              onExerciseComplete={onExerciseComplete}
            />
          </div>
        ))}

        {indicatorVisible && (
          <div className={cn(visibleMessages.length > 0 && "mt-4")}>
            <TypingIndicator />
          </div>
        )}

        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>
    </div>
  );
}
