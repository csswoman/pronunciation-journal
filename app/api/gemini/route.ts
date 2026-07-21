import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { type PromptKey } from "@/lib/api/prompts";
import { detectIntent, intentToToolConfig } from "@/lib/ai-practice/intent-detection";
import { buildSystemPrompt, extractLastTopicFromWire, lastUserVoiceMetadataFromWire } from "@/lib/ai-practice/wire";
import { fetchServerLearningState } from "@/lib/ai-practice/server-state";
import { getErrorStatus } from "@/lib/gemini/fallback";
import {
  buildHistory,
  encodeChunk,
  sendMessageWithFallback,
  streamWithFallback,
  STREAM_TIMEOUT_MS,
} from "@/lib/gemini/chat-route";
import { logServerError } from "@/lib/api/logging";

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

const VoiceMetadataSchema = z.object({
  transcript: z.literal(true),
  scored: z.boolean(),
}).strict();

const MessageSchema = z.object({
  role: z.enum(["user", "model", "tool"]),
  content: z.string().max(8_000).optional(),
  parts: z.array(MessagePartSchema).max(20).optional(),
  toolCallId: z.string().max(200).optional(),
  name: z.string().max(100).optional(),
  result: z.unknown().optional(),
  voice: VoiceMetadataSchema.optional(),
}).strict();

export const GeminiRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  /**
   * Named key resolved to a server-defined system prompt.
   * Closed enum — any value outside this list is rejected with 400.
   * The client cannot supply raw prompt text.
   */
  promptKey: z.enum(["default"] satisfies [PromptKey, ...PromptKey[]]).optional().default("default"),
  stream: z.boolean().optional().default(false),
}).strict();

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<Response> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  // 1. Auth — reject before touching the body
  const { user, error: authError, accessToken } = await requireUser(request);
  if (authError) return authError;

  // 2. Rate limit — 15 req/min per user, keyed per endpoint so routes are independent
  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini:${user.id}`, {
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

  // 4. Determine tool config server-side from the last user message
  //    Client has zero influence over which tools the model can use
  const lastMsg = body.messages[body.messages.length - 1];
  if (lastMsg.role !== "user") {
    return Response.json({ error: "Last message must be from the user" }, { status: 400, headers: SECURE_HEADERS });
  }

  // 5. Build the system prompt server-side. Learning state is looked up from
  //    the user's own synced row (RLS-scoped, best-effort) rather than trusted
  //    from the client — the client never supplies learningState directly, so
  //    a spoofed request can at most omit/alter its own `voice` tag, which
  //    only nudges feedback verbosity, not tool access or grading.
  const learningState = await fetchServerLearningState(user.id, accessToken);
  const lastTopic = extractLastTopicFromWire(body.messages);
  const voice = lastUserVoiceMetadataFromWire(body.messages);
  const systemPrompt = buildSystemPrompt(learningState, lastTopic, voice?.scored === true);

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
          streamWithFallback(
            ai,
            systemPrompt,
            history,
            lastUserText,
            { toolChoice, allowedTools },
            controller,
            timeoutController.signal
          )
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

    const responseText = await sendMessageWithFallback(
      ai,
      systemPrompt,
      history,
      lastUserText,
      { toolChoice, allowedTools }
    );
    return Response.json({ content: responseText }, { headers: SECURE_HEADERS });
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    logServerError("Gemini chat route failed", err, {
      endpoint: "/api/gemini",
      operation: body.stream ? "stream" : "sendMessage",
      status,
      userId: user.id,
    });
    return publicErrorResponse(status >= 500 ? 500 : status, "Gemini request failed");
  }
}
