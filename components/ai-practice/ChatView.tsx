"use client";

import { useEffect, useRef } from "react";
import type { AIMessage } from "@/lib/types";
import MessageBubble from "./MessageBubble";

interface ChatViewProps {
  messages: AIMessage[];
  isStreaming: boolean;
  onSaveWord: (word: string, context: string) => void;
  /** If set, shows a pill after the last AI message indicating the workspace is open */
  hasActiveSession?: boolean;
  onOpenWorkspace?: () => void;
}

export default function ChatView({
  messages,
  isStreaming,
  onSaveWord,
  hasActiveSession,
  onOpenWorkspace,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const visibleMessages = messages.filter((msg, i) => {
    if (i === 0 && msg.role === "user" && msg.content.length > 200) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4 py-1">
      {visibleMessages.length === 0 && !isStreaming && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
          >
            AI
          </div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Starting your session…
          </p>
        </div>
      )}

      {visibleMessages.map((msg, i) => {
        const isLastAI =
          msg.role === "model" &&
          i === visibleMessages.length - 1 &&
          !isStreaming;

        return (
          <div key={i}>
            <MessageBubble message={msg} onSaveWord={onSaveWord} />
            {isLastAI && hasActiveSession && onOpenWorkspace && (
              <div className="flex justify-start pl-8 mt-2">
                <button
                  onClick={onOpenWorkspace}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{
                    backgroundColor: "var(--btn-regular-bg)",
                    borderColor: "var(--primary)",
                    color: "var(--primary)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  Open practice
                </button>
              </div>
            )}
          </div>
        );
      })}

      {isStreaming && (
        <div className="flex justify-start gap-2.5">
          <div
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
          >
            AI
          </div>
          <div
            className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm"
            style={{ backgroundColor: "var(--btn-regular-bg)" }}
          >
            <div className="flex gap-1 items-center h-4">
              <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: "var(--text-tertiary)" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: "var(--text-tertiary)" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--text-tertiary)" }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
