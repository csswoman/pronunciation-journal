import {
  buildLearningContentManifest,
  summarizeLearningContentManifest,
  validateLearningContentManifest,
} from '../lib/learning-loop/content-manifest.ts'
import { auditEvidenceExits } from '../lib/learning-loop/evidence-exits.ts'
import { listAllDecks, getDeckBySlug } from '../lib/courses/grammar-deck/decks.ts'
import { EXERCISE_CAPABILITIES, validateExerciseCapabilities } from '../lib/exercises/capabilities.ts'
import { extractAuthoredErrorPairs } from '../lib/exercises/generators/error-correction.ts'
import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PRACTICE_ROUTES_WITHOUT_SURFACE, PRACTICE_ROUTE_SURFACES } from '../lib/learning-loop/content-manifest.ts'

const manifest = await buildLearningContentManifest()
const issues = validateLearningContentManifest(manifest)
const evidenceIssues = auditEvidenceExits(manifest)
const summary = summarizeLearningContentManifest(manifest)
const capabilityIssues = validateExerciseCapabilities()
const practiceRouteEntries = await readdir(resolve('app/(authenticated)/practice'), { withFileTypes: true })
const practiceRoutes = practiceRouteEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
const practiceRouteIssues = practiceRoutes.flatMap((route) => {
  const surfaces = PRACTICE_ROUTE_SURFACES[route]
  if (!surfaces && !PRACTICE_ROUTES_WITHOUT_SURFACE[route]) {
    return [`${route}: missing LearningSurface mapping or explicit allowlist reason`]
  }
  if (!surfaces) return []
  return surfaces
    .filter((surface) => !manifest.some((entry) => entry.surface === surface))
    .map((surface) => `${route}: mapped surface ${surface} has no manifest entry`)
})
const pairCoverage = listAllDecks().reduce((report, { slug }) => {
  const deck = getDeckBySlug(slug)
  if (!deck) return report
  const extraction = extractAuthoredErrorPairs(deck)
  if (extraction.pairs.length > 0) {
    report.decks += 1
    report.slugs.push(slug)
  }
  report.pairs += extraction.pairs.length
  report.skipped += extraction.skipped.length
  for (const skip of extraction.skipped) report.reasons[skip.reason] += 1
  return report
}, {
  decks: 0,
  pairs: 0,
  skipped: 0,
  slugs: [],
  reasons: { bad_without_good: 0, consecutive_bad: 0, good_without_bad: 0, empty_text: 0 },
})

console.log('[learning-loop] coverage')
console.log('  Static catalog and declared-exit checks only; runtime persistence requires pnpm test:learning-loop:integration before PR.')
for (const [surface, count] of Object.entries(summary)) {
  console.log(`  ${surface}: ${count}`)
}
console.log('[learning-loop] practice routes')
for (const route of practiceRoutes) {
  const surfaces = PRACTICE_ROUTE_SURFACES[route]
  const allowance = PRACTICE_ROUTES_WITHOUT_SURFACE[route]
  console.log(`  ${route}: ${surfaces?.join(', ') ?? `allowlisted (${allowance})`}`)
}
console.log('[learning-loop] exercise capabilities')
console.log(`  active: ${Object.values(EXERCISE_CAPABILITIES).filter((entry) => entry.status === 'active').length}`)
console.log('  deferred: conjugation_blank')
console.log('[learning-loop] authored error correction')
console.log(`  decks: ${pairCoverage.decks}`)
console.log(`  pairs: ${pairCoverage.pairs}`)
console.log(`  skipped: ${pairCoverage.skipped}`)
for (const [reason, count] of Object.entries(pairCoverage.reasons)) console.log(`    ${reason}: ${count}`)
console.log(`  slugs: ${pairCoverage.slugs.join(', ') || '(none)'}`)

if (issues.length > 0 || evidenceIssues.length > 0 || capabilityIssues.length > 0 || practiceRouteIssues.length > 0) {
  console.error(`[learning-loop] ${issues.length + evidenceIssues.length + capabilityIssues.length + practiceRouteIssues.length} issue(s)`)
  for (const issue of issues) {
    console.error(`  ${issue.code} ${issue.contentId}: ${issue.detail}`)
  }
  for (const issue of evidenceIssues) console.error(`  evidence_exit: ${issue}`)
  for (const issue of capabilityIssues) console.error(`  ${issue.code} ${issue.slug}: ${issue.detail}`)
  for (const issue of practiceRouteIssues) console.error(`  practice_route: ${issue}`)
  process.exitCode = 1
} else {
  console.log(`[learning-loop] OK (${manifest.length} entries, 0 issues)`)
}
