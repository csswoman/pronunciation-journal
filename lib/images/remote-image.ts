/** Host patterns allowed in `next.config.js` `images.remotePatterns`. */
const ALLOWED_HOST_PATTERNS: RegExp[] = [
  /\.supabase\.co$/,
  /^prod-files-secure\.s3\.us-east-1\.amazonaws\.com$/,
  /^prod-files-secure\.s3\.us-west-2\.amazonaws\.com$/,
];

/** Whether `next/image` may load this remote HTTPS URL. */
export function isAllowedRemoteImageUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}
