import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enqueueWordEnrichmentJob } from "@/lib/word-bank/jobs";
import { createUserScopedClient, requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { logServerError } from "@/lib/api/logging";

export const runtime = "nodejs";

const WordsRequestSchema = z
  .object({
    text: z.string().trim().min(1, "text is required").max(200, "text too long"),
    context: z.string().trim().max(1000).optional(),
    id: z.string().min(1).optional(),
    deckId: z.string().trim().min(1).optional(),
    source: z.enum(["manual", "reader"]).default("manual"),
  })
  .strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const { user, error: authError, accessToken } = await requireUser(req);
  if (authError) return authError;

  const { limited, error: rateLimitError } = await rateLimit(`/api/words:${user.id}`, {
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
  const source = body.source;

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
      logServerError("Word retry update failed", updateErr, {
        endpoint: "/api/words",
        operation: "retryUpdate",
        userId: user.id,
      });
      return publicErrorResponse(500, "Failed to retry word");
    }

    const jobId = await enqueueWordEnrichmentJob(userClient, user.id, word.id);
    return NextResponse.json({ word, jobId }, { status: 200, headers: SECURE_HEADERS });
  }

  // Create new word.
  const { data: word, error: insertErr } = await userClient
    .from("word_bank")
    .insert({
      user_id: user.id,
      text,
      context,
      source,
      status: "processing",
    })
    .select()
    .single();

  if (insertErr || !word) {
    logServerError("Word insert failed", insertErr, {
      endpoint: "/api/words",
      operation: "insert",
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to create word");
  }

  if (deckId) {
    // Verify deck belongs to this user before linking.
    const { data: deck, error: deckErr } = await userClient
      .from("decks")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", user.id)
      .single();

    if (deckErr) {
      logServerError("Word deck lookup failed", deckErr, {
        endpoint: "/api/words",
        operation: "deckLookup",
        userId: user.id,
      });
      return publicErrorResponse(500, "Failed to verify deck");
    }

    if (!deck) {
      return publicErrorResponse(404, "Deck not found");
    }

    const { error: linkErr } = await userClient
      .from("word_bank_decks")
      .insert({ word_id: word.id, deck_id: deckId });

    if (linkErr) {
      logServerError("Word deck link failed", linkErr, {
        endpoint: "/api/words",
        operation: "deckLink",
        userId: user.id,
      });
      return publicErrorResponse(500, "Failed to add word to deck");
    }

  }

  const jobId = await enqueueWordEnrichmentJob(userClient, user.id, word.id);
  return NextResponse.json({ word, jobId }, { status: 201, headers: SECURE_HEADERS });
}
