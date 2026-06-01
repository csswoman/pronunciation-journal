export function formatIpaDisplay(ipa: string | undefined | null): string {
  if (!ipa?.trim()) return "";
  const t = ipa.trim();
  if (t.startsWith("/")) return t;
  return `/${t}/`;
}
