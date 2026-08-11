import type { LearningContentManifestEntry } from './types'

export interface EvidenceExitContract {
  adapter: string
  answerWriter: 'savePracticeAnswer' | null
  sessionWriter: 'recordActivitySession' | null
  domainWriter?: string
}

export const EVIDENCE_EXIT_CONTRACTS: readonly EvidenceExitContract[] = [
  { adapter: 'grammar_deck_quiz', answerWriter: 'savePracticeAnswer', sessionWriter: 'recordActivitySession', domainWriter: 'topic_srs' },
  { adapter: 'mini_lesson_quiz', answerWriter: 'savePracticeAnswer', sessionWriter: 'recordActivitySession', domainWriter: 'topic_srs' },
  { adapter: 'essential_words_runtime', answerWriter: 'savePracticeAnswer', sessionWriter: 'recordActivitySession', domainWriter: 'essential_words' },
  { adapter: 'target_practice_route', answerWriter: 'savePracticeAnswer', sessionWriter: 'recordActivitySession', domainWriter: 'pronunciation' },
  { adapter: 'oral_mission_launch', answerWriter: 'savePracticeAnswer', sessionWriter: 'recordActivitySession', domainWriter: 'pronunciation_feedback_evidence' },
  { adapter: 'tracking_word_review', answerWriter: 'savePracticeAnswer', sessionWriter: 'recordActivitySession', domainWriter: 'word_bank' },
  { adapter: 'tracking_phrase_shadow', answerWriter: 'savePracticeAnswer', sessionWriter: 'recordActivitySession', domainWriter: 'pronunciation_feedback_evidence_when_targeted' },
]

export function auditEvidenceExits(entries: readonly LearningContentManifestEntry[]): string[] {
  const contractByAdapter = new Map(EVIDENCE_EXIT_CONTRACTS.map((contract) => [contract.adapter, contract]))
  const issues: string[] = []
  for (const entry of entries) {
    if (entry.practice.status === 'none') continue
    const contract = contractByAdapter.get(entry.practice.adapter)
    if (!contract) {
      issues.push(`${entry.contentId}: missing evidence exit contract for ${entry.practice.adapter}`)
      continue
    }
    if (entry.practice.status === 'objective' && (!contract.answerWriter || !contract.sessionWriter)) {
      issues.push(`${entry.contentId}: objective adapter lacks answer/session writer`)
    }
  }
  return issues
}
