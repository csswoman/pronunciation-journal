import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: "Supabase URL not configured" }, { status: 500 });
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/sync-notion-lessons`;

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    return NextResponse.json({ error: "Supabase anon key not configured" }, { status: 500 });
  }

  const upstream = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
  });

  const text = await upstream.text();
  console.log("[notion/sync] upstream status:", upstream.status);
  console.log("[notion/sync] upstream body:", text);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = { error: text || "Unknown error from Edge Function" };
  }

  return NextResponse.json(body, { status: upstream.status });
}
