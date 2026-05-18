/**
 * Formats an ISO date string as a compact, human-readable relative time.
 * e.g. "just now", "5 min ago", "3 days ago", "2 months ago".
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 45) return "just now";

  const units: [limit: number, secs: number, label: string][] = [
    [60, 1, "sec"],
    [60 * 60, 60, "min"],
    [60 * 60 * 24, 60 * 60, "hour"],
    [60 * 60 * 24 * 30, 60 * 60 * 24, "day"],
    [60 * 60 * 24 * 365, 60 * 60 * 24 * 30, "month"],
    [Infinity, 60 * 60 * 24 * 365, "year"],
  ];

  for (const [limit, secs, label] of units) {
    if (diffSec < limit) {
      const value = Math.max(1, Math.round(diffSec / secs));
      return `${value} ${label}${value === 1 ? "" : "s"} ago`;
    }
  }
  return "—";
}
