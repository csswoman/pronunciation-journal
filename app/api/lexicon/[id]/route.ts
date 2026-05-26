import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getCategoryWords } from "@/lib/lexicon/categories";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const words = getCategoryWords(id);
  if (words.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ words });
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

  const { id } = await params;
  const words = getCategoryWords(id);
  if (words.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const sourceRefs = words.map((w) => w.id);
  const { data: wordBankRows, error: selectErr } = await userClient
    .from("word_bank")
    .select("*")
    .eq("user_id", user.id)
    .in("source_ref", sourceRefs);

  if (selectErr) {
    return NextResponse.json({ error: selectErr.message }, { status: 500 });
  }

  return NextResponse.json({ words, wordBankRows: wordBankRows ?? [] });
}
