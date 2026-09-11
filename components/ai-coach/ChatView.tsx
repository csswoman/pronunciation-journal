"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
import type { ExerciseSessionSummary } from "./PracticeSession";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import { cn } from "@/lib/cn";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { ChatContextDivider } from "./chat/ChatContextDivider";

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
  onSaveSaveable: (saveable: TurnSaveable) => Promise<void>;
  onSaveConcept?: (title: string, body: string) => Promise<void>;
  onSaveAllFromSummary: (learned: TurnSaveable[]) => Promise<void>;
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
  onSaveSaveable,
  onSaveConcept,
  onSaveAllFromSummary,
  onSaveTranslation,
  onSuggestionClick,
  onToolAnswer,
  onNext,
  onExerciseComplete,
  align = "top",
  className,
}: ChatViewProps) {
  const autoSpeak = useAICoachStore((s) => s.autoSpeak);
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

  // One pass over `messages` per change instead of four on every render: the
  // stream fires a setMessages per token, so this ran dozens of times a turn.
  // `sourceIndex` is kept so translation edits address the original array
  // without an O(n) indexOf, and `key` gives React a stable identity across
  // the filter flipping entries in and out (an empty streaming bubble).
  const visibleMessages = useMemo(() => {
    const kept: Array<{
      msg: AIMessage;
      sourceIndex: number;
      key: string;
      isLastInGroup: boolean;
      senderChanged: boolean;
    }> = [];

    messages.forEach((m, i) => {
      if (m.role === "tool") return;
      if (m.role === "user" && m.hidden) {
        // A hidden send with a `marker` still leaves a trace: a centered event
        // divider, so the thread does not jump from the learner's last visible
        // turn straight to the coach reacting to something unseen.
        if (m.marker) {
          kept.push({
            msg: m,
            sourceIndex: i,
            key: `${m.timestamp}-${i}`,
            isLastInGroup: true,
            senderChanged: true,
          });
        }
        return;
      }
      if (m.role === "model") {
        const hasText = m.contentParts.some((p) => p.type === "text" && p.text.trim().length > 0);
        const hasToolCall = m.toolCalls.size > 0;
        // An empty model bubble is either the turn still streaming (last message,
        // covered by the typing indicator) or an orphan left behind when a stream
        // was superseded mid-flight. Neither should render as a blank bubble.
        if (!hasText && !hasToolCall) return;
        if (i === messages.length - 1 && thinkingHold) return;
      }

      const prev = kept[kept.length - 1];
      if (prev) prev.isLastInGroup = prev.msg.role !== m.role;

      kept.push({
        msg: m,
        sourceIndex: i,
        key: `${m.timestamp}-${i}`,
        isLastInGroup: true,
        senderChanged: !prev || prev.msg.role !== m.role,
      });
    });

    return kept;
  }, [messages, thinkingHold]);

  const showIndicator = isStreaming || thinkingHold;

  const lastVisible = visibleMessages[visibleMessages.length - 1]?.msg;
  const indicatorVisible = showIndicator && lastVisible?.role !== "model";
  const isTop = align === "top";

  return (
    <div
      className={cn(
        // `min-h-full` fills the viewport when the thread is short; `shrink-0`
        // stops the flex parent from squashing this box down to its own
        // height when the thread is long. Both matter for the `absolute
        // inset-0` gradient (::before): it sizes to this box's border-box, so
        // if the box were capped at the parent height the scrolled-past rows
        // would render bare. `flex-1` here would force `flex-basis:0` and
        // reintroduce exactly that cap.
        "chat-messages-container flex min-h-full w-full shrink-0 flex-col py-3",
        isTop ? "justify-start" : "h-full flex-1 shrink justify-end",
        className,
      )}
    >
      <div className={cn("flex w-full flex-col px-3 @[22rem]:px-4", !isTop && "mt-auto")}>
        {visibleMessages.map((entry, i) => {
          const { msg, sourceIndex, key, isLastInGroup, senderChanged } = entry;
          // Only once the turn has settled: mid-stream the prose is still
          // arriving, and autoplaying then spoke a truncated fragment.
          const isNewest =
            i === visibleMessages.length - 1 && msg.role === "model" && !isStreaming;
          if (msg.role === "user" && msg.hidden && msg.marker) {
            return (
              <div key={key} className="mt-4 first:mt-0">
                <ChatContextDivider label={msg.marker} />
              </div>
            );
          }
          return (
            <div
              key={key}
              className={cn(
                senderChanged ? "mt-4 first:mt-0" : "mt-1.5",
                msg.role === "model" && "animate-message-in",
              )}
            >
              <MessageBubble
                message={msg}
                showAvatar={isLastInGroup}
                autoSpeak={autoSpeak && isNewest}
                onSaveWord={onSaveWord}
                onSaveSaveable={onSaveSaveable}
                onSaveConcept={onSaveConcept}
                onSaveAllFromSummary={onSaveAllFromSummary}
                onSaveTranslation={(translation) => onSaveTranslation?.(sourceIndex, translation)}
                onSuggestionClick={onSuggestionClick}
                onToolAnswer={onToolAnswer}
                onNext={onNext}
                onExerciseComplete={onExerciseComplete}
              />
            </div>
          );
        })}

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
