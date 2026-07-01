import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { enrichWord } from "@/lib/word-bank/enrich";
import { SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return publicErrorResponse(401, "Unauthorized");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return publicErrorResponse(500, "Server misconfiguration");
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const authClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
  const { data: { user } } = await authClient.auth.getUser(token);
  if (!user) {
    return publicErrorResponse(401, "Unauthorized");
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
    return publicErrorResponse(404, "Not found");
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
    console.error("[words/[id]/enrich] reset failed:", resetErr);
    return publicErrorResponse(500, "Failed to start enrichment");
  }

  // Fire in background — client already shows "processing" and will receive
  // the DB update via realtime subscription when Gemini finishes.
  void enrichWord(id);

  return NextResponse.json({ ok: true }, { headers: SECURE_HEADERS });
}
