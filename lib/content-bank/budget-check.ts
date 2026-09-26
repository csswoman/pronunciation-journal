import { DAILY_BUDGET } from "@/lib/ai-usage/budget";
import { getPacificDateKey } from "@/lib/api/pacific-time";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";
import { CONTENT_BANK_QUOTA_RATIO, DEFAULT_BANK_MODEL } from "./constants";

export { CONTENT_BANK_QUOTA_RATIO, DEFAULT_BANK_MODEL };
export const CONTENT_BANK_DAILY_REQUEST_LIMIT = Math.floor(
  DAILY_BUDGET[DEFAULT_BANK_MODEL] * CONTENT_BANK_QUOTA_RATIO,
);

/**
 * Checks if the specified model's usage today has reached or exceeded
 * the specified threshold ratio of its DAILY_BUDGET (default 60%).
 */
export async function isModelOverQuotaThreshold(
  model: string = DEFAULT_BANK_MODEL,
  thresholdRatio: number = 0.6,
): Promise<boolean> {
  const limit = DAILY_BUDGET[model as keyof typeof DAILY_BUDGET];
  if (!limit) return true;

  try {
    const supabase = tryGetSupabaseAdminClient();
    if (!supabase) return true;

    const today = getPacificDateKey(new Date());
    const { data, error } = await supabase
      .from("ai_usage_daily")
      .select("requests")
      .eq("day", today)
      .eq("model", model);

    if (error || !data) return true;

    const totalRequests = data.reduce((sum, row) => sum + (row.requests ?? 0), 0);
    return totalRequests >= limit * thresholdRatio;
  } catch {
    return true;
  }
}
