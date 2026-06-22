import { NextRequest, NextResponse } from "next/server";
import { getCategoryWords } from "@/lib/lexicon/categories";
import { createUserScopedClient, requireUser, rateLimit, SECURE_HEADERS } from "@/lib/api/guards";

const WORD_BANK_LEXICON_COLUMNS = [
  "id",
  "user_id",
  "text",
  "meaning",
  "example",
  "difficulty",
  "source",
  "source_ref",
  "status",
  "srs_status",
  "audio_url",
  "ipa",
  "context",
  "created_at",
  "updated_at",
  "ease_factor",
  "interval_days",
  "repetitions",
  "review_count",
  "last_reviewed_at",
  "next_review_at",
  "error_reason",
  "has_audio",
  "audio_fetch_attempts",
  "image_prompt",
  "synonyms",
  "translation",
].join(", ");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const words = getCategoryWords(id);
  if (words.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: SECURE_HEADERS });
  }
  return NextResponse.json({ words }, { headers: SECURE_HEADERS });
}

/**
 * POST /api/lexicon/[id]
 *
 * Returns the raw lexicon words for this category together with any existing
 * word_bank rows the user already has for them. No upsert — words are only
 * added to word_bank when the user explicitly marks them learned.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError, accessToken } = await requireUser(req);
  if (authError) return authError;

  const { id } = await params;

  const { limited, error: rateLimitError } = rateLimit(`/api/lexicon/${id}:${user.id}`, {
    max: 30,
    windowMs: 60_000,
    meta: { endpoint: "/api/lexicon/[id]", userId: user.id },
  });
  if (limited) return rateLimitError;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Authorization token is required" },
      { status: 401, headers: SECURE_HEADERS }
    );
  }

  const words = getCategoryWords(id);
  if (words.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: SECURE_HEADERS });
  }

  const userClient = createUserScopedClient(accessToken);

  const sourceRefs = words.map((w) => w.id);
  const { data: wordBankRows, error: selectErr } = await userClient
    .from("word_bank")
    .select(WORD_BANK_LEXICON_COLUMNS)
    .eq("user_id", user.id)
    .in("source_ref", sourceRefs);

  if (selectErr) {
    return NextResponse.json({ error: selectErr.message }, { status: 500, headers: SECURE_HEADERS });
  }

  return NextResponse.json(
    { words, wordBankRows: wordBankRows ?? [] },
    { headers: SECURE_HEADERS }
  );
}
