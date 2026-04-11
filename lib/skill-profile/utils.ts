/**
 * Pure utility functions for Skill Profile
 * NO server dependencies - safe for Client Components
 */

import type { SkillProfile } from './types'

/**
 * Empty profile for users with no practice data
 */
export function getEmptyProfile(): SkillProfile {
  return {
    skills: {
      pronunciation: {
        score: 0,
        attempts: 0,
        accuracy: 0,
        confidence: 'low',
      },
      listening: {
        score: 0,
        attempts: 0,
        accuracy: 0,
        confidence: 'low',
      },
      vocabulary: {
        score: 0,
        totalEntries: 0,
        masteredEntries: 0,
        confidence: 'low',
      },
      speaking: {
        score: 0,
        confidence: 'low',
        note: 'Based on pronunciation accuracy',
      },
      reading: {
        score: 0,
        confidence: 'low',
        note: 'Start a reading exercise to unlock',
      },
      writing: {
        score: 0,
        confidence: 'low',
        note: 'Start a writing exercise to unlock',
      },
    },
    today: {
      attempts: 0,
      correct: 0,
      accuracy: 0,
      streak: 0,
    },
    streak: {
      current: 0,
      best: 0,
      soundsPracticed: 0,
      totalSounds: 0,
    },
    trend7d: [],
    soundsDueToday: 0,
    overallScore: 0,
  }
}

/**
 * Generate insight message based on skill profile
 */
export function generateSkillInsight(profile: SkillProfile): string {
  const { skills } = profile

  // No data yet
  if (profile.overallScore === 0) {
    return 'Start practicing to unlock your Skill Profile.'
  }

  // Find strongest and weakest skills
  const scores = [
    { skill: 'pronunciation', score: skills.pronunciation.score },
    { skill: 'listening', score: skills.listening.score },
    { skill: 'vocabulary', score: skills.vocabulary.score },
  ]

  const sorted = [...scores].sort((a, b) => b.score - a.score)
  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]

  // Low confidence check
  const lowConfidenceSkills = Object.entries(skills)
    .filter(([_, metric]) => metric.confidence === 'low')
    .map(([skill]) => skill)

  if (lowConfidenceSkills.length >= 3) {
    return `Keep practicing! You need ${3 - profile.today.attempts} more attempts today to improve your insights.`
  }

  // Balanced vs Imbalanced
  const scoreDiff = strongest.score - weakest.score
  if (scoreDiff > 30) {
    return `Your ${strongest.skill} is strong (${strongest.score}%). Focus on improving ${weakest.skill} (${weakest.score}%).`
  }

  // Trending well
  if (profile.today.accuracy >= 85) {
    return `Excellent work today! Your accuracy is ${profile.today.accuracy}%. Keep the streak going.`
  }

  return `You're making progress! Keep practicing to reach your next milestone.`
}

/**
 * Get next recommended action based on profile
 */
export function getNextAction(profile: SkillProfile): {
  label: string
  href: string
  description: string
} {
  const { skills, soundsDueToday } = profile

  // Priority: sounds due for review
  if (soundsDueToday > 0) {
    return {
      label: `Review ${soundsDueToday} sound${soundsDueToday !== 1 ? 's' : ''}`,
      href: '/review',
      description: 'Spaced repetition review',
    }
  }

  // Priority: weakest skill
  const scores = [
    { skill: 'pronunciation', score: skills.pronunciation.score, href: '/practice' },
    { skill: 'listening', score: skills.listening.score, href: '/practice' },
    { skill: 'vocabulary', score: skills.vocabulary.score, href: '/decks' },
  ]

  const weakest = [...scores].sort((a, b) => a.score - b.score)[0]

  if (weakest.score < 60) {
    const action = weakest.skill === 'vocabulary' ? 'Vocabulary drill' : `${weakest.skill} practice`
    return {
      label: action,
      href: weakest.href,
      description: `Improve your ${weakest.skill} (${weakest.score}%)`,
    }
  }

  // Default: general practice
  return {
    label: 'Continue practicing',
    href: '/practice',
    description: 'Strengthen all skills',
  }
}
