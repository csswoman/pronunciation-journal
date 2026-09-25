import { GoogleGenAI, type Content, type FunctionCallingConfigMode, type FunctionDeclaration } from "@google/genai";
import { TOOL_DECLARATIONS } from "@/lib/ai-practice/tools/registry";
import { FALLBACK_MODELS, getErrorStatus, getFastThinkingConfig, shouldTryNextModel } from "@/lib/gemini/fallback";
import { filterAvailable, markCooldownFromError } from "@/lib/gemini/cooldown";
import { publicAiErrorMessage } from "@/lib/degradation/messages";
import { recordModelFailure, recordModelSuccess, reserveModel } from "@/lib/ai-usage/budget";

type ChatMessage = {
  role: "user" | "model" | "tool";
  content?: string;
  parts?: Array<{
    text?: string;
    functionCall?: {
      name: string;
      args: Record<string, unknown>;
    };
    functionResponse?: {
      name: string;
      response: Record<string, unknown>;
    };
  }>;
  name?: string;
  result?: unknown;
};

export type ChatToolChoice = "any" | "none" | "auto";

export type ChatToolSelection = {
  toolChoice: ChatToolChoice;
  allowedTools?: string[];
};

type StreamLimitOverrides = {
  maxBytes?: number;
  maxChunks?: number;
};

export const STREAM_TIMEOUT_MS = 30_000;
const CHAT_ATTEMPT_TIMEOUT_MS = 14_000;
const CHAT_MAX_ATTEMPTS = 2;

const MAX_STREAM_BYTES = 512_000;
const MAX_STREAM_CHUNKS = 2_000;
// A turn can spend its budget on tool-call args *and* prose (an exercise plus
// its explanation). At 1_024 those turns ran out mid-flight and reached the
// client as an empty response; 2_048 leaves headroom while the byte/chunk
// guards in `streamWithFallback` remain the real ceiling.
const MAX_OUTPUT_TOKENS = 2_048;

// Cast needed: TOOL_DECLARATIONS uses plain string literals for `type` fields,
// but the SDK expects its internal `Type` enum. Runtime values are identical.
const TOOLS_TYPED = TOOL_DECLARATIONS as unknown as FunctionDeclaration[];

export function buildHistory(messages: ChatMessage[]): Content[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return messages.map((m): any => {
    if (m.role === "tool") {
      return {
        role: "user",
        parts: [{ functionResponse: { name: m.name ?? "unknown", response: { result: m.result } } }],
      };
    }
    if (m.parts) return { role: m.role, parts: m.parts };
    return { role: m.role, parts: [{ text: m.content ?? "" }] };
  }) as Content[];
}

export function buildToolConfig(
  toolChoice: ChatToolChoice,
  allowedTools: string[] | undefined
): { functionCallingConfig: { mode: FunctionCallingConfigMode; allowedFunctionNames?: string[] } } {
  if (toolChoice === "none") return { functionCallingConfig: { mode: "NONE" as FunctionCallingConfigMode } };
  if (toolChoice === "any") {
    const allowed = allowedTools?.length ? allowedTools : undefined;
    return { functionCallingConfig: { mode: "ANY" as FunctionCallingConfigMode, ...(allowed ? { allowedFunctionNames: allowed } : {}) } };
  }
  return { functionCallingConfig: { mode: "AUTO" as FunctionCallingConfigMode } };
}

