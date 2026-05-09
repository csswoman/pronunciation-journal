"use client";

import { useEffect, useRef } from "react";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import MessageBubble from "./MessageBubble";
import WelcomeScreen from "./WelcomeScreen";
import TypingIndicator from "./TypingIndicator";
import { TEMPLATES } from "./TemplateCard";
import type { AITemplateId } from "@/lib/types";

interface ChatViewProps {
  messages: AIMessage[];
  isStreaming: boolean;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onSendMessage?: (text: string) => void;
  onNext: () => void;
}

export default function ChatView({
  messages,
  isStreaming,
  onSaveWord,
  onSuggestionClick,
  onToolAnswer,
  onSendMessage,
  onNext,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const visibleMessages = messages.filter((m, i) => {
    if (m.role === "tool") return false;
    if (isStreaming && i === messages.length - 1 && m.role === "model") {
      const hasText = m.contentParts.some(p => p.type === "text" && p.text.trim().length > 0);
      return hasText;
    }
    return true;
  });

  if (visibleMessages.length === 0 && !isStreaming) {
    const handleTemplateSelect = onSendMessage
      ? (id: AITemplateId) => {
          const t = TEMPLATES.find(t => t.id === id);
          if (t) onSendMessage(t.description);
        }
      : undefined;

    return (
      <WelcomeScreen
        onSuggestionClick={onSuggestionClick}
        onTemplateSelect={handleTemplateSelect}
      />
    );
  }

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

  return (
    <div className="chat-messages-container flex flex-col justify-end h-full py-4">
      <div className="mt-auto flex flex-col">
        {visibleMessages.map((msg, i) => (
          <div key={i} className={gapBefore[i] ? "mt-4" : "mt-1"}>
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

        {isStreaming && (
          <div className={visibleMessages.length > 0 && visibleMessages[visibleMessages.length - 1].role === "model" ? "mt-1" : "mt-4"}>
            <TypingIndicator />
          </div>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
