import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../lib/supabase/types'
import { fetchOwnFeedbackReports, type FeedbackReportRow } from '../../lib/ai-feedback/queries'

if (existsSync('.env.local')) {
  loadEnvFile('.env.local')
}

const isDryRun = process.argv.includes('--dry-run')
const includeJournal = process.argv.includes('--include-journal')
const authToken =
  process.argv.find((arg) => arg.startsWith('--auth-token='))?.slice('--auth-token='.length) ??
  process.env.SUPABASE_USER_ACCESS_TOKEN

const targetDir = fileURLToPath(new URL('./cases/reported/', import.meta.url))

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.')
  }
  if (!authToken) {
    throw new Error(
      'Provide your own current user session JWT with SUPABASE_USER_ACCESS_TOKEN or --auth-token=<jwt>.',
    )
  }

  const client = createClient<Database>(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  const reports: FeedbackReportRow[] = await fetchOwnFeedbackReports(client)

  const journalCount = reports.filter((r) => r.feature === 'journal_correction').length
  if (journalCount > 0 && !includeJournal) {
    console.log(
      `Se omitieron ${journalCount} reporte(s) de diario por privacidad. Usa --include-journal para incluirlos.`,
    )
  }

  if (includeJournal && journalCount > 0) {
    console.warn(
      'ADVERTENCIA: Los reportes del Diario contienen texto personal y NO deben ser commiteados al repositorio.',
    )
  }

  const eligible = reports.filter(
    (r) => includeJournal || r.feature !== 'journal_correction',
  )

  if (isDryRun) {
    console.log(
      `[dry-run] Se exportarían ${eligible.length} candidato(s) para revisión en scripts/prompt-eval/cases/reported/`,
    )
    if (eligible.length > 0) {
      for (const r of eligible) {
        console.log(`- ${r.id} (${r.feature}) [expect: no_error_flagged]`)
      }
    }
    return
  }

  if (eligible.length === 0) {
    console.log('No hay reportes para exportar.')
    return
  }

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }

  for (const report of eligible) {
    const caseData = {
      id: `reported-${report.id}`,
      sourceReportId: report.id,
      feature: report.feature,
      expect: 'no_error_flagged',
      reviewStatus: 'needs_curation',
      input: report.input_snapshot,
      reportedOutput: report.output_snapshot,
      errorPattern: report.error_pattern,
      comment: report.comment,
      createdAt: report.created_at,
    }

    const filePath = fileURLToPath(new URL(`./cases/reported/${report.id}.json`, import.meta.url))
    writeFileSync(filePath, JSON.stringify(caseData, null, 2) + '\n', 'utf8')
    console.log(`Creado caso: ${filePath}`)
  }

  console.log(`Completado: ${eligible.length} candidato(s) exportado(s) para revisión.`)
}

run().catch((err) => {
  console.error('Error al importar reportes:', err)
  process.exit(1)
})
