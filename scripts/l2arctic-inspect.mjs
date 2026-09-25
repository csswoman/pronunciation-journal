// scripts/l2arctic-inspect.mjs
// Inspección de una réplica en parquet de L2-ARCTIC: cuenta enunciados y errores
// anotados por hablante. Sirve como prueba de procedencia — los totales deben
// coincidir con la tabla del PSI Lab, incluido el irregular 149 de YBAA.
//
//   node scripts/l2arctic-inspect.mjs D:/datasets/l2-arctic/parquet
//
// Requiere dos paquetes quitados del repo tras la pasada del 2026-09-25:
//   pnpm add -D hyparquet@1.31.1 hyparquet-compressors@1.1.2
//
// El corpus vive fuera del repo (CC BY-NC 4.0); aquí solo se cuenta.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parquetReadObjects, parquetMetadata } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

const dir = process.argv[2]
if (!dir) {
  console.error('Falta la ruta del directorio con los .parquet')
  process.exit(1)
}

const SPANISH = new Set(['EBVS', 'ERMS', 'MBMPS', 'NJS'])

for (const file of readdirSync(dir).filter((f) => f.endsWith('.parquet'))) {
  const buffer = readFileSync(join(dir, file))
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  const meta = parquetMetadata(arrayBuffer)

  const rows = await parquetReadObjects({
    file: arrayBuffer,
    compressors,
    columns: ['speaker_id', 'native_language', 'utterance_id', 'num_substitutions', 'num_deletions', 'num_additions'],
  })

  const bySpeaker = new Map()
  for (const row of rows) {
    const entry = bySpeaker.get(row.speaker_id) ?? { n: 0, sub: 0, del: 0, add: 0, l1: row.native_language }
    entry.n += 1
    entry.sub += Number(row.num_substitutions ?? 0)
    entry.del += Number(row.num_deletions ?? 0)
    entry.add += Number(row.num_additions ?? 0)
    bySpeaker.set(row.speaker_id, entry)
  }

  console.log(`\n=== ${file} — ${Number(meta.num_rows)} filas`)
  console.log('columnas:', meta.schema.filter((s) => s.num_children === undefined).map((s) => s.name).join(', '))
  for (const [speaker, e] of [...bySpeaker].sort()) {
    const mark = SPANISH.has(speaker) ? ' <-- L1 español' : ''
    console.log(`  ${speaker.padEnd(7)} ${String(e.l1).padEnd(10)} ${String(e.n).padStart(4)} enunciados · sub ${e.sub} del ${e.del} add ${e.add}${mark}`)
  }
}
