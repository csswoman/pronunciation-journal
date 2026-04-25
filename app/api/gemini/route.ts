import { GoogleGenAI, type Content, type FunctionCallingConfigMode, type FunctionDeclaration } from "@google/genai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser, rateLimit, validateBody, SECURE_HEADERS } from "@/lib/api/guards";
import { buildServerPrompt, type PromptKey } from "@/lib/api/prompts";
import { detectIntent, intentToToolConfig } from "@/lib/ai-practice/intent-detection";
import { TOOL_DECLARATIONS } from "@/lib/ai-practice/tools/registry";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Cast needed: TOOL_DECLARATIONS uses plain string literals for `type` fields,
// but the SDK expects its internal `Type` enum. Runtime values are identical.
const TOOLS_TYPED = TOOL_DECLARATIONS as unknown as FunctionDeclaration[];

// ---------------------------------------------------------------------------
// Request schema — all strings bounded, unknown keys rejected
// ---------------------------------------------------------------------------

const MessagePartSchema = z.object({
  text: z.string().max(8_000).optional(),
  functionCall: z.object({
    name: z.string().max(100),
    args: z.record(z.string(), z.unknown()),
  }).strict().optional(),
  functionResponse: z.object({
    name: z.string().max(100),
    response: z.record(z.string(), z.unknown()),
  }).strict().optional(),
}).strict();

const MessageSchema = z.object({
  role: z.enum(["user", "model", "tool"]),
  content: z.string().max(8_000).optional(),
  parts: z.array(MessagePartSchema).max(20).optional(),
  toolCallId: z.string().max(200).optional(),
  name: z.string().max(100).optional(),
  result: z.unknown().optional(),
}).strict();

const SoundSchema = z.object({
  id: z.string().max(50),
  ipa: z.string().max(20),
  type: z.string().max(20),
  category: z.string().max(50).nullable(),
  example: z.string().max(100).nullable(),
}).strict();

const GeminiRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  /**
   * Named key resolved to a server-defined system prompt.
   * Closed enum — any value outside this list is rejected with 400.
   * The client cannot supply raw prompt text.
   */
  promptKey: z.enum(["default", "admin-seed"] satisfies [PromptKey, ...PromptKey[]]).optional().default("default"),
  /** Required when promptKey = "admin-seed" */
  activeTab: z.string().max(50).optional(),
  /**
   * Required when promptKey = "admin-seed".
   * Capped at 50 entries to prevent oversized prompt injection via the sounds list.
   */
  sounds: z.array(SoundSchema).max(50).optional(),
  stream: z.boolean().optional().default(false),
}).strict();

type GeminiRequest = z.infer<typeof GeminiRequestSchema>;

// ---------------------------------------------------------------------------
// Model configuration — server-controlled
// ---------------------------------------------------------------------------

/** Kill streaming connections that haven't completed within this window. */
const STREAM_TIMEOUT_MS = 30_000;

/** Hard cap on total bytes forwarded to the client per stream. ~512 KB. */
const MAX_STREAM_BYTES = 512_000;

/** Hard cap on number of SSE chunks — guards against many-small-chunks attacks. */
const MAX_STREAM_CHUNKS = 2_000;

/** Hard cap on model output — prevents runaway token consumption. */
const MAX_OUTPUT_TOKENS = 1_024;

const ENABLE_PREVIEW_MODELS = process.env.GEMINI_ENABLE_PREVIEW_MODELS === "true";
const BASE_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-flash-latest",
] as const;
const PREVIEW_MODELS = ["gemini-3.1-flash-lite-preview"] as const;
const FALLBACK_MODELS = ENABLE_PREVIEW_MODELS
  ? [...BASE_MODELS, ...PREVIEW_MODELS]
  : [...BASE_MODELS];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const maybe = err as { status?: unknown; statusCode?: unknown };
  if (typeof maybe.status === "number") return maybe.status;
  if (typeof maybe.statusCode === "number") return maybe.statusCode;
  return undefined;
}

function shouldTryNextModel(err: unknown): boolean {
  const status = getErrorStatus(err);
  if (status === 400 || status === 401 || status === 403) return false;
  if (status === 404 || status === 408 || status === 409 || status === 425 || status === 429) return true;
  if (typeof status === "number" && status >= 500) return true;
  const message = String((err as { message?: unknown })?.message ?? "").toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("quota") ||
    message.includes("rate") ||
    message.includes("resource exhausted") ||
    message.includes("unavailable") ||
    message.includes("timeout") ||
    message.includes("internal")
  );
}

