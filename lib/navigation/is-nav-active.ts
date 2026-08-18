/**
 * Active-state helper for sidebar / bottom-nav items.
 * `/courses` must not steal the active state from `/courses/pronunciation`.
 * `/dictionary` absorbs `/tracking` (Guardado) active state.
 */
export function isNavActive(pathname: string, href: string): boolean {
  const cleanPathname = pathname.split('?')[0].split('#')[0]

  if (href === '/') return cleanPathname === '/'

  if (href === '/courses') {
    if (cleanPathname === '/courses') return true
    if (cleanPathname.startsWith('/courses/pronunciation')) return false
    return cleanPathname.startsWith('/courses/')
  }

  if (href === '/dictionary') {
    return (
      cleanPathname === '/dictionary' ||
      cleanPathname.startsWith('/dictionary/') ||
      cleanPathname === '/tracking' ||
      cleanPathname.startsWith('/tracking/')
    )
  }

  return cleanPathname === href || cleanPathname.startsWith(`${href}/`)
}


