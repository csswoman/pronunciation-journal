"use client";

import { useEffect, useRef } from "react";
import type { AIMessage, LearningSession } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import WelcomeScreen from "./WelcomeScreen";
import TypingIndicator from "./TypingIndicator";
interface ChatViewProps {
  messages: AIMessage[];
  isStreaming: boolean;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  activeSession?: LearningSession | null;
}

function isSystemMessage(msg: AIMessage, index: number, all: AIMessage[]): boolean {
  if (index === 0 && msg.role === "user" && msg.content.length > 200) return true;
  if (index === 1 && msg.role === "model") {
    const firstUser = all[0];
    if (firstUser && firstUser.role === "user" && firstUser.content.length > 200) return true;
  }
  return false;
}

export default function ChatView({
  messages,
  isStreaming,
  onSaveWord,
  onSuggestionClick,
  activeSession,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const visibleMessages = messages.filter((msg, i, arr) => !isSystemMessage(msg, i, arr));

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
        />
      ))}

      {isStreaming && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
