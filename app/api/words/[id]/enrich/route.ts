import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { enrichWord } from "@/lib/word-bank/enrich";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

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

  // Verify ownership through RLS.
  const userClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: row } = await userClient
    .from("word_bank")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (row.status === "processing") {
    return NextResponse.json({ ok: true, alreadyProcessing: true });
  }

  const { error: resetErr } = await userClient
    .from("word_bank")
    .update({ status: "processing", error_reason: null })
    .eq("id", id)
    .neq("status", "processing");

  if (resetErr) {
    return NextResponse.json({ error: resetErr.message }, { status: 500 });
  }

  // Fire in background — client already shows "processing" and will receive
  // the DB update via realtime subscription when Gemini finishes.
  void enrichWord(id);

  return NextResponse.json({ ok: true });
}
