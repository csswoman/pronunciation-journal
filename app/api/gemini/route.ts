import { GoogleGenerativeAI } from "@google/generative-ai";
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
  "models/gemini-2.5-flash",           // Primary - newest and fastest
  "models/gemini-2.0-flash",           // Fallback 1
  "models/gemini-flash-latest",        // Fallback 2
  "models/gemini-2.5-flash-lite",      // Fallback 3 - lighter version
  "models/gemini-2.0-flash-lite",      // Fallback 4
];

async function sendMessageWithFallback(
  genAI: GoogleGenerativeAI,
  modelName: string,
  systemPrompt: string,
  chatHistory: any[],
  lastMessage: string
): Promise<string> {
  let lastError: any;

  // Try each model in sequence until one works
  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`Attempting to use model: ${model}`);
      
      const generativeModel = genAI.getGenerativeModel({
        model: model,
        systemInstruction: systemPrompt,
      });

      const chat = generativeModel.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(lastMessage);
      const responseText = result.response.text();
      
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

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use fallback model strategy with automatic retry
    const responseText = await sendMessageWithFallback(
      genAI,
      FALLBACK_MODELS[0],
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