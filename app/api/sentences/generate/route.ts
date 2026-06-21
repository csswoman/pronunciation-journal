import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { createHash } from "crypto";
import type { Database } from "@/lib/supabase/types";
import { SENTENCE_REORDER_SYSTEM_PROMPT } from "@/lib/ai-prompts";

export const runtime = "nodejs";

const MIN_TOKENS = 4;
const DEFAULT_COUNT = 10;
const MAX_COUNT = 30;

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getUserFromBearer(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

// ── Gemini sentence generation ────────────────────────────────────────────────

async function generateSentencesWithGemini(
  topic: string,
  level: string,
  count: number,
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Generate ${count} English sentences for a ${level} learner about: "${topic}".
Return a JSON array of strings only. Example: ["The cat sat on the mat.", "She goes to school every day."]`;

  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  let lastError: unknown;

  for (const model of models) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SENTENCE_REORDER_SYSTEM_PROMPT,
          responseMimeType: "application/json",
        },
      });
      if (!result.text) throw new Error("Empty response");

      const parsed = JSON.parse(result.text);
      if (!Array.isArray(parsed)) throw new Error("Expected array");

      return parsed
        .filter((s): s is string => typeof s === "string")
        .filter((s) => s.trim().split(/\s+/).length >= MIN_TOKENS);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("Gemini generation failed");
}

// ── Deterministic fragment ID ─────────────────────────────────────────────────

function fragmentId(source: string, text: string): string {
  const h = createHash("sha256").update(`${source}:${text}`).digest("hex").slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function cacheKey(topic: string, level: string): string {
  return createHash("sha256").update(`${level}:${topic.toLowerCase()}`).digest("hex");
}

// ── Route handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/sentences/generate
 *
 * Body: { topic: string, level?: string, count?: number, deckSlug?: string }
 *
 * Generates sentences with Gemini, saves them to text_fragments (cache),
 * and returns the rows so the client can build exercises immediately.
 * Grammar deck sentences are cached globally as system content. Free-form topics
 * are cached per-user to avoid exposing user-supplied prompts across accounts.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const user = await getUserFromBearer(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { topic?: unknown; level?: unknown; count?: unknown; deckSlug?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) return NextResponse.json({ error: "topic is required" }, { status: 400 });
  if (topic.length > 200) return NextResponse.json({ error: "topic too long" }, { status: 400 });

  const level = typeof body.level === "string" ? body.level : "B1";
  const count = Math.min(
    MAX_COUNT,
    Math.max(1, typeof body.count === "number" ? body.count : DEFAULT_COUNT),
  );
  const deckSlug = typeof body.deckSlug === "string" ? body.deckSlug : null;
  const isSharedDeckCache = Boolean(deckSlug);
  const source = isSharedDeckCache
    ? `grammar-deck:${deckSlug}:ai`
    : `ai:user:${user.id}:${level}:${cacheKey(topic, level)}`;
  const cacheOwnerId = isSharedDeckCache ? null : user.id;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!serviceKey) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const db = createClient<Database>(supabaseUrl, serviceKey);

  // ── Check cache first ─────────────────────────────────────────────────────
  let cacheQuery = db
    .from("text_fragments")
    .select("id, content, source, title")
    .eq("source", source)
    .eq("fragment_type", "sentence")
    .limit(count);

  cacheQuery = cacheOwnerId === null
    ? cacheQuery.is("user_id", null)
    : cacheQuery.eq("user_id", cacheOwnerId);

  const { data: cached } = await cacheQuery;

  if (cached && cached.length >= Math.min(count, 5)) {
    return NextResponse.json({ fragments: cached, fromCache: true });
  }

  // ── Generate with Gemini ──────────────────────────────────────────────────
  let sentences: string[];
  try {
    sentences = await generateSentencesWithGemini(topic, level, count);
  } catch (err) {
    console.error("[sentences/generate] Gemini error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 502 });
  }

  if (sentences.length === 0) {
    return NextResponse.json({ error: "No sentences generated" }, { status: 502 });
  }

  // ── Save to text_fragments (cache) ────────────────────────────────────────
  const rows = sentences.map((content) => ({
    id: fragmentId(source, content),
    user_id: cacheOwnerId,
    source,
    fragment_type: "sentence" as const,
    content,
    title: deckSlug ? `${topic} · ${level}` : `AI sentences · ${level}`,
  }));

  const { data: inserted, error: insertErr } = await db
    .from("text_fragments")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
    .select("id, content, source, title");

  if (insertErr) {
    console.error("[sentences/generate] DB insert error:", insertErr);
    // Still return the generated sentences even if caching failed
    return NextResponse.json({ fragments: rows.map(({ id, content, source, title }) => ({ id, content, source, title })), fromCache: false });
  }

  return NextResponse.json({ fragments: inserted ?? rows, fromCache: false });
}
