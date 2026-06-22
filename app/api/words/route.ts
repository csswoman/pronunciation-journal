import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enrichWord } from "@/lib/word-bank/enrich";
import { createUserScopedClient, requireUser, rateLimit, validateBody, SECURE_HEADERS } from "@/lib/api/guards";

export const runtime = "nodejs";

const WordsRequestSchema = z
  .object({
    text: z.string().trim().min(1, "text is required").max(200, "text too long"),
    context: z.string().trim().max(1000).optional(),
    id: z.string().min(1).optional(),
    deckId: z.string().trim().min(1).optional(),
  })
  .strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { user, error: authError, accessToken } = await requireUser(req);
  if (authError) return authError;

  const { limited, error: rateLimitError } = rateLimit(`/api/words:${user.id}`, {
    max: 20,
    windowMs: 60_000,
    meta: { endpoint: "/api/words", userId: user.id },
  });
  if (limited) return rateLimitError;

  const { data: body, error: validationError } = await validateBody(req, WordsRequestSchema);
  if (validationError) return validationError;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Authorization token is required" },
      { status: 401, headers: SECURE_HEADERS }
    );
  }

  const text = body.text;
  const context = body.context ? body.context.slice(0, 1000) : null;
  const id = body.id ?? null;
  const deckId = body.deckId ?? null;

  // User-scoped client so RLS applies and user_id is enforced.
  const userClient = createUserScopedClient(accessToken);

  // If retrying an existing word, update it instead of inserting.
  if (id) {
    const { data: word, error: updateErr } = await userClient
      .from("word_bank")
      .update({
        status: "processing",
        error_reason: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr || !word) {
      console.error("[POST /api/words] retry update failed:", updateErr);
      return NextResponse.json(
        { error: updateErr?.message ?? "Failed to retry word" },
        { status: 500, headers: SECURE_HEADERS }
      );
    }

    void enrichWord(word.id);
    return NextResponse.json({ word }, { status: 200, headers: SECURE_HEADERS });
  }

  // Create new word.
  const { data: word, error: insertErr } = await userClient
    .from("word_bank")
    .insert({
      user_id: user.id,
      text,
      context,
      status: "processing",
    })
    .select()
    .single();

  if (insertErr || !word) {
    console.error("[POST /api/words] insert failed:", insertErr);
    return NextResponse.json(
      { error: insertErr?.message ?? "Failed to create word" },
      { status: 500, headers: SECURE_HEADERS }
    );
  }

  if (deckId) {
    // Verify deck belongs to this user before linking.
    const { data: deck } = await userClient
      .from("decks")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", user.id)
      .single();

    if (deck) {
      await userClient.from("word_bank_decks").insert({ word_id: word.id, deck_id: deckId });
    }
  }

  void enrichWord(word.id);
  return NextResponse.json({ word }, { status: 201, headers: SECURE_HEADERS });
}
