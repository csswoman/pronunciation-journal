import {
  buildLearningContentManifest,
  summarizeLearningContentManifest,
  validateLearningContentManifest,
} from '../lib/learning-loop/content-manifest.ts'
import { auditEvidenceExits } from '../lib/learning-loop/evidence-exits.ts'

const manifest = await buildLearningContentManifest()
const issues = validateLearningContentManifest(manifest)
const evidenceIssues = auditEvidenceExits(manifest)
const summary = summarizeLearningContentManifest(manifest)

console.log('[learning-loop] coverage')
for (const [surface, count] of Object.entries(summary)) {
  console.log(`  ${surface}: ${count}`)
}

if (issues.length > 0 || evidenceIssues.length > 0) {
  console.error(`[learning-loop] ${issues.length + evidenceIssues.length} issue(s)`)
  for (const issue of issues) {
    console.error(`  ${issue.code} ${issue.contentId}: ${issue.detail}`)
  }
  for (const issue of evidenceIssues) console.error(`  evidence_exit: ${issue}`)
  process.exitCode = 1
} else {
  console.log(`[learning-loop] OK (${manifest.length} entries, 0 issues)`)
}
