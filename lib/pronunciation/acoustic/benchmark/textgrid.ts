/**
 * Lector mínimo de TextGrid de Praat (formato largo "ooTextFile"), solo lo que
 * necesitan las anotaciones de L2-ARCTIC: tiers de intervalos con nombre.
 * Node-only, para el benchmark; no se despliega en la app.
 */

export interface TextGridInterval {
  startMs: number
  endMs: number
  text: string
}

export interface TextGridTier {
  name: string
  intervals: TextGridInterval[]
}

const NUMBER = /-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/

function matchAfter(line: string, key: string): string | null {
  const m = new RegExp(`^\\s*${key}\\s*=\\s*(.*?)\\s*$`).exec(line)
  return m ? m[1] : null
}

function unquote(value: string): string {
  const m = /^"([\s\S]*)"$/.exec(value)
  // Praat escapa las comillas internas duplicándolas.
  return m ? m[1].replace(/""/g, '"') : value
}

function toMs(value: string): number {
  const m = NUMBER.exec(value)
  return m ? Math.round(Number(m[0]) * 1000) : 0
}

/**
 * Parsea un TextGrid largo. Se recorre línea a línea en vez de por regiones
 * porque los ficheros de L2-ARCTIC mezclan sangrados y saltos de línea según
 * la versión de Praat que los escribió.
 */
export function parseTextGrid(raw: string): TextGridTier[] {
  const lines = raw.split(/\r?\n/)
  const tiers: TextGridTier[] = []

  let current: TextGridTier | null = null
  // Los xmin/xmax del fichero y de la cabecera del tier tienen la misma forma
  // que los del intervalo, así que solo se leen tras un `intervals [n]:`.
  let pending: { startMs?: number; endMs?: number; text?: string } | null = null

  const flush = () => {
    if (current && pending && pending.startMs !== undefined && pending.endMs !== undefined) {
      current.intervals.push({
        startMs: pending.startMs,
        endMs: pending.endMs,
        text: pending.text ?? '',
      })
    }
    pending = null
  }

  for (const line of lines) {
    const name = matchAfter(line, 'name')
    if (name !== null) {
      flush()
      current = { name: unquote(name), intervals: [] }
      tiers.push(current)
      continue
    }

    if (/^\s*intervals\s*\[\d+\]\s*:/.test(line)) {
      flush()
      pending = {}
      continue
    }

    if (!pending) continue

    const text = matchAfter(line, 'text')
    if (text !== null) {
      pending.text = unquote(text).trim()
      continue
    }

    const xmin = matchAfter(line, 'xmin')
    if (xmin !== null) {
      pending.startMs = toMs(xmin)
      continue
    }

    const xmax = matchAfter(line, 'xmax')
    if (xmax !== null) {
      pending.endMs = toMs(xmax)
    }
  }
  flush()

  return tiers.filter((tier) => tier.intervals.length > 0)
}

/** Tier por nombre, sin distinguir mayúsculas. Null si el fichero no lo trae. */
export function findTier(tiers: TextGridTier[], name: string): TextGridTier | null {
  return tiers.find((t) => t.name.toLowerCase() === name.toLowerCase()) ?? null
}
