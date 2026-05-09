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

  // Hide tool messages from UI; also hide last model message if empty while streaming
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

  return (
    <div className="chat-messages-container flex flex-col justify-end h-full gap-5 py-4">
      {visibleMessages.map((msg, i) => (
        <MessageBubble
          key={i}
          message={msg}
          onSaveWord={onSaveWord}
          onSuggestionClick={onSuggestionClick}
          onToolAnswer={onToolAnswer}
          onNext={onNext}
        />
      ))}

      {isStreaming && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
