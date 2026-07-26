/**
 * Active-state helper for sidebar / bottom-nav items.
 * `/courses` must not steal the active state from `/courses/pronunciation`.
 */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'

  if (href === '/courses') {
    if (pathname === '/courses') return true
    if (pathname.startsWith('/courses/pronunciation')) return false
    return pathname.startsWith('/courses/')
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
