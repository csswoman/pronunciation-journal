"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { AIMessage, StreamChunk, ExerciseResult, SendOpts } from "@/lib/ai-practice/types";
import { applyExerciseResult, type UserLearningState } from "@/lib/ai-practice/learning-state";
import { messagesToWire } from "@/lib/ai-practice/wire";
import { makeStreamState, processChunk } from "@/lib/ai-practice/stream-processor";
import type {
  MissionIntentObservedArgs,
  StartMissionArgs,
} from "@/lib/ai-practice/tools/registry";
import { persistCoachExerciseResult } from "@/lib/ai-practice/coach-progress";
import { useCoachSessionMetrics } from "./useCoachSessionMetrics";
import type { AIConversationMode } from "@/lib/types";
import { AI_COACH_RATE_LIMITED_MESSAGE, AI_COACH_TURN_FAILED_MESSAGE, isQuotaLikeError, publicAiErrorMessage } from "@/lib/degradation/messages";
import { applyAnswerToMessages, coachErrorMessage, emptyResponseMessage, hydratePersistedMessages, persistConversationState, persistMessageEdit } from "@/lib/ai-practice/chat-helpers";

interface UseStreamingChatOptions {
  mode: AIConversationMode;
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
  learningState: UserLearningState | null;
  setLearningState: (s: UserLearningState) => void;
  onStartMission: (missionId: StartMissionArgs["missionId"]) => void;
  onMissionIntentObserved: (intentId: MissionIntentObservedArgs["intentId"]) => void;
  userId: string | null;
}

