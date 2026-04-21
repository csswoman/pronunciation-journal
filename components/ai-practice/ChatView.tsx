"use client";

import { useEffect, useRef } from "react";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import MessageBubble from "./MessageBubble";
import WelcomeScreen from "./WelcomeScreen";
import TypingIndicator from "./TypingIndicator";

interface ChatViewProps {
  messages: AIMessage[];
  isStreaming: boolean;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
}

export default function ChatView({
  messages,
  isStreaming,
  onSaveWord,
  onSuggestionClick,
  onToolAnswer,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Hide tool messages from UI
  const visibleMessages = messages.filter(m => m.role !== "tool");

  if (visibleMessages.length === 0 && !isStreaming) {
    return <WelcomeScreen onSuggestionClick={onSuggestionClick} />;
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      {visibleMessages.map((msg, i) => (
        <MessageBubble
          key={i}
          message={msg}
          onSaveWord={onSaveWord}
          onSuggestionClick={onSuggestionClick}
          onToolAnswer={onToolAnswer}
        />
      ))}

      {isStreaming && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
