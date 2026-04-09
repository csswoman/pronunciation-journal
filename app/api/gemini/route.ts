import { GoogleGenAI, type Content } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: "user" | "model";
  content: string;
}

interface GeminiRequestBody {
  messages: Message[];
  systemPrompt: string;
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

  // Fatal auth/request errors: switching model will not help.
  if (status === 400 || status === 401 || status === 403) {
    return false;
  }

  // Common recoverable errors where trying another model is useful.
  if (status === 404 || status === 408 || status === 409 || status === 425 || status === 429) {
    return true;
  }

  if (typeof status === "number" && status >= 500) {
    return true;
  }

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

async function sendMessageWithFallback(
  ai: GoogleGenAI,
  systemPrompt: string,
  chatHistory: Content[],
  lastMessage: string
): Promise<string> {
  let lastError: unknown;

  // Try each model in sequence until one works
  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`Attempting to use model: ${model}`);
      
      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: systemPrompt,
        },
        history: chatHistory,
      });

      const result = await chat.sendMessage({ message: lastMessage });
      const responseText = result.text;

      if (!responseText) {
        throw new Error("Gemini returned an empty response");
      }
      
      console.log(`Successfully used model: ${model}`);
      return responseText;
    } catch (err: unknown) {
      lastError = err;
      const message = String((err as { message?: unknown })?.message ?? "Unknown error");
      const status = getErrorStatus(err);
      console.warn(`Model ${model} failed (${status ?? "no-status"}):`, message);

      if (!shouldTryNextModel(err)) {
        throw err;
      }
    }
  }

  // All models failed
  throw lastError || new Error("All fallback models failed");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "API key no configurada" }, { status: 500 });
  }

  try {
    const body: GeminiRequestBody = await request.json();
    const { messages, systemPrompt } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    // El último mensaje DEBE ser del usuario para usar sendMessage
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return NextResponse.json({ error: "El último mensaje debe ser del usuario" }, { status: 400 });
    }

    // Preparamos el historial (excluyendo el último)
    const chatHistory = messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const ai = new GoogleGenAI({ apiKey });
    
    // Use fallback model strategy with automatic retry
    const responseText = await sendMessageWithFallback(
      ai,
      systemPrompt,
      chatHistory,
      lastMessage.content
    );

    return NextResponse.json({ content: responseText });

  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    const message = String((err as { message?: unknown })?.message ?? "Error interno del servidor");
    console.error("Error en Gemini API:", err);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
