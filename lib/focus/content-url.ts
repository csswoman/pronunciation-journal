/** ID de contenido compacto y reversible; las URLs antiguas con UUID siguen funcionando. */
export function focusContentSlug(id: string): string {
  const hex = id.replaceAll('-', '')
  if (!/^[a-f\d]{32}$/i.test(hex)) return id
  const bytes = Array.from({ length: 16 }, (_, index) => String.fromCharCode(Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16))).join('')
  return btoa(bytes).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export function focusContentId(slug: string): string {
  if (!/^[\w-]{22}$/.test(slug)) return slug
  try {
    const encoded = slug.replaceAll('-', '+').replaceAll('_', '/')
    const hex = Array.from(atob(encoded), (character) => character.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  } catch {
    return slug
  }
}
