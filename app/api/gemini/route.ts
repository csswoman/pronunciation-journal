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

// Multiple free models for automatic fallback when quota is exceeded
const FALLBACK_MODELS = [
  "gemini-2.5-flash",           // Primary - newest and fastest
  "gemini-2.0-flash",           // Fallback 1
  "gemini-flash-latest",        // Fallback 2
  "gemini-2.5-flash-lite",      // Fallback 3 - lighter version
  "gemini-2.0-flash-lite",      // Fallback 4
];

async function sendMessageWithFallback(
  ai: GoogleGenAI,
  systemPrompt: string,
  chatHistory: Content[],
  lastMessage: string
): Promise<string> {
  let lastError: any;

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
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed:`, err.message);
      
      // Continue to next model if not a critical error
      if (err.status === 404 || err.message?.includes("not found")) {
        continue;
      }
      
      // For other errors, rethrow immediately
      if (err.status && err.status !== 404) {
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

  } catch (err: any) {
    console.error("Error en Gemini API:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: err.status || 500 }
    );
  }
}
