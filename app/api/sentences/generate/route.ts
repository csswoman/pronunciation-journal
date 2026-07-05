import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { buildSentenceReorderUserPrompt, SENTENCE_REORDER_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { logServerError } from "@/lib/api/logging";
import { callWithFallback, stripJsonFences } from "@/lib/gemini/client";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MIN_TOKENS = 4;
const DEFAULT_COUNT = 10;
const MAX_COUNT = 30;

const SentencesRequestSchema = z
  .object({
    topic: z.string().trim().min(1, "topic is required").max(200, "topic too long"),
    level: z.string().trim().min(1).max(20).default("B1"),
    count: z.number().int().min(1).max(MAX_COUNT).optional(),
    deckSlug: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

const SentencesResponseSchema = z.array(z.string().trim().min(1).max(300)).min(1).max(MAX_COUNT);

// ── Gemini sentence generation ────────────────────────────────────────────────

async function generateSentencesWithGemini(
  topic: string,
  level: string,
  count: number,
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const prompt = buildSentenceReorderUserPrompt(count, topic, level);
  const parsed = await callWithFallback(
    apiKey,
    {
      contents: prompt,
      config: {
        systemInstruction: SENTENCE_REORDER_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    },
    (text) => SentencesResponseSchema.parse(JSON.parse(stripJsonFences(text)))
  );

  return parsed.filter((s) => s.trim().split(/\s+/).length >= MIN_TOKENS);
}

// ── Deterministic fragment ID ─────────────────────────────────────────────────

function fragmentId(source: string, text: string): string {
  const h = createHash("sha256").update(`${source}:${text}`).digest("hex").slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function hashedSentenceSource(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

// ── Route handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/sentences/generate
 *
 * Body: { topic: string, level?: string, count?: number, deckSlug?: string }
 *
 * Generates sentences with Gemini, saves them to text_fragments (cache),
 * and returns the rows so the client can build exercises immediately.
 * Grammar-deck sentences are shared system content; custom prompts are cached
 * only within the requesting user's scope and never persist the raw topic.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(req);
  if (authError) return authError;

  const { limited, error: rateLimitError } = await rateLimit(`/api/sentences/generate:${user.id}`, {
    max: 15,
    windowMs: 60_000,
    meta: { endpoint: "/api/sentences/generate", userId: user.id },
  });
  if (limited) return rateLimitError;

  const { data: body, error: validationError } = await validateBody(req, SentencesRequestSchema);
  if (validationError) return validationError;

  const topic = body.topic;
  const level = typeof body.level === "string" ? body.level : "B1";
  const count = Math.min(
    MAX_COUNT,
    Math.max(1, typeof body.count === "number" ? body.count : DEFAULT_COUNT),
  );
  const deckSlug = typeof body.deckSlug === "string" ? body.deckSlug : null;
  const isSharedDeckRequest = Boolean(deckSlug);
  const source = isSharedDeckRequest
    ? `grammar-deck:${deckSlug}:ai`
    : `ai-user:${hashedSentenceSource(`${user.id}:${level}:${topic}`)}`;

  let db: ReturnType<typeof getSupabaseAdminClient>;
  try {
    db = getSupabaseAdminClient();
  } catch {
    return publicErrorResponse(500, "Server misconfiguration");
  }

  // ── Check cache first ─────────────────────────────────────────────────────
  let cacheQuery = db
    .from("text_fragments")
    .select("id, content, source, title")
    .eq("source", source)
    .eq("fragment_type", "sentence")
    .limit(count);

  cacheQuery = isSharedDeckRequest
    ? cacheQuery.is("user_id", null)
    : cacheQuery.eq("user_id", user.id);

  const { data: cached } = await cacheQuery;

  if (cached && cached.length >= Math.min(count, 5)) {
    return NextResponse.json({ fragments: cached, fromCache: true }, { headers: SECURE_HEADERS });
  }

  // ── Generate with Gemini ──────────────────────────────────────────────────
  let sentences: string[];
  try {
    sentences = await generateSentencesWithGemini(topic, level, count);
  } catch (err) {
    logServerError("Sentence generation Gemini call failed", err, {
      endpoint: "/api/sentences/generate",
      operation: "generateSentences",
      userId: user.id,
    });
    return publicErrorResponse(502, "Generation failed");
  }

  if (sentences.length === 0) {
    return publicErrorResponse(502, "No sentences generated");
  }

  // ── Save to text_fragments (cache) ────────────────────────────────────────
  const rows = sentences.map((content) => ({
    id: fragmentId(source, content),
    user_id: isSharedDeckRequest ? null : user.id,
    source,
    fragment_type: "sentence" as const,
    content,
    title: deckSlug ? `${deckSlug} · ${level}` : `Custom sentences · ${level}`,
  }));

  const { data: inserted, error: insertErr } = await db
    .from("text_fragments")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
    .select("id, content, source, title");

  if (insertErr) {
    logServerError("Sentence generation cache insert failed", insertErr, {
      endpoint: "/api/sentences/generate",
      operation: "cacheInsert",
      userId: user.id,
    });
    // Still return the generated sentences even if caching failed
    return NextResponse.json(
      { fragments: rows.map(({ id, content, source, title }) => ({ id, content, source, title })), fromCache: false },
      { headers: SECURE_HEADERS }
    );
  }

  return NextResponse.json(
    { fragments: inserted ?? rows, fromCache: false },
    { headers: SECURE_HEADERS }
  );
}
