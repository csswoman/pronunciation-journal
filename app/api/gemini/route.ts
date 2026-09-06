import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { detectIntent, intentToToolConfig } from "@/lib/ai-practice/intent-detection";
import { buildSystemPrompt, extractLastTopicFromWire, lastUserVoiceMetadataFromWire } from "@/lib/ai-practice/wire";
import { getMission } from "@/lib/ai-practice/missions/registry";
import { fetchServerLearningState } from "@/lib/ai-practice/server-state";
import { getUserInterests } from "@/lib/users/server-queries";
import { getErrorStatus } from "@/lib/gemini/fallback";
import {
  buildHistory,
  encodeChunk,
  sendMessageWithFallback,
  streamWithFallback,
  STREAM_TIMEOUT_MS,
} from "@/lib/gemini/chat-route";
import { logServerError } from "@/lib/api/logging";

import { GeminiRequestSchema } from "./schema";

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<Response> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  // 1. Auth — reject before touching the body
  const { user, error: authError, accessToken } = await requireUser(request);
  if (authError) return authError;

  // 2. Multi-layered rate limit — IP + user + global budget
  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: "/api/gemini",
    maxPermanent: 15,
    maxAnonymous: 3,
  });
  if (limited) return rateLimitError;

  // 3. Validate body — unknown keys rejected by .strict() schemas
  const { data: body, error: validationError } = await validateBody(request, GeminiRequestSchema);
  if (validationError) return validationError;

  if (body.missionId && !getMission(body.missionId)) {
    return Response.json({ error: "Invalid mission request" }, { status: 400, headers: SECURE_HEADERS });
  }

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
  // Interests are a nice-to-have: a profile read failure must never block the
  // chat, so it degrades to an empty list rather than rejecting the request.
  const [learningState, interests] = await Promise.all([
    fetchServerLearningState(user.id, accessToken),
    getUserInterests(user.id).catch(() => []),
  ]);
  const lastTopic = extractLastTopicFromWire(body.messages);
  const voice = lastUserVoiceMetadataFromWire(body.messages);
  const systemPrompt = buildSystemPrompt(learningState, {
    lastTopic,
    voiceScored: voice?.scored === true,
    missionId: body.missionId,
    interests,
  });

  // Cap input fed to intent detection — detectIntent has its own guard but we
  // also avoid building a huge string from the full content field.
  const lastUserText = (lastMsg.content ?? "").slice(0, 2_000);
  const intent = detectIntent(lastUserText);
  const selection = body.missionId
    ? intent.type === "explanation_request"
      ? { toolChoice: "none" as const, allowedTools: [] as string[] }
      : { toolChoice: "auto" as const, allowedTools: ["save_word", "mission_intent_observed"] }
    : intentToToolConfig(intent);

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
            selection,
            controller,
            timeoutController.signal
          )
            .catch((err) => {
              logServerError("Gemini chat stream failed", err, {
                endpoint: "/api/gemini",
                operation: "stream",
                userId: user.id,
              });
              controller.enqueue(encodeChunk({ type: "error", message: "AI response failed. Please try again." }));
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
      selection
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
