"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AIMessage, ToolCall, ContentPart, StreamChunk, ExerciseResult } from "@/lib/ai-practice/types";
import { serializeMessage, deserializeMessage } from "@/lib/ai-practice/types";
import { BASE_TUTOR_PROMPT } from "@/lib/ai-practice/prompts";
import { detectIntent, intentToToolConfig } from "@/lib/ai-practice/intent-detection";
import { isValidToolName, parseToolArgs, isExerciseTool } from "@/lib/ai-practice/tools/registry";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import { compactState, applyExerciseResult, type UserLearningState } from "@/lib/ai-practice/learning-state";
import { saveConversation, updateConversation, saveAIWord, getAIWords, deleteAIWord } from "@/lib/ai-db";
import type { AISavedWord, Difficulty } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SaveWordData {
  word: string;
  meaning: string;
  difficulty: Difficulty;
  context: string;
}

interface UseAIPracticeReturn {
  messages: AIMessage[];
  isStreaming: boolean;
  error: string | null;
  savedWords: AISavedWord[];
  wordToSave: { word: string; context: string } | null;
  sendMessage: (text: string) => Promise<void>;
  answerToolCall: (callId: string, result: ExerciseResult) => void;
  openSaveWordModal: (word: string, context: string) => void;
  closeSaveWordModal: () => void;
  confirmSaveWord: (data: SaveWordData) => Promise<void>;
  deleteSavedWord: (id: number) => Promise<void>;
  loadSavedWords: () => Promise<void>;
  resetSession: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSystemPrompt(learningState: UserLearningState | null): string {
  if (!learningState) return BASE_TUTOR_PROMPT;
  return `${BASE_TUTOR_PROMPT}\n\n${compactState(learningState)}`;
}

function lastModelHadExercise(messages: AIMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "model") {
      return msg.toolCalls.size > 0 && [...msg.toolCalls.values()].some(tc => isExerciseTool(tc.name as never));
    }
  }
  return false;
}

