// Exporta el catálogo de inmersión a un JSON estático, igual que
// generate-content-index.ts hace para lexicon/mini-lessons/rutas.
//
// El manifest de learning-loop (lib/learning-loop/content-manifest.ts)
// declara qué enseña cada contenido, y scripts/audit-learning-loop.mjs corre
// en `prepush` sin red garantizada. fetchImmersionLessons() (lib/immersion/queries.ts)
// solo lee de Supabase, así que el manifest no puede llamarlo directo. Este
// script sí corre con red (en `prebuild`, igual que content-index:generate) y
// deja el catálogo cacheado para que content-manifest.ts lo lea offline.
//
// Solo se exportan los campos que el manifest necesita — no el catálogo
// completo (evita duplicar timestamps/vocabulario/quiz, que ya están en
// Supabase y no le importan a la auditoría).
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { ImmersionLessonMetadata, ImmersionLevel, ImmersionTopic } from '../lib/immersion/types'

export interface ImmersionManifestSourceEntry {
  id: string
  slug: string
  title: string
  level: ImmersionLevel
  topic: ImmersionTopic
  metadata: ImmersionLessonMetadata
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const outPath = path.join(process.cwd(), 'lib', 'learning-loop', 'generated-immersion-index.ts')

  if (!url || !key) {
    // Sin credenciales (p. ej. CI sin secretos, o dev local sin .env) no
    // podemos regenerar — pero si ya existe un índice generado de una corrida
    // anterior, lo dejamos tal cual en vez de romper el build.
    if (fs.existsSync(outPath)) {
      console.warn('[generate-immersion-index] sin credenciales de Supabase; conservando índice existente')
      return
    }
    console.warn('[generate-immersion-index] sin credenciales de Supabase y sin índice previo; generando vacío')
    writeIndex(outPath, [])
    return
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('immersion_lessons')
    .select('id, slug, title, level, topic, metadata')
    .order('slug', { ascending: true })

  if (error) {
    console.warn('[generate-immersion-index] error leyendo immersion_lessons:', error.message ?? error)
    if (fs.existsSync(outPath)) {
      console.warn('[generate-immersion-index] conservando índice existente')
      return
    }
    console.warn('[generate-immersion-index] sin índice previo; generando vacío')
    writeIndex(outPath, [])
    return
  }

  const entries: ImmersionManifestSourceEntry[] = (data ?? []).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    level: row.level as ImmersionLevel,
    topic: row.topic as ImmersionTopic,
    metadata: (row.metadata ?? {}) as ImmersionLessonMetadata,
  }))

  writeIndex(outPath, entries)
  console.log(`[generate-immersion-index] ${entries.length} lecciones exportadas a ${path.relative(process.cwd(), outPath)}`)
}

function writeIndex(outPath: string, entries: ImmersionManifestSourceEntry[]) {
  const serialized = JSON.stringify(entries)
  const output = `import type { ImmersionManifestSourceEntry } from '../../scripts/generate-immersion-index'\n\n// Generado por scripts/generate-immersion-index.ts. No editar a mano.\nexport const GENERATED_IMMERSION_INDEX = JSON.parse(${JSON.stringify(serialized)}) as ImmersionManifestSourceEntry[]\n`
  fs.writeFileSync(outPath, output)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
