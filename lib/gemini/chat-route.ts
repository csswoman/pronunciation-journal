import { GoogleGenAI, type Content, type FunctionCallingConfigMode, type FunctionDeclaration } from "@google/genai";
import { TOOL_DECLARATIONS } from "@/lib/ai-practice/tools/registry";
import { FALLBACK_MODELS, shouldTryNextModel } from "@/lib/gemini/fallback";
import { publicAiErrorMessage } from "@/lib/degradation/messages";

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

const MAX_STREAM_BYTES = 512_000;
const MAX_STREAM_CHUNKS = 2_000;
const MAX_OUTPUT_TOKENS = 1_024;

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
  if (toolChoice === "none") {
    return { functionCallingConfig: { mode: "NONE" as FunctionCallingConfigMode } };
  }
  if (toolChoice === "any") {
    const allowed = allowedTools?.length ? allowedTools : undefined;
    return {
      functionCallingConfig: {
        mode: "ANY" as FunctionCallingConfigMode,
        ...(allowed ? { allowedFunctionNames: allowed } : {}),
      },
    };
  }
  return { functionCallingConfig: { mode: "AUTO" as FunctionCallingConfigMode } };
}

export function encodeChunk(chunk: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`);
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: unknown; code?: unknown; message?: unknown };
  return (
    e.name === "AbortError" ||
    e.code === "ABORT_ERR" ||
    String(e.message ?? "").toLowerCase().includes("aborted")
  );
}

function buildGenerationConfig(
  systemPrompt: string,
  toolChoice: ChatToolChoice,
  allowedTools: string[] | undefined
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any = toolChoice !== "none" ? [{ functionDeclarations: TOOLS_TYPED }] : undefined;
  const toolConfig = buildToolConfig(toolChoice, allowedTools);
  return {
    systemInstruction: systemPrompt,
    ...(tools ? { tools } : {}),
    toolConfig,
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
  limits: StreamLimitOverrides = {}
): Promise<void> {
  let bytesStreamed = 0;
  let chunksStreamed = 0;
  let closed = false;
  const maxBytes = limits.maxBytes ?? MAX_STREAM_BYTES;
  const maxChunks = limits.maxChunks ?? MAX_STREAM_CHUNKS;

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

  for (const model of FALLBACK_MODELS) {
    if (abortSignal.aborted) break;

    try {
      const chat = ai.chats.create({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: buildGenerationConfig(systemPrompt, selection.toolChoice, selection.allowedTools) as any,
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
              safeEnqueue({ type: "tool_call_start", id, name: callName });
              safeEnqueue({ type: "tool_call_args_delta", id, delta: JSON.stringify(part.functionCall.args ?? {}) });
              safeEnqueue({ type: "tool_call_end", id });
            }
          }
        }
      }

      if (abortSignal.aborted) { safeClose(); return; }

      safeEnqueue({ type: "done" });
      safeClose();
      return;
    } catch (err: unknown) {
      if (abortSignal.aborted || isAbortError(err)) { safeClose(); return; }
      if (!shouldTryNextModel(err)) break;
    }
  }

  safeEnqueue({ type: "error", message: publicAiErrorMessage(429, "quota exhausted") });
  safeClose();
}

export async function sendMessageWithFallback(
  ai: GoogleGenAI,
  systemPrompt: string,
  history: Content[],
  lastMessage: string,
  selection: ChatToolSelection
): Promise<string> {
  let lastError: unknown;

  for (const model of FALLBACK_MODELS) {
    try {
      const chat = ai.chats.create({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: buildGenerationConfig(systemPrompt, selection.toolChoice, selection.allowedTools) as any,
        history,
      });

      const result = await chat.sendMessage({ message: lastMessage });
      const responseText = result.text;

      if (!responseText) throw new Error("Empty response from AI");
      return responseText;
    } catch (err: unknown) {
      lastError = err;
      if (!shouldTryNextModel(err)) throw err;
    }
  }

  throw lastError || new Error("All fallback models failed");
}
