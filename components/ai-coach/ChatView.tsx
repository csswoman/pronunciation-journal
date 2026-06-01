"use client";

import { useEffect, useRef, useState } from "react";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const MIN_THINKING_MS = 700;

interface ChatViewProps {
  messages: AIMessage[];
  isStreaming: boolean;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onNext: () => void;
}

export default function ChatView({
  messages,
  isStreaming,
  onSaveWord,
  onSuggestionClick,
  onToolAnswer,
  onNext,
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
      const hasText = m.contentParts.some(p => p.type === "text" && p.text.trim().length > 0);
      if (!hasText) return false;
      if (thinkingHold) return false;
      return true;
    }
    return true;
  });

  const showIndicator = isStreaming || thinkingHold;

  // Compute grouping: is this the last message of a consecutive run from same sender?
  const isLastInGroup = visibleMessages.map((msg, i) => {
    const next = visibleMessages[i + 1];
    return !next || next.role !== msg.role;
  });

  // Gap between messages: small within same sender group, larger on sender change
  const gapBefore = visibleMessages.map((msg, i) => {
    if (i === 0) return false;
    return visibleMessages[i - 1].role !== msg.role;
  });

  const lastVisible = visibleMessages[visibleMessages.length - 1];
  const indicatorVisible = showIndicator && lastVisible?.role !== "model";

  return (
    <div className="chat-messages-container flex flex-col justify-end h-full py-4">
      <div className="mt-auto flex flex-col mx-4 sm:mx-5">
        {visibleMessages.map((msg, i) => (
          <div
            key={i}
            className={`${gapBefore[i] ? "mt-4" : "mt-1"} ${msg.role === "model" ? "animate-message-in" : ""}`}
          >
            <MessageBubble
              message={msg}
              showAvatar={isLastInGroup[i]}
              onSaveWord={onSaveWord}
              onSuggestionClick={onSuggestionClick}
              onToolAnswer={onToolAnswer}
              onNext={onNext}
            />
          </div>
        ))}

        {indicatorVisible && (
          <div className={visibleMessages.length > 0 ? "mt-4" : ""}>
            <TypingIndicator />
          </div>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