function buildHistory(messages: GeminiRequest["messages"]): Content[] {
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

function buildToolConfig(
  toolChoice: "any" | "none" | "auto",
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

function encodeChunk(chunk: object): Uint8Array {
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

async function streamWithFallback(
  ai: GoogleGenAI,
  systemPrompt: string,
  history: Content[],
  lastMessage: string,
  toolChoice: "any" | "none" | "auto",
  allowedTools: string[] | undefined,
  controller: ReadableStreamDefaultController,
  abortSignal: AbortSignal
): Promise<void> {
  let lastError: unknown;
  let bytesStreamed = 0;
  let chunksStreamed = 0;
  // Single flag prevents double-close from concurrent abort + loop exit paths
  let closed = false;

  function safeClose() {
    if (!closed) { closed = true; controller.close(); }
  }

  function safeEnqueue(chunk: object) {
    if (!closed) controller.enqueue(encodeChunk(chunk));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any = toolChoice !== "none" ? [{ functionDeclarations: TOOLS_TYPED }] : undefined;
  const toolConfig = buildToolConfig(toolChoice, allowedTools);

  for (const model of FALLBACK_MODELS) {
    if (abortSignal.aborted) break;

    try {
      const chat = ai.chats.create({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: { systemInstruction: systemPrompt, ...(tools ? { tools } : {}), toolConfig, maxOutputTokens: MAX_OUTPUT_TOKENS } as any,
        history,
      });

      const result = await chat.sendMessageStream({ message: lastMessage });

      for await (const chunk of result) {
        if (abortSignal.aborted || closed) break;

        chunksStreamed++;
        if (chunksStreamed > MAX_STREAM_CHUNKS) {
          safeEnqueue({ type: "done", truncated: true });
          safeClose();
          return;
        }

        for (const candidate of chunk.candidates ?? []) {
          for (const part of candidate.content?.parts ?? []) {
            if (part.text) {
              const encoded = encodeChunk({ type: "text_delta", delta: part.text });
              bytesStreamed += encoded.byteLength;
              if (bytesStreamed > MAX_STREAM_BYTES) {
                // Graceful truncation — client receives a valid terminal event
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

      // Aborted mid-stream — close cleanly, no error chunk
      if (abortSignal.aborted) { safeClose(); return; }

      safeEnqueue({ type: "done" });
      safeClose();
      return;
    } catch (err: unknown) {
      // Timeout or client disconnect — close cleanly, don't retry
      if (abortSignal.aborted || isAbortError(err)) { safeClose(); return; }
      lastError = err;
      console.warn("[stream] model failed", { model, message: String((err as { message?: unknown })?.message) });
      if (!shouldTryNextModel(err)) break;
    }
  }

  safeEnqueue({ type: "error", message: String((lastError as { message?: unknown })?.message ?? "All models failed") });
  safeClose();
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<Response> {
  // 1. Auth — reject before touching the body
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  // 2. Rate limit — 15 req/min per user, keyed per endpoint so routes are independent
  const { limited, error: rateLimitError } = rateLimit(`/api/gemini:${user.id}`, {
    meta: { endpoint: "/api/gemini", userId: user.id },
  });
  if (limited) return rateLimitError;

  // 3. Validate body — unknown keys rejected by .strict() schemas
  const { data: body, error: validationError } = await validateBody(request, GeminiRequestSchema);
  if (validationError) return validationError;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI service unavailable" }, { status: 503, headers: SECURE_HEADERS });
  }

  // 4. Prompt key authorization
  //    admin-seed requires role = admin; verified server-side, never client-trusted
  if (body.promptKey === "admin-seed") {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403, headers: SECURE_HEADERS });
    }

    if (!body.activeTab || !body.sounds) {
      return Response.json(
        { error: "activeTab and sounds are required for admin-seed" },
        { status: 400, headers: SECURE_HEADERS }
      );
    }
  }

  // 5. Build system prompt entirely server-side
  const systemPrompt = buildServerPrompt(
    body.promptKey,
    body.promptKey === "admin-seed"
      ? { activeTab: body.activeTab!, sounds: body.sounds! }
      : undefined
  );

  // 6. Determine tool config server-side from the last user message
  //    Client has zero influence over which tools the model can use
  const lastMsg = body.messages[body.messages.length - 1];
  if (lastMsg.role !== "user") {
    return Response.json({ error: "Last message must be from the user" }, { status: 400, headers: SECURE_HEADERS });
  }

  // Cap input fed to intent detection — detectIntent has its own guard but we
  // also avoid building a huge string from the full content field.
  const lastUserText = (lastMsg.content ?? "").slice(0, 2_000);
  const intent = detectIntent(lastUserText);
  const { toolChoice, allowedTools } = intentToToolConfig(intent);

  const history = buildHistory(body.messages.slice(0, -1));
  const ai = new GoogleGenAI({ apiKey });

  try {
    if (body.stream) {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), STREAM_TIMEOUT_MS);

      const readable = new ReadableStream({
        start(controller) {
          streamWithFallback(ai, systemPrompt, history, lastUserText, toolChoice, allowedTools, controller, timeoutController.signal)
            .catch((err) => {
              controller.enqueue(encodeChunk({ type: "error", message: String(err?.message ?? "Stream error") }));
              controller.close();
            })
            .finally(() => clearTimeout(timeoutId));
        },
        cancel() {
          timeoutController.abort();
          clearTimeout(timeoutId);
        },
      });

      return new Response(readable, {
        headers: {
          ...SECURE_HEADERS,
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: any = toolChoice !== "none" ? [{ functionDeclarations: TOOLS_TYPED }] : undefined;
    const toolConfig = buildToolConfig(toolChoice, allowedTools);
    let lastError: unknown;

    for (const model of FALLBACK_MODELS) {
      try {
        const chat = ai.chats.create({
          model,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          config: { systemInstruction: systemPrompt, ...(tools ? { tools } : {}), toolConfig, maxOutputTokens: MAX_OUTPUT_TOKENS } as any,
          history,
        });

        const result = await chat.sendMessage({ message: lastUserText });
        const responseText = result.text;

        if (!responseText) throw new Error("Empty response from AI");
        return Response.json({ content: responseText }, { headers: SECURE_HEADERS });
      } catch (err: unknown) {
        lastError = err;
        if (!shouldTryNextModel(err)) throw err;
      }
    }

    throw lastError || new Error("All fallback models failed");
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    const message = String((err as { message?: unknown })?.message ?? "Internal server error");
    console.error("Gemini API error:", err);
    return Response.json({ error: message }, { status, headers: SECURE_HEADERS });
  }
}
