"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { AIMessage, ExerciseResult, SendOpts } from "@/lib/ai-practice/types";
import { applyExerciseResult, type UserLearningState } from "@/lib/ai-practice/learning-state";
import type {
  MissionIntentObservedArgs,
  StartMissionArgs,
} from "@/lib/ai-practice/tools/registry";
import { persistCoachExerciseResult } from "@/lib/ai-practice/coach-progress";
import { logEvent } from "@/lib/ai-practice/events";
import { useCoachSessionMetrics } from "./useCoachSessionMetrics";
import type { AIConversationMode } from "@/lib/types";
import {
  applyAnswerToMessages,
  coachErrorMessage,
  hydratePersistedMessages,
  persistConversationState,
  persistMessageEdit,
} from "@/lib/ai-practice/chat-helpers";
import { getRecentCoachStems, saveCoachSeenItems } from "@/lib/ai-practice/coach-seen-items";
import { rotationForCoachRequest, type PracticeAngle } from "@/lib/ai-practice/practice-rotation";
import { useCoachErrorRecurrence } from "./useCoachErrorRecurrence";
import { useCoachBankSet } from "./useCoachBankSet";
import { detectIntent } from "@/lib/ai-practice/intent-detection";
import { fetchAndProcessCoachStream } from "@/lib/ai-practice/chat-stream-handler";

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
  const anonymousAnglesRef = useRef<PracticeAngle[]>([]);

  // Last send that failed before model text landed; hidden sends need retry.
  const lastFailedSendRef = useRef<{ text: string; options?: SendOpts } | null>(null);

  const metrics = useCoachSessionMetrics({ mode, userId });
  const { recordIfNeeded, reset: resetErrorRecurrence, restoreFromMessages: restoreErrorRecurrence } = useCoachErrorRecurrence();
  const { tryServeBankSet } = useCoachBankSet();

  const sendMessage = useCallback(async (text: string, options?: SendOpts) => {
    if (!text.trim() || isStreaming) return;
    setError(null);
    setQuotaExhausted(false);
    lastFailedSendRef.current = null;

    metrics.markSessionStarted(conversationIdRef.current);

    const userMsg: AIMessage = { role: "user", content: text.trim(), timestamp: new Date().toISOString(), hidden: options?.hidden, voice: options?.voice, marker: options?.marker };
    const nextMessages = [...messagesRef.current, userMsg];
    setMessages(nextMessages);
    const isExerciseRequest = detectIntent(text).type === "exercise_request";
    if (isExerciseRequest && !options?.hidden && !options?.starterId && !mode.startsWith("mission:")) {
      const bankMsg = await tryServeBankSet({ userId: userIdRef.current });
      if (bankMsg) {
        const finalMessages = [...nextMessages, bankMsg];
        setMessages(finalMessages);
        await metrics.noteFirstExercise(bankMsg.toolCalls);
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
        return;
      }
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestTimeout = window.setTimeout(() => {
      controller.abort(new DOMException("La respuesta de IA tardó demasiado.", "TimeoutError"));
    }, 35_000);
    const thisId = ++streamIdRef.current;
    const turnStartedAt = performance.now();
    setIsStreaming(true);

    const modelMsg: AIMessage = { role: "model", contentParts: [], toolCalls: new Map(), timestamp: new Date().toISOString() };
    setMessages([...nextMessages, modelMsg]);

    try {
      const recentStems = userIdRef.current
        ? await getRecentCoachStems(userIdRef.current).catch(() => [])
        : [];
      const practiceContext = await rotationForCoachRequest({
        text, isStarter: options?.starterId !== undefined,
        isMission: mode.startsWith("mission:"), userId: userIdRef.current,
        anonymousAngles: anonymousAnglesRef.current,
      });
      if (practiceContext && !userIdRef.current) {
        anonymousAnglesRef.current = [...anonymousAnglesRef.current, practiceContext.angle].slice(-3);
      }

      const streamResult = await fetchAndProcessCoachStream({
        nextMessages,
        mode,
        options,
        text,
        recentStems,
        practiceContext,
        controller,
        thisId,
        streamIdRef,
        messagesRef,
        modelMsg,
        turnStartedAt,
        onStartMission,
        onMissionIntentObserved,
        setMessages,
        setError,
        setQuotaExhausted,
        lastFailedSendRef,
      });

      if (!streamResult) return;

      const { state, timeToFirstTextMs } = streamResult;

      let finalModelMsg: Extract<AIMessage, { role: "model" }> = {
        role: "model",
        contentParts: state.parts,
        toolCalls: state.calls,
        timestamp: modelMsg.timestamp,
      };
      let finalMessages = [...nextMessages, finalModelMsg];
      setMessages(finalMessages);
      void logEvent("coach_turn_latency", {
        mode,
        timeToFirstTextMs,
        totalMs: Math.round(performance.now() - turnStartedAt),
      }, userId).catch(() => {});

      await metrics.noteFirstExercise(state.calls);
      if (userIdRef.current) {
        void saveCoachSeenItems(userIdRef.current, state.calls.values()).catch(() => {});
      }
      const recurrenceFeedback = await recordIfNeeded(userIdRef.current, state.calls, options?.hidden);
      if (recurrenceFeedback) {
        finalModelMsg = { ...finalModelMsg, errorRecurrence: recurrenceFeedback };
        finalMessages = [...nextMessages, finalModelMsg];
        setMessages(finalMessages);
      }

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
      window.clearTimeout(requestTimeout);
      if (streamIdRef.current === thisId) setIsStreaming(false);
    }
  }, [isStreaming, mode, metrics, onStartMission, onMissionIntentObserved, onConversationCreated, recordIfNeeded, tryServeBankSet, userId]);

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
    resetErrorRecurrence();
    metrics.endSession();
    setMessages([]);
    setError(null);
    setQuotaExhausted(false);
  }, [finalizeSession, metrics, resetErrorRecurrence]);

  const loadMessages = useCallback((msgs: AIMessage[]) => {
    const hydrated = hydratePersistedMessages(msgs);
    restoreErrorRecurrence(hydrated);
    setMessages(hydrated);
  }, [restoreErrorRecurrence]);

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
