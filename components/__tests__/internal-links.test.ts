import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Static-analysis regression guard: every literal internal href in components/**/*.tsx
// must resolve to a real app/ route (a page.tsx file), accounting for route groups like
// (authenticated) and dynamic segments like [id] or [...slug].

const COMPONENTS_DIR = path.join(process.cwd(), 'components')
const APP_DIR = path.join(process.cwd(), 'app')

interface HrefRef {
  href: string
  file: string
}

function walk(dir: string, extFilter: (f: string) => boolean, out: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, extFilter, out)
    } else if (extFilter(entry.name)) {
      out.push(full)
    }
  }
  return out
}

function extractHrefs(source: string, file: string): HrefRef[] {
  const refs: HrefRef[] = []

  // JSX attribute form: href="/foo" or href='/foo'
  const jsxRegex = /href\s*=\s*["'](\/[^"'`]*)["']/g
  // Object literal form: href: '/foo' or href: "/foo"
  const objRegex = /href\s*:\s*["'](\/[^"'`]*)["']/g

  for (const regex of [jsxRegex, objRegex]) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(source)) !== null) {
      refs.push({ href: match[1], file })
    }
  }

  return refs
}

/**
 * Attempts to resolve a literal internal path (e.g. "/practice/chunks") to a page.tsx
 * under app/, allowing:
 *  - route group segments like (authenticated) to be skipped/optional at any depth
 *  - a literal segment to match a dynamic folder ([id], [entryDate]) at that position
 *  - remaining segments to match a catch-all folder ([...slug])
 */
function routeExists(urlPath: string, appDir: string): boolean {
  // Strip query string and hash fragment — only the path portion is routable.
  const pathOnly = urlPath.split('?')[0].split('#')[0]
  const segments = pathOnly.split('/').filter(Boolean)
  return dirHasRoute(appDir, segments)
}

function dirHasRoute(dir: string, segments: string[]): boolean {
  if (!fs.existsSync(dir)) return false

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory())
  } catch {
    return false
  }

  if (segments.length === 0) {
    if (fs.existsSync(path.join(dir, 'page.tsx'))) {
      return true
    }
    // Route groups can also satisfy a terminal (empty-segments) match, e.g. "/"
    // resolving to app/(authenticated)/page.tsx.
    for (const entry of entries) {
      if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
        if (dirHasRoute(path.join(dir, entry.name), segments)) {
          return true
        }
      }
    }
    return false
  }

  const [current, ...rest] = segments

  // 1. Try exact literal match
  const exact = entries.find((e) => e.name === current)
  if (exact && dirHasRoute(path.join(dir, exact.name), rest)) {
    return true
  }

  // 2. Try route group segments `(group)` — skip them, don't consume a path segment
  for (const entry of entries) {
    if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
      if (dirHasRoute(path.join(dir, entry.name), segments)) {
        return true
      }
    }
  }

  // 3. Try dynamic segment folders `[param]` (not catch-all) — consume one segment
  for (const entry of entries) {
    if (
      entry.name.startsWith('[') &&
      entry.name.endsWith(']') &&
      !entry.name.startsWith('[...')
    ) {
      if (dirHasRoute(path.join(dir, entry.name), rest)) {
        return true
      }
    }
  }

  // 4. Try catch-all segment folders `[...param]` — consume all remaining segments
  for (const entry of entries) {
    if (entry.name.startsWith('[...') && entry.name.endsWith(']')) {
      if (fs.existsSync(path.join(dir, entry.name, 'page.tsx'))) {
        return true
      }
    }
  }

  return false
}

describe('internal links', () => {
  it('all literal internal hrefs in components/ resolve to a real app/ route', () => {
    const files = walk(COMPONENTS_DIR, (f) => f.endsWith('.tsx'))
    const allRefs: HrefRef[] = []

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      allRefs.push(...extractHrefs(source, file))
    }

    const broken: HrefRef[] = []
    for (const ref of allRefs) {
      if (!routeExists(ref.href, APP_DIR)) {
        broken.push(ref)
      }
    }

    const message = broken
      .map((b) => `  ${b.href}  (referenced in ${path.relative(process.cwd(), b.file)})`)
      .join('\n')

    expect(broken.length, `Broken internal links found:\n${message}`).toBe(0)
  })
})
