/** Remove leading/trailing slashes from stored IPA (e.g. `/iː/` → `iː`). */
export function stripIpaSlashes(ipa: string): string {
  return ipa.trim().replace(/^\/+|\/+$/g, "");
}

/** Always render IPA with exactly one slash on each side. */
export function formatIpaDisplay(ipa: string | undefined | null): string {
  if (!ipa?.trim()) return "";
  return `/${stripIpaSlashes(ipa)}/`;
}
