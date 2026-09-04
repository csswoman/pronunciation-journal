import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { lookupWordWithGemini } from "@/lib/word-bank/gemini";
import { getCachedWordDefinition, getOrCreateWordDefinition } from "@/lib/word-bank/definition-cache";
import { findEssentialWord } from "@/lib/essential-words/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createUserScopedClient, publicErrorResponse, rateLimit, requireSameOrigin, requireUser, validateBody } from "@/lib/api/guards";
import { logServerError } from "@/lib/api/logging";

const PreviewSchema = z.object({
  text: z.string().trim().min(1).max(200),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError, accessToken } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { data, error: validationError } = await validateBody(request, PreviewSchema);
  if (validationError) return validationError as NextResponse;

  try {
    const userClient = accessToken
      ? createUserScopedClient(accessToken)
      : await createSupabaseServerClient();
    const { data: savedWord, error: savedWordError } = await userClient
      .from("word_bank")
      .select("meaning, translation, ipa, example, synonyms, image_prompt, status")
      .eq("user_id", user.id)
      .ilike("text", data.text)
      .maybeSingle();
    if (savedWordError) throw savedWordError;

    if (savedWord?.status === "ready" && savedWord.meaning && savedWord.translation) {
      return NextResponse.json({
        enrichment: {
          meaning: savedWord.meaning,
          translation: savedWord.translation,
          ipa: savedWord.ipa ?? "",
          example: savedWord.example ?? "",
          synonyms: savedWord.synonyms ?? [],
          image_prompt: savedWord.image_prompt ?? "",
        },
        source: "my_words",
        alreadySaved: true,
      });
    }

    // 1. Catálogo local curado en memoria (Core 1000) — 0ms, 0 llamadas a IA
    const localEssential = findEssentialWord(data.text);
    if (localEssential && localEssential.meaning && localEssential.translation) {
      return NextResponse.json({
        enrichment: {
          meaning: localEssential.meaning,
          translation: localEssential.translation,
          ipa: localEssential.ipa_strong ?? "",
          example: localEssential.example_sentence ?? "",
          synonyms: [],
          image_prompt: "",
        },
        source: "dictionary",
        alreadySaved: !!savedWord,
      });
    }

    // 2. Caché compartida de base de datos
    const cached = await getCachedWordDefinition(data.text);
    if (cached) {
      return NextResponse.json({ enrichment: cached, source: "dictionary", alreadySaved: !!savedWord });
    }

    const { limited, error: rateLimitError } = await rateLimit(`/api/words/preview:${user.id}`, {
      max: 15,
      windowMs: 60_000,
      meta: { endpoint: "/api/words/preview", userId: user.id },
    });
    if (limited) return rateLimitError as NextResponse;

    const result = await getOrCreateWordDefinition(data.text, () => lookupWordWithGemini(data.text));
    return NextResponse.json({ enrichment: result.enrichment, source: result.source, alreadySaved: !!savedWord });
  } catch (error) {
    logServerError("Reader word preview failed", error, {
      endpoint: "/api/words/preview",
      userId: user.id,
    });
    return publicErrorResponse(502, "No se pudo preparar el significado.");
  }
}
