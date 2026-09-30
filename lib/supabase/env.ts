/**
 * True si hay URL y anon key reales (no placeholders del .env.example).
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url.trim() || !key.trim()) return false;
  const lower = `${url}${key}`.toLowerCase();
  if (
    lower.includes("your_supabase") ||
    lower.includes("tu-proyecto") ||
    lower.includes("tu_anon_key")
  ) {
    return false;
  }

  const isHttps = url.startsWith("https://");
  const isLocalDevelopmentUrl =
    process.env.NODE_ENV === "development" && isLoopbackHttpUrl(url);
  return (isHttps || isLocalDevelopmentUrl) && key.length > 30;
}

function isLoopbackHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "[::1]")
    );
  } catch {
    return false;
  }
}
