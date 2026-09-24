import { getPacificDateKey } from "../lib/api/pacific-time";
import { tryGetSupabaseAdminClient } from "../lib/supabase/service-role";

type UsageRow = {
  day: string;
  model: string;
  feature: string;
  requests: number;
  failures: number;
  cache_hits: number;
};

function firstDayInWindow(today: string): string {
  const first = new Date(`${today}T00:00:00.000Z`);
  first.setUTCDate(first.getUTCDate() - 6);
  return first.toISOString().slice(0, 10);
}

function printReport(title: string, rows: UsageRow[]): void {
  console.log(`\n${title}`);
  console.table(rows.map((row) => ({
    model: row.model,
    feature: row.feature,
    requests: row.requests,
    failures: row.failures,
    cache_hits: row.cache_hits,
  })));
}

async function main(): Promise<void> {
  const today = getPacificDateKey(new Date());
  const supabase = tryGetSupabaseAdminClient();
  if (!supabase) {
    console.warn("Supabase service role is not configured; usage cannot be queried.");
    printReport(`AI usage today (${today}, Pacific)`, []);
    printReport("AI usage over the last 7 Pacific days", []);
    return;
  }

  const { data, error } = await supabase
    .from("ai_usage_daily")
    .select("day, model, feature, requests, failures, cache_hits")
    .gte("day", firstDayInWindow(today))
    .lte("day", today)
    .order("day", { ascending: true });

  if (error) {
    console.error("Unable to read AI usage:", error.message);
    process.exitCode = 1;
    return;
  }

  const rows = (data ?? []) as UsageRow[];
  const todayRows = rows.filter((row) => row.day === today);
  const sevenDayTotals = new Map<string, UsageRow>();
  for (const row of rows) {
    const key = `${row.model}\u0000${row.feature}`;
    const total = sevenDayTotals.get(key) ?? {
      day: "",
      model: row.model,
      feature: row.feature,
      requests: 0,
      failures: 0,
      cache_hits: 0,
    };
    total.requests += row.requests;
    total.failures += row.failures;
    total.cache_hits += row.cache_hits;
    sevenDayTotals.set(key, total);
  }

  printReport(`AI usage today (${today}, Pacific)`, todayRows);
  printReport("AI usage over the last 7 Pacific days", [...sevenDayTotals.values()]);
}

main().catch((error: unknown) => {
  console.error("AI usage report failed:", error);
  process.exitCode = 1;
});