export function useStreamingChat({
  mode,
  conversationId,
  onConversationCreated,
  learningState,
  setLearningState,
  onStartMission,
  onMissionIntentObserved,
  userId,
}: UseStreamingChatOptions) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExhausted, setQuotaExhausted] = useState(false);

  const messagesRef = useRef<AIMessage[]>([]);
  messagesRef.current = messages;
  const conversationIdRef = useRef<number | null>(conversationId);
  conversationIdRef.current = conversationId;
  const abortRef = useRef<AbortController | null>(null);
  const streamIdRef = useRef(0);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // Last send that failed before any model text landed. A hidden send (starter,
  // session summary) leaves nothing on screen, so retry is the only way back in.
  const lastFailedSendRef = useRef<{ text: string; options?: SendOpts } | null>(null);

  const metrics = useCoachSessionMetrics({ mode, userId });

  const sendMessage = useCallback(async (text: string, options?: SendOpts) => {
    if (!text.trim() || isStreaming) return;
    setError(null);
    setQuotaExhausted(false);
    lastFailedSendRef.current = null;

    metrics.markSessionStarted(conversationIdRef.current);

    const userMsg: AIMessage = { role: "user", content: text.trim(), timestamp: new Date().toISOString(), hidden: options?.hidden, voice: options?.voice };
    const nextMessages = [...messagesRef.current, userMsg];
    setMessages(nextMessages);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const thisId = ++streamIdRef.current;
    setIsStreaming(true);

    const modelMsg: AIMessage = { role: "model", contentParts: [], toolCalls: new Map(), timestamp: new Date().toISOString() };
    setMessages([...nextMessages, modelMsg]);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToWire(nextMessages),
          stream: true,
          missionId: mode.startsWith("mission:") ? mode.slice("mission:".length) : undefined,
          starterId: options?.starterId,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        const errMsg: string = data.error ?? "Failed to get AI response";
        // Our own layered rate limiter (15 req / 60 s per user) sets
        // `retryable`. That is a short throttle, not the provider's daily
        // quota: surface it as a recoverable error the user retries in the
        // same conversation, never the "session over" quota wall.
        if (data.retryable === true) {
          setError(AI_COACH_RATE_LIMITED_MESSAGE);
          setMessages(messagesRef.current.slice(0, -1));
          lastFailedSendRef.current = { text, options };
          return;
        }
        if (res.status === 429 || isQuotaLikeError(errMsg)) {
          setQuotaExhausted(true);
          setMessages(messagesRef.current.slice(0, -1));
          lastFailedSendRef.current = { text, options };
          return;
        }
        throw new Error(publicAiErrorMessage(res.status, errMsg, AI_COACH_TURN_FAILED_MESSAGE));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let truncated = false;
      const state = makeStreamState();

      const flush = () => {
        if (streamIdRef.current !== thisId) return;
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...(copy[copy.length - 1] as Extract<AIMessage, { role: "model" }>),
            contentParts: [...state.parts],
            toolCalls: new Map(state.calls),
          };
          return copy;
        });
      };

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done || streamIdRef.current !== thisId) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          let chunk: StreamChunk;
          try { chunk = JSON.parse(raw); } catch { continue; }

          const result = processChunk(chunk, state, {
            onStartMission,
            onMissionIntentObserved,
            onActionToolResult: (toolCallId, name) => {
              setMessages(prev => [...prev, {
                role: "tool" as const,
                toolCallId,
                name,
                result: { success: true },
                timestamp: new Date().toISOString(),
              }]);
            },
            onError: (errorId, tool, message) => console.error({ errorId, tool, message }),
          });

          if (result === "done") break outer;
          if (result === "done-truncated") { truncated = true; break outer; }
          if (typeof result === "object" && "error" in result) {
            if (isQuotaLikeError(result.error)) {
              setQuotaExhausted(true);
              setMessages(prev => prev.slice(0, -1));
            } else {
              setError(publicAiErrorMessage(undefined, result.error, AI_COACH_TURN_FAILED_MESSAGE));
              setMessages(messagesRef.current.slice(0, -2));
            }
            lastFailedSendRef.current = { text, options };
            break outer;
          }
          if (result === "flush") flush();
        }
      }

      if (streamIdRef.current !== thisId) {
        // Superseded mid-flight: drop this turn's still-empty placeholder bubble.
        setMessages(prev => (prev[prev.length - 1] === modelMsg ? prev.slice(0, -1) : prev));
        return;
      }

      const hasContent = state.parts.length > 0 || state.calls.size > 0;
      if (!hasContent) {
        setMessages(prev => (prev[prev.length - 1] === modelMsg ? prev.slice(0, -1) : prev));
        setError(emptyResponseMessage(truncated));
        lastFailedSendRef.current = { text, options };
        return;
      }

      const finalModelMsg: AIMessage = { role: "model", contentParts: state.parts, toolCalls: state.calls, timestamp: modelMsg.timestamp };
      const finalMessages = [...nextMessages, finalModelMsg];
      setMessages(finalMessages);

      await metrics.noteFirstExercise(state.calls);

      const newId = await persistConversationState({
        userId,
        conversationId: conversationIdRef.current,
        mode,
        text,
        starterId: options?.starterId,
        messages: finalMessages,
        onConversationCreated,
      });
      if (newId) conversationIdRef.current = newId;
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setError(coachErrorMessage(err));
      setMessages(messagesRef.current.slice(0, -2));
      lastFailedSendRef.current = { text, options };
    } finally {
      if (streamIdRef.current === thisId) setIsStreaming(false);
    }
    // `learningState` omitted on purpose: the server resolves it, and including
    // it rebuilt `sendMessage` after every exercise, re-rendering the panel.
  }, [isStreaming, mode, metrics, onStartMission, onMissionIntentObserved, onConversationCreated, userId]);

  const retryLastFailedSend = useCallback(async () => {
    const failed = lastFailedSendRef.current;
    if (!failed || isStreaming) return;
    lastFailedSendRef.current = null;
    await sendMessage(failed.text, failed.options);
  }, [isStreaming, sendMessage]);

  const dismissError = useCallback(() => {
    lastFailedSendRef.current = null;
    setError(null);
    setQuotaExhausted(false);
  }, []);

  const answerToolCall = useCallback((callId: string, result: ExerciseResult) => {
    let resolvedToolName = "exercise_result";
    setMessages(prev => {
      const { updatedMessages, toolName } = applyAnswerToMessages(prev, callId, result);
      resolvedToolName = toolName;
      return updatedMessages;
    });
    setMessages(prev => [...prev, { role: "tool" as const, toolCallId: callId, name: resolvedToolName, result, timestamp: new Date().toISOString() }]);
    metrics.recordExercise(resolvedToolName, result);
    if (learningState) setLearningState(applyExerciseResult(learningState, result));
    if (userId) {
      void persistCoachExerciseResult(userId, resolvedToolName, result).catch(() => {});
    }
  }, [learningState, metrics, setLearningState, userId]);

  const finalizeSession = metrics.finalizeSession;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      finalizeSession();
    };
  }, [finalizeSession]);

  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    finalizeSession();
    lastFailedSendRef.current = null;
    metrics.endSession();
    setMessages([]);
    setError(null);
    setQuotaExhausted(false);
  }, [finalizeSession, metrics]);

  const loadMessages = useCallback((msgs: AIMessage[]) => {
    setMessages(hydratePersistedMessages(msgs));
  }, []);

  const saveTranslation = useCallback((msgIndex: number, translation: string) => {
    setMessages(prev => {
      const copy = [...prev];
      const target = copy[msgIndex];
      if (target && target.role === "model") {
        copy[msgIndex] = { ...target, translation };
      }
      persistMessageEdit(userIdRef.current, conversationIdRef.current, copy);
      return copy;
    });
  }, []);

  const userTurnCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages],
  );

  return {
    messages,
    userTurnCount,
    isStreaming,
    error,
    quotaExhausted,
    sendMessage,
    retryLastFailedSend,
    dismissError,
    answerToolCall,
    saveTranslation,
    resetChat,
    finalizeSession,
    loadMessages,
  };
}
