/**
 * Sanitize a `next=` redirect target from an untrusted query string.
 *
 * A bare `startsWith("/")` check is not enough: browsers resolve
 * protocol-relative URLs like `//evil.com` (and `/\evil.com`) as absolute,
 * which turns the callback into an open redirect.
 */
export function safeNextPath(next: string | null, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  // Reject protocol-relative and backslash-smuggled absolute URLs.
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
