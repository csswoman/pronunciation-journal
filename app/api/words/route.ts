import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { enrichWord } from "@/lib/word-bank/enrich";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const authClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
  const { data: { user } } = await authClient.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: unknown; context?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (text.length > 200) {
    return NextResponse.json({ error: "text too long" }, { status: 400 });
  }

  const context =
    typeof body.context === "string" && body.context.trim()
      ? body.context.trim().slice(0, 1000)
      : null;

  // Insert through a user-scoped client so RLS applies and user_id is enforced.
  const userClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

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
      { status: 500 }
    );
  }

  // Fire enrichment in background — client gets the row immediately and
  // receives the update via the realtime subscription when Gemini finishes.
  void enrichWord(word.id);

  return NextResponse.json({ word }, { status: 201 });
}
