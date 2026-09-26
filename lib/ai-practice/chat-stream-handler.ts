import type { AIMessage, SendOpts, StreamChunk } from "@/lib/ai-practice/types";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import { messagesToWire } from "@/lib/ai-practice/wire";
import { makeStreamState, processChunk, type StreamState } from "@/lib/ai-practice/stream-processor";
import type {
  MissionIntentObservedArgs,
  StartMissionArgs,
} from "@/lib/ai-practice/tools/registry";
import {
  AI_COACH_RATE_LIMITED_MESSAGE,
  AI_COACH_TURN_FAILED_MESSAGE,
  isQuotaLikeError,
  publicAiErrorMessage,
} from "@/lib/degradation/messages";
import { emptyResponseMessage } from "@/lib/ai-practice/chat-helpers";
import type { AIConversationMode } from "@/lib/types";

export interface StreamCoachResponseParams {
  nextMessages: AIMessage[];
  mode: AIConversationMode;
  options?: SendOpts;
  text: string;
  recentStems: string[];
  practiceContext: unknown;
  controller: AbortController;
  thisId: number;
  streamIdRef: { current: number };
  messagesRef: { current: AIMessage[] };
  modelMsg: AIMessage;
  turnStartedAt: number;
  onStartMission: (missionId: StartMissionArgs["missionId"]) => void;
  onMissionIntentObserved: (intentId: MissionIntentObservedArgs["intentId"]) => void;
  setMessages: React.Dispatch<React.SetStateAction<AIMessage[]>>;
  setError: (err: string | null) => void;
  setQuotaExhausted: (val: boolean) => void;
  lastFailedSendRef: { current: { text: string; options?: SendOpts } | null };
}

export interface StreamCoachResponseResult {
  state: StreamState;
  timeToFirstTextMs: number | null;
}

export async function fetchAndProcessCoachStream({
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
}: StreamCoachResponseParams): Promise<StreamCoachResponseResult | null> {
  let timeToFirstTextMs: number | null = null;

  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messagesToWire(nextMessages),
      stream: true,
      missionId: mode.startsWith("mission:") ? mode.slice("mission:".length) : undefined,
      starterId: options?.starterId,
      coachLanguage: useAICoachStore.getState().coachLanguage ?? undefined,
      recentStems,
      practiceContext,
    }),
    signal: controller.signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    const errMsg: string = data.error ?? "Failed to get AI response";
    if (data.retryable === true) {
      setError(AI_COACH_RATE_LIMITED_MESSAGE);
      setMessages(messagesRef.current.slice(0, -1));
      lastFailedSendRef.current = { text, options };
      return null;
    }
    if (res.status === 429 || isQuotaLikeError(errMsg)) {
      setQuotaExhausted(true);
      setMessages(messagesRef.current.slice(0, -1));
      lastFailedSendRef.current = { text, options };
      return null;
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
    setMessages((prev) => {
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
      try {
        chunk = JSON.parse(raw);
      } catch {
        continue;
      }
      if (chunk.type === "text_delta" && chunk.delta.trim() && timeToFirstTextMs === null) {
        timeToFirstTextMs = Math.round(performance.now() - turnStartedAt);
      }

      const result = processChunk(chunk, state, {
        onStartMission,
        onMissionIntentObserved,
        onActionToolResult: (toolCallId, name) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "tool" as const,
              toolCallId,
              name,
              result: { success: true },
              timestamp: new Date().toISOString(),
            },
          ]);
        },
        onError: (errorId, tool, message) => console.error({ errorId, tool, message }),
      });

      if (result === "done") break outer;
      if (result === "done-truncated") {
        truncated = true;
        break outer;
      }
      if (typeof result === "object" && "error" in result) {
        if (isQuotaLikeError(result.error)) {
          setQuotaExhausted(true);
          setMessages((prev) => prev.slice(0, -1));
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
    setMessages((prev) => (prev[prev.length - 1] === modelMsg ? prev.slice(0, -1) : prev));
    return null;
  }

  const hasContent = state.parts.length > 0 || state.calls.size > 0;
  if (!hasContent) {
    setMessages((prev) => (prev[prev.length - 1] === modelMsg ? prev.slice(0, -1) : prev));
    setError(emptyResponseMessage(truncated));
    lastFailedSendRef.current = { text, options };
    return null;
  }

  return { state, timeToFirstTextMs };
}
