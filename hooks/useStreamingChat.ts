"use client";

import { useState, useCallback, useRef } from "react";
import type { AIMessage, StreamChunk, ExerciseResult } from "@/lib/ai-practice/types";
import { serializeMessage } from "@/lib/ai-practice/types";
import { detectIntent, intentToToolConfig } from "@/lib/ai-practice/intent-detection";
import { applyExerciseResult, type UserLearningState } from "@/lib/ai-practice/learning-state";
import { saveConversation, updateConversation } from "@/lib/ai-db";
import { buildSystemPrompt, lastModelHadExercise, messagesToWire, extractLastTopic } from "@/lib/ai-practice/wire";
import { logEvent } from "@/lib/ai-practice/events";
import { makeStreamState, processChunk } from "@/lib/ai-practice/stream-processor";
import type { StartRoleplayArgs } from "@/lib/ai-practice/tools/registry";
import type { AIConversationMode } from "@/lib/types";

function getOrCreateDeviceId(): string {
  const key = "ai_practice_device_id";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

interface UseStreamingChatOptions {
  mode: AIConversationMode;
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
  learningState: UserLearningState | null;
  setLearningState: (s: UserLearningState) => void;
  onSaveWord: (word: string, context: string) => void;
  onStartRoleplay: (scenario: StartRoleplayArgs["scenario"]) => void;
}

export function useStreamingChat({
  mode,
  conversationId,
  onConversationCreated,
  learningState,
  setLearningState,
  onSaveWord,
  onStartRoleplay,
}: UseStreamingChatOptions) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef<AIMessage[]>([]);
  messagesRef.current = messages;
  const abortRef = useRef<AbortController | null>(null);
  const streamIdRef = useRef(0);
  const lastTopicRef = useRef<string | undefined>(undefined);
  const sessionStartedRef = useRef(false);
  const sessionStartAtRef = useRef(0);
  const exercisesCompletedRef = useRef(0);
  const correctCountRef = useRef(0);
  const firstExerciseLoggedRef = useRef(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setError(null);

    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true;
      sessionStartAtRef.current = Date.now();
      logEvent("session_started", { mode, conversationId: conversationId ?? undefined }).catch(() => {});
    }

    const userMsg: AIMessage = { role: "user", content: text.trim(), timestamp: new Date().toISOString() };
    const nextMessages = [...messagesRef.current, userMsg];
    setMessages(nextMessages);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const thisId = ++streamIdRef.current;
    setIsStreaming(true);

    const intent = detectIntent(text, lastModelHadExercise(messagesRef.current));
    const { toolChoice, allowedTools } = intentToToolConfig(intent);

    const modelMsg: AIMessage = { role: "model", contentParts: [], toolCalls: new Map(), timestamp: new Date().toISOString() };
    setMessages([...nextMessages, modelMsg]);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToWire(nextMessages),
          systemPrompt: buildSystemPrompt(learningState, lastTopicRef.current),
          toolChoice,
          allowedTools,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to get AI response");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
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
            onSaveWord,
            onStartRoleplay,
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
          if (result === "flush") flush();
        }
      }

      if (streamIdRef.current !== thisId) return;

      const finalModelMsg: AIMessage = { role: "model", contentParts: state.parts, toolCalls: state.calls, timestamp: modelMsg.timestamp };
      const finalMessages = [...nextMessages, finalModelMsg];
      setMessages(finalMessages);

      if (!firstExerciseLoggedRef.current && state.calls.size > 0) {
        const { isExerciseTool } = await import("@/lib/ai-practice/tools/registry");
        const hasExercise = [...state.calls.values()].some(tc => isExerciseTool(tc.name as never));
        if (hasExercise) {
          firstExerciseLoggedRef.current = true;
          logEvent("time_to_first_exercise", { timeMs: Date.now() - sessionStartAtRef.current }).catch(() => {});
        }
      }

      const now = new Date().toISOString();
      const serialized = finalMessages.map(m => m.role === "model" ? serializeMessage(m) : m) as never;
      if (conversationId) {
        await updateConversation(conversationId, { messages: serialized, updatedAt: now });
      } else {
        const id = await saveConversation({
          templateId: "free-conversation",
          mode,
          title: text.slice(0, 60),
          messages: serialized,
          deviceId: getOrCreateDeviceId(),
          createdAt: now,
          updatedAt: now,
        });
        onConversationCreated(id);
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "An error occurred.");
      setMessages(messagesRef.current.slice(0, -2));
    } finally {
      if (streamIdRef.current === thisId) setIsStreaming(false);
    }
  }, [isStreaming, mode, conversationId, learningState, onSaveWord, onStartRoleplay, onConversationCreated]);

  const answerToolCall = useCallback((callId: string, result: ExerciseResult) => {
    let toolName = "exercise_result";
    setMessages(prev => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        const msg = copy[i];
        if (msg.role === "model" && msg.toolCalls.has(callId)) {
          const newCalls = new Map(msg.toolCalls);
          const tc = newCalls.get(callId)!;
          toolName = tc.name;
          newCalls.set(callId, { ...tc, status: "answered", result });
          copy[i] = { ...msg, toolCalls: newCalls };
          break;
        }
      }
      return copy;
    });
    setMessages(prev => [...prev, { role: "tool" as const, toolCallId: callId, name: toolName, result, timestamp: new Date().toISOString() }]);
    if (result.topic) lastTopicRef.current = result.topic;
    exercisesCompletedRef.current += 1;
    if (result.correct) correctCountRef.current += 1;
    if (learningState) setLearningState(applyExerciseResult(learningState, result));
  }, [learningState, setLearningState]);

  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    if (sessionStartedRef.current) {
      const completed = exercisesCompletedRef.current;
      logEvent("session_ended", {
        mode,
        exercisesCompleted: completed,
        correctRate: completed > 0 ? correctCountRef.current / completed : 0,
        durationMs: Date.now() - sessionStartAtRef.current,
      }).catch(() => {});
      sessionStartedRef.current = false;
      exercisesCompletedRef.current = 0;
      correctCountRef.current = 0;
      firstExerciseLoggedRef.current = false;
    }
    setMessages([]);
    setError(null);
  }, [mode]);

  const loadMessages = useCallback((msgs: AIMessage[]) => {
    setMessages(msgs);
  }, []);

  return { messages, isStreaming, error, sendMessage, answerToolCall, resetChat, loadMessages };
}
