import { GoogleGenAI, type Content, type FunctionCallingConfigMode, type FunctionDeclaration } from "@google/genai";
import { NextRequest } from "next/server";
import { TOOL_DECLARATIONS } from "@/lib/ai-practice/tools/registry";

// Cast needed: TOOL_DECLARATIONS uses plain string literals for `type` fields,
// but the SDK expects its internal `Type` enum. Runtime values are identical.
const TOOLS_TYPED = TOOL_DECLARATIONS as unknown as FunctionDeclaration[];

interface MessagePart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface Message {
  role: "user" | "model" | "tool";
  content?: string;
  parts?: MessagePart[];
  // tool role fields
  toolCallId?: string;
  name?: string;
  result?: unknown;
}

interface GeminiRequestBody {
  messages: Message[];
  systemPrompt: string;
  toolChoice?: "any" | "none" | "auto";
  allowedTools?: string[];
  stream?: boolean;
}

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

function buildHistory(messages: Message[]): Content[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return messages.map((m): any => {
    if (m.role === "tool") {
      return {
        role: "user",
        parts: [{
          functionResponse: {
            name: m.name ?? "unknown",
            response: { result: m.result },
          },
        }],
      };
    }

    if (m.parts) {
      return { role: m.role, parts: m.parts };
    }

    return {
      role: m.role,
      parts: [{ text: m.content ?? "" }],
    };
  }) as Content[];
}

function buildToolConfig(
  toolChoice: GeminiRequestBody["toolChoice"],
  allowedTools: string[] | undefined
): { functionCallingConfig: { mode: FunctionCallingConfigMode; allowedFunctionNames?: string[] } } {
  if (!toolChoice || toolChoice === "none") {
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

// Encodes a StreamChunk as a server-sent event line
function encodeChunk(chunk: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`);
}

async function streamWithFallback(
  ai: GoogleGenAI,
  systemPrompt: string,
  history: Content[],
  lastMessage: string,
  toolChoice: GeminiRequestBody["toolChoice"],
  allowedTools: string[] | undefined,
  controller: ReadableStreamDefaultController
): Promise<void> {
  let lastError: unknown;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any = toolChoice !== "none" ? [{ functionDeclarations: TOOLS_TYPED }] : undefined;
  const toolConfig = buildToolConfig(toolChoice, allowedTools);

  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`Streaming with model: ${model}`);

      const chat = ai.chats.create({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: {
          systemInstruction: systemPrompt,
          ...(tools ? { tools } : {}),
          toolConfig,
        } as any,
        history,
      });

      const result = await chat.sendMessageStream({ message: lastMessage });

      const activeToolCalls: Record<string, { name: string; argsJson: string }> = {};

      for await (const chunk of result) {
        const candidates = chunk.candidates ?? [];
        for (const candidate of candidates) {
          for (const part of candidate.content?.parts ?? []) {
            if (part.text) {
              controller.enqueue(encodeChunk({ type: "text_delta", delta: part.text }));
            }

            if (part.functionCall) {
              const callName = part.functionCall.name ?? "unknown";
              const id = callName + "_" + Date.now();
              activeToolCalls[id] = {
                name: callName,
                argsJson: JSON.stringify(part.functionCall.args ?? {}),
              };
              controller.enqueue(encodeChunk({ type: "tool_call_start", id, name: callName }));
              controller.enqueue(encodeChunk({
                type: "tool_call_args_delta",
                id,
                delta: JSON.stringify(part.functionCall.args ?? {}),
              }));
              controller.enqueue(encodeChunk({ type: "tool_call_end", id }));
            }
          }
        }
      }

      controller.enqueue(encodeChunk({ type: "done" }));
      controller.close();
      return;
    } catch (err: unknown) {
      lastError = err;
      const message = String((err as { message?: unknown })?.message ?? "Unknown error");
      console.warn(`Model ${model} failed:`, message);
      if (!shouldTryNextModel(err)) break;
    }
  }

  controller.enqueue(
    encodeChunk({ type: "error", message: String((lastError as { message?: unknown })?.message ?? "All models failed") })
  );
  controller.close();
}

export async function POST(request: NextRequest): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "API key no configurada" }, { status: 500 });
  }

  try {
    const body: GeminiRequestBody = await request.json();
    const { messages, systemPrompt, toolChoice, allowedTools, stream = false } = body;

    if (!messages?.length) {
      return Response.json({ error: "Messages required" }, { status: 400 });
    }

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "user") {
      return Response.json({ error: "El último mensaje debe ser del usuario" }, { status: 400 });
    }

    const history = buildHistory(messages.slice(0, -1));
    const lastMessage: string = lastMsg.content ?? "";
    const ai = new GoogleGenAI({ apiKey });

    if (stream) {
      const readable = new ReadableStream({
        start(controller) {
          streamWithFallback(ai, systemPrompt, history, lastMessage, toolChoice, allowedTools, controller).catch(
            err => {
              controller.enqueue(
                encodeChunk({ type: "error", message: String(err?.message ?? "Stream error") })
              );
              controller.close();
            }
          );
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming fallback (used by existing callers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: any =
      toolChoice !== "none" ? [{ functionDeclarations: TOOLS_TYPED }] : undefined;
    const toolConfig = buildToolConfig(toolChoice, allowedTools);
    let lastError: unknown;

    for (const model of FALLBACK_MODELS) {
      try {
        const chat = ai.chats.create({
          model,
          config: {
            systemInstruction: systemPrompt,
            ...(tools ? { tools } : {}),
            toolConfig,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          history,
        });

        const result = await chat.sendMessage({ message: lastMessage });
        const responseText = result.text;

        if (!responseText) throw new Error("Gemini returned an empty response");

        return Response.json({ content: responseText });
      } catch (err: unknown) {
        lastError = err;
        console.warn(`Model ${model} failed:`, err);
        if (!shouldTryNextModel(err)) throw err;
      }
    }

    throw lastError || new Error("All fallback models failed");
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    const message = String((err as { message?: unknown })?.message ?? "Error interno del servidor");
    console.error("Error en Gemini API:", err);
    return Response.json({ error: message }, { status });
  }
}
