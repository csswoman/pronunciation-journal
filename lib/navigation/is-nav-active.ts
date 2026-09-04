/**
 * Active-state helper for sidebar / bottom-nav items.
 * `/courses` must not steal the active state from `/courses/pronunciation`.
 * `/practice` must not steal the active state from pronunciation subroutes (/practice/sounds, /practice/intonation, /practice/connected-speech).
 */
export function isNavActive(pathname: string, href: string): boolean {
  const [cleanPathname, currentQuery] = pathname.split('#')[0].split('?')
  const [cleanHref, targetQuery] = href.split('#')[0].split('?')

  if (cleanHref === '/') return cleanPathname === '/'

  // If href specifies a query param (e.g. /practice/sounds?tab=minimal-pairs), match both pathname and param
  if (targetQuery) {
    if (cleanPathname !== cleanHref) return false
    const currentParams = new URLSearchParams(currentQuery || '')
    const targetParams = new URLSearchParams(targetQuery)
    for (const [key, value] of targetParams.entries()) {
      if (currentParams.get(key) !== value) return false
    }
    return true
  }

  if (cleanHref === '/courses') {
    if (cleanPathname === '/courses') return true
    if (cleanPathname.startsWith('/courses/pronunciation')) return false
    return cleanPathname.startsWith('/courses/')
  }

  if (cleanHref === '/practice') {
    if (cleanPathname === '/practice') return true
    if (
      cleanPathname.startsWith('/practice/sounds') ||
      cleanPathname.startsWith('/practice/intonation') ||
      cleanPathname.startsWith('/practice/connected-speech')
    ) {
      return false
    }
    return cleanPathname.startsWith('/practice/')
  }

  return cleanPathname === cleanHref || cleanPathname.startsWith(`${cleanHref}/`)
}