export function encodeChunk(chunk: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`);
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: unknown; code?: unknown; message?: unknown };
  return e.name === "AbortError" || e.code === "ABORT_ERR" || String(e.message ?? "").toLowerCase().includes("aborted");
}

function buildGenerationConfig(
  model: string,
  systemPrompt: string,
  toolChoice: ChatToolChoice,
  allowedTools: string[] | undefined,
  abortSignal?: AbortSignal,
  timeoutMs?: number,
) {
  const declarations = allowedTools?.length
    ? TOOLS_TYPED.filter((tool) => tool.name && allowedTools.includes(tool.name))
    : TOOLS_TYPED;
  const tools = toolChoice !== "none" ? [{ functionDeclarations: declarations }] : undefined;
  const toolConfig = buildToolConfig(toolChoice, allowedTools);
  const thinkingConfig = getFastThinkingConfig(model);
  return {
    systemInstruction: systemPrompt,
    ...(tools ? { tools } : {}),
    toolConfig,
    ...(thinkingConfig ? { thinkingConfig } : {}),
    ...(abortSignal ? { abortSignal } : {}),
    ...(timeoutMs ? { httpOptions: { timeout: timeoutMs } } : {}),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  };
}

export async function streamWithFallback(
  ai: GoogleGenAI,
  systemPrompt: string,
  history: Content[],
  lastMessage: string,
  selection: ChatToolSelection,
  controller: ReadableStreamDefaultController,
  abortSignal: AbortSignal,
  limits: StreamLimitOverrides = {},
  models: readonly string[] = FALLBACK_MODELS,
  feature = "/api/gemini",
): Promise<void> {
  let bytesStreamed = 0;
  let chunksStreamed = 0;
  let closed = false;
  const maxBytes = limits.maxBytes ?? MAX_STREAM_BYTES;
  const maxChunks = limits.maxChunks ?? MAX_STREAM_CHUNKS;
  const deadlineAt = Date.now() + STREAM_TIMEOUT_MS;
  let lastError: unknown;
  let budgetDenied = false;

  function safeClose() {
    if (!closed) { closed = true; controller.close(); }
  }

  function safeEnqueue(chunk: object) {
    if (!closed) controller.enqueue(encodeChunk(chunk));
  }

  if (abortSignal.aborted) {
    safeClose();
    return;
  }

  for (const model of filterAvailable(models).slice(0, CHAT_MAX_ATTEMPTS)) {
    if (abortSignal.aborted) break;
    if (!(await reserveModel(model, feature))) {
      budgetDenied = true;
      continue;
    }

    let annotateTurnName: string | null = null;
    const startedAt = Date.now();
    try {
      const remainingMs = deadlineAt - Date.now();
      if (remainingMs <= 0) break;
      const attemptTimeoutMs = Math.max(1, Math.min(CHAT_ATTEMPT_TIMEOUT_MS, remainingMs));
      const modelSignal = AbortSignal.any([abortSignal, AbortSignal.timeout(attemptTimeoutMs)]);
      const chat = ai.chats.create({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: buildGenerationConfig(model, systemPrompt, selection.toolChoice, selection.allowedTools, modelSignal, attemptTimeoutMs) as any,
        history,
      });

      const result = await chat.sendMessageStream({ message: lastMessage });

      for await (const chunk of result) {
        if (abortSignal.aborted || closed) break;

        chunksStreamed++;
        if (chunksStreamed > maxChunks) {
          safeEnqueue({ type: "done", truncated: true });
          safeClose();
          return;
        }

        for (const candidate of chunk.candidates ?? []) {
          for (const part of candidate.content?.parts ?? []) {
            if (part.text) {
              const encoded = encodeChunk({ type: "text_delta", delta: part.text });
              bytesStreamed += encoded.byteLength;
              if (bytesStreamed > maxBytes) {
                safeEnqueue({ type: "done", truncated: true });
                safeClose();
                return;
              }
              if (!closed) controller.enqueue(encoded);
            }
            if (part.functionCall) {
              const callName = part.functionCall.name ?? "unknown";
              const id = `${callName}_${Date.now()}`;
              if (callName === "annotate_turn") annotateTurnName = callName;
              safeEnqueue({ type: "tool_call_start", id, name: callName });
              safeEnqueue({ type: "tool_call_args_delta", id, delta: JSON.stringify(part.functionCall.args ?? {}) });
              safeEnqueue({ type: "tool_call_end", id });
            }
          }
        }
      }

      // When Gemini called annotate_turn but emitted no prose, send the functionResponse
      // back so it generates a dynamic conversational follow-up in context.
      if (annotateTurnName && bytesStreamed === 0 && !abortSignal.aborted && !closed) {
        const followUp = await chat.sendMessageStream({
          message: [{ functionResponse: { name: annotateTurnName, response: { recorded: true } } }],
        });
        for await (const chunk of followUp) {
          if (abortSignal.aborted || closed) break;
          for (const candidate of chunk.candidates ?? []) {
            for (const part of candidate.content?.parts ?? []) {
              if (part.text) {
                const encoded = encodeChunk({ type: "text_delta", delta: part.text });
                bytesStreamed += encoded.byteLength;
                if (bytesStreamed > maxBytes) {
                  safeEnqueue({ type: "done", truncated: true });
                  safeClose();
                  return;
                }
                if (!closed) controller.enqueue(encoded);
              }
            }
          }
        }
      }

      if (abortSignal.aborted) {
        if (chunksStreamed === 0) {
          safeEnqueue({ type: "error", message: publicAiErrorMessage(504, "timeout") });
        }
        safeClose();
        return;
      }


      safeEnqueue({ type: "done" });
      void recordModelSuccess(model, feature, Date.now() - startedAt);
      safeClose();
      return;
    } catch (err: unknown) {
      lastError = err;
      if (abortSignal.aborted) {
        if (chunksStreamed === 0) {
          safeEnqueue({ type: "error", message: publicAiErrorMessage(504, "timeout") });
        }
        safeClose();
        return;
      }
      markCooldownFromError(model, err);
      void recordModelFailure(model, feature, getErrorStatus(err), String((err as { name?: unknown })?.name ?? "error"), Date.now() - startedAt);
      if (bytesStreamed > 0 || Date.now() >= deadlineAt) break;
      if (isAbortError(err)) continue;
      if (!shouldTryNextModel(err)) break;
    }
  }

  const status = Date.now() >= deadlineAt
    ? 504
    : budgetDenied && !lastError
      ? 429
      : getErrorStatus(lastError) ?? 503;
  safeEnqueue({ type: "error", message: publicAiErrorMessage(status, String(lastError ?? "unavailable")) });
  safeClose();
}

export async function sendMessageWithFallback(
  ai: GoogleGenAI,
  systemPrompt: string,
  history: Content[],
  lastMessage: string,
  selection: ChatToolSelection,
  models: readonly string[] = FALLBACK_MODELS,
  feature = "/api/gemini",
): Promise<string> {
  let lastError: unknown;
  let budgetDenied = false;
  const deadlineAt = Date.now() + 25_000;

  for (const model of filterAvailable(models).slice(0, CHAT_MAX_ATTEMPTS)) {
    if (Date.now() >= deadlineAt) break;
    if (!(await reserveModel(model, feature))) {
      budgetDenied = true;
      continue;
    }
    const startedAt = Date.now();
    try {
      const remainingMs = deadlineAt - Date.now();
      if (remainingMs <= 0) break;
      const attemptTimeoutMs = Math.max(1, Math.min(CHAT_ATTEMPT_TIMEOUT_MS, remainingMs));
      const modelSignal = AbortSignal.timeout(attemptTimeoutMs);
      const chat = ai.chats.create({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: buildGenerationConfig(model, systemPrompt, selection.toolChoice, selection.allowedTools, modelSignal, attemptTimeoutMs) as any,
        history,
      });

      const result = await chat.sendMessage({ message: lastMessage });
      const responseText = result.text;

      if (!responseText) throw new Error("Empty response from AI");
      void recordModelSuccess(model, feature, Date.now() - startedAt);
      return responseText;
    } catch (err: unknown) {
      lastError = err;
      markCooldownFromError(model, err);
      void recordModelFailure(model, feature, getErrorStatus(err), String((err as { name?: unknown })?.name ?? "error"), Date.now() - startedAt);
      if (Date.now() >= deadlineAt) break;
      if (!shouldTryNextModel(err)) throw err;
    }
  }

  if (budgetDenied && !lastError) {
    throw Object.assign(new Error("Daily AI model budget exhausted"), { status: 429 });
  }
  if (Date.now() >= deadlineAt) {
    throw Object.assign(new Error("Gemini chat timed out after 25000ms"), { status: 504 });
  }
  throw lastError || new Error("All fallback models failed");
}