// Convert AIMessage[] to the wire format the API expects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function messagesToWire(messages: AIMessage[]): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return messages.map((m): any => {
    if (m.role === "user") return { role: "user", content: m.content };
    if (m.role === "tool") {
      return { role: "tool", toolCallId: m.toolCallId, name: m.name, result: m.result };
    }
    // model — convert contentParts + toolCalls to parts array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];
    for (const part of m.contentParts) {
      if (part.type === "text") {
        parts.push({ text: part.text });
      } else {
        const tc = m.toolCalls.get(part.callId);
        if (tc) {
          parts.push({ functionCall: { name: tc.name, args: tc.args } });
        }
      }
    }
    return { role: "model", parts };
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAIPractice(): UseAIPracticeReturn {
  const { user } = useAuth();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<AISavedWord[]>([]);
  const [wordToSave, setWordToSave] = useState<{ word: string; context: string } | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [learningState, setLearningState] = useState<UserLearningState | null>(null);

  const messagesRef = useRef<AIMessage[]>([]);
  messagesRef.current = messages;

  const abortRef = useRef<AbortController | null>(null);
  const streamIdRef = useRef(0);

  // Load learning state + saved words on mount
  useEffect(() => {
    loadSavedWords();
    if (user?.id) {
      getUserLearningState(user.id).then(setLearningState).catch(() => {});
    }
  }, [user?.id]);

  const loadSavedWords = useCallback(async () => {
    const words = await getAIWords();
    setSavedWords(words);
  }, []);

  // ── Streaming send ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setError(null);

    const userMsg: AIMessage = { role: "user", content: text.trim(), timestamp: new Date().toISOString() };
    const nextMessages = [...messagesRef.current, userMsg];
    setMessages(nextMessages);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const thisId = ++streamIdRef.current;

    setIsStreaming(true);

    // Detect intent → tool config
    const intent = detectIntent(text, lastModelHadExercise(messagesRef.current));
    const { toolChoice, allowedTools } = intentToToolConfig(intent);
    const systemPrompt = buildSystemPrompt(learningState);

    // Optimistic model message
    const modelMsg: AIMessage = {
      role: "model",
      contentParts: [],
      toolCalls: new Map(),
      timestamp: new Date().toISOString(),
    };
    setMessages([...nextMessages, modelMsg]);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToWire(nextMessages),
          systemPrompt,
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

      // Mutable working copy — we'll flush to React state incrementally
      let workingParts: ContentPart[] = [];
      const workingCalls = new Map<string, ToolCall>();
      const argsAccum = new Map<string, string>();

      const flushToState = () => {
        if (streamIdRef.current !== thisId) return;
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...(copy[copy.length - 1] as Extract<AIMessage, { role: "model" }>),
            contentParts: [...workingParts],
            toolCalls: new Map(workingCalls),
          };
          return copy;
        });
      };

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (streamIdRef.current !== thisId) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let chunk: StreamChunk;
          try { chunk = JSON.parse(raw); } catch { continue; }

          switch (chunk.type) {
            case "text_delta": {
              const lastPart = workingParts[workingParts.length - 1];
              if (lastPart?.type === "text") {
                (lastPart as { type: "text"; text: string }).text += chunk.delta;
              } else {
                workingParts = [...workingParts, { type: "text", text: chunk.delta }];
              }
              flushToState();
              break;
            }
            case "tool_call_start": {
              workingCalls.set(chunk.id, {
                id: chunk.id,
                name: chunk.name,
                args: {},
                status: "pending",
              });
              argsAccum.set(chunk.id, "");
              workingParts = [...workingParts, { type: "tool_call", callId: chunk.id }];
              flushToState();
              break;
            }
            case "tool_call_args_delta": {
              argsAccum.set(chunk.id, (argsAccum.get(chunk.id) ?? "") + chunk.delta);
              break;
            }
            case "tool_call_end": {
              const accum = argsAccum.get(chunk.id) ?? "{}";
              const tc = workingCalls.get(chunk.id);
              if (tc && isValidToolName(tc.name)) {
                try {
                  const rawArgs = JSON.parse(accum);
                  const args = parseToolArgs(tc.name, rawArgs);
                  workingCalls.set(chunk.id, { ...tc, args, status: "rendered" });
                } catch (err) {
                  const errorId = crypto.randomUUID();
                  console.error({ errorId, tool: tc.name, error: (err as Error).message });
                  workingCalls.set(chunk.id, { ...tc, status: "error", error: (err as Error).message, errorId });
                }
              } else if (tc) {
                const errorId = crypto.randomUUID();
                workingCalls.set(chunk.id, { ...tc, status: "error", error: `Unknown tool: ${tc.name}`, errorId });
              }
              flushToState();
              break;
            }
            case "done":
              break outer;
          }
        }
      }

      if (streamIdRef.current !== thisId) return;

      // Final committed model message
      const finalModelMsg: AIMessage = {
        role: "model",
        contentParts: workingParts,
        toolCalls: workingCalls,
        timestamp: modelMsg.timestamp,
      };

      const finalMessages = [...nextMessages, finalModelMsg];
      setMessages(finalMessages);

      // Persist
      const now = new Date().toISOString();
      if (conversationId) {
        await updateConversation(conversationId, {
          messages: finalMessages.map(m =>
            m.role === "model" ? serializeMessage(m) : m
          ) as never,
          updatedAt: now,
        });
      } else {
        const title = text.slice(0, 60);
        const id = await saveConversation({
          templateId: "free-conversation",
          title,
          messages: finalMessages.map(m =>
            m.role === "model" ? serializeMessage(m) : m
          ) as never,
          createdAt: now,
          updatedAt: now,
        });
        setConversationId(id);
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "An error occurred.");
      // Remove optimistic messages
      setMessages(messagesRef.current.slice(0, -2));
    } finally {
      if (streamIdRef.current === thisId) setIsStreaming(false);
    }
  }, [isStreaming, learningState, conversationId]);

  // ── Tool answer ─────────────────────────────────────────────────────────────

  const answerToolCall = useCallback((callId: string, result: ExerciseResult) => {
    setMessages(prev => {
      const copy = [...prev];
      // Update the tool call status in the last model message
      for (let i = copy.length - 1; i >= 0; i--) {
        const msg = copy[i];
        if (msg.role === "model" && msg.toolCalls.has(callId)) {
          const newCalls = new Map(msg.toolCalls);
          const tc = newCalls.get(callId)!;
          newCalls.set(callId, { ...tc, status: "answered", result });
          copy[i] = { ...msg, toolCalls: newCalls };
          break;
        }
      }
      return copy;
    });

    // Append tool result message for the model's context
    const toolMsg: AIMessage = {
      role: "tool",
      toolCallId: callId,
      name: "exercise_result",
      result,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, toolMsg]);

    // Update learning state
    if (learningState) {
      const newState = applyExerciseResult(learningState, result);
      setLearningState(newState);
    }
  }, [learningState]);

  // ── Save word ───────────────────────────────────────────────────────────────

  const openSaveWordModal = useCallback((word: string, context: string) => {
    setWordToSave({ word, context });
  }, []);

  const closeSaveWordModal = useCallback(() => setWordToSave(null), []);

  const confirmSaveWord = useCallback(async (data: SaveWordData) => {
    const wordData: Omit<AISavedWord, "id"> = {
      word: data.word.toLowerCase().trim(),
      meaning: data.meaning,
      difficulty: data.difficulty,
      context: data.context,
      conversationId: conversationId ?? 0,
      savedAt: new Date().toISOString(),
    };
    const id = await saveAIWord(wordData);
    setSavedWords(prev => [{ ...wordData, id }, ...prev]);
    setWordToSave(null);
  }, [conversationId]);

  const deleteSavedWord = useCallback(async (id: number) => {
    await deleteAIWord(id);
    setSavedWords(prev => prev.filter(w => w.id !== id));
  }, []);

  const resetSession = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    setError(null);
    setWordToSave(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    savedWords,
    wordToSave,
    sendMessage,
    answerToolCall,
    openSaveWordModal,
    closeSaveWordModal,
    confirmSaveWord,
    deleteSavedWord,
    loadSavedWords,
    resetSession,
  };
}
