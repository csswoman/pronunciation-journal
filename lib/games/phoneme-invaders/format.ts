/**
 * Minimal-pair contrasts are stored as "iː|ɪ". Learners read them as
 * "/iː/ vs /ɪ/" — never uppercased, since case changes IPA symbols.
 */
export function formatContrast(contrast: string): string {
  const parts = contrast.split('|').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return ''
  return parts.map((p) => `/${p}/`).join(' vs ')
}
