/**
 * True si hay URL y anon key reales (no placeholders del .env.example).
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url.trim() || !key.trim()) return false;
  const lower = `${url}${key}`.toLowerCase();
  if (lower.includes("your_supabase")) return false;
  return url.startsWith("https://") && key.length > 30;
}
