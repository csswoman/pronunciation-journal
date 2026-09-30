import { describe, expect, it } from 'vitest'
import { matchAnswer, type AnswerSpec } from '../answer-match'
import { matchesAcceptedAnswer } from '../grading-pipeline'
import { evaluateExercise } from '../evaluator'
import type { ExerciseDesign } from '../design'

describe('Contractions equivalences characterization', () => {
  describe('matchAnswer with contractions', () => {
    it('accepts valid has/is contractions based on reference (He has been -> He\'s been)', () => {
      const spec: AnswerSpec = {
        accept: ['He has been waiting here.'],
      }
      const result = matchAnswer("He's been waiting here", spec)
      expect(result.kind).toMatch(/exact|variant/)
      if (result.kind === 'exact' || result.kind === 'variant') {
        expect(result.score).toBe(100)
      }
    })

    it('accepts valid had/would contractions based on reference (I had finished -> I\'d finished)', () => {
      const spec: AnswerSpec = {
        accept: ['I had finished my homework.'],
      }
      const result = matchAnswer("I'd finished my homework", spec)
      expect(result.kind).toMatch(/exact|variant/)
      if (result.kind === 'exact' || result.kind === 'variant') {
        expect(result.score).toBe(100)
      }
    })

    it('rejects had before a base verb while accepting the contextual would form', () => {
      const spec: AnswerSpec = { accept: ["I'd like to go"] }

      expect(matchAnswer('I had like to go', spec).kind).toBe('no_match')
      expect(matchAnswer('I would like to go', spec).kind).toMatch(/exact|variant/)
    })

    it('accepts valid It has got -> It\'s got', () => {
      const spec: AnswerSpec = {
        accept: ['It has got much colder.'],
      }
      const result = matchAnswer("It's got much colder", spec)
      expect(result.kind).toMatch(/exact|variant/)
      if (result.kind === 'exact' || result.kind === 'variant') {
        expect(result.score).toBe(100)
      }
    })

    it('accepts don\'t / do not interchangeably', () => {
      const spec: AnswerSpec = {
        accept: ['I do not know the answer.'],
      }
      const result = matchAnswer("I don't know the answer", spec)
      expect(result.kind).toMatch(/exact|variant/)
    })

    it('rejects possessive expansions (John\'s book does NOT match John is book or John has book)', () => {
      const spec: AnswerSpec = {
        accept: ["John's book is on the table."],
      }
      const resultIs = matchAnswer("John is book is on the table", spec)
      expect(resultIs.kind).toBe('no_match')

      const resultHas = matchAnswer("John has book is on the table", spec)
      expect(resultHas.kind).toBe('no_match')
    })

    it('rejects invalid auxiliary expansion (He is happy does NOT match He has happy)', () => {
      const spec: AnswerSpec = {
        accept: ['He is very happy today.'],
      }
      const result = matchAnswer('He has very happy today', spec)
      expect(result.kind).toBe('no_match')
    })

    it('resolves is versus has from the phrase after the contraction', () => {
      expect(matchAnswer('He is ready', { accept: ["He's ready"] }).kind).toMatch(/exact|variant/)
      expect(matchAnswer('He has ready', { accept: ["He's ready"] }).kind).toBe('no_match')
      expect(matchAnswer('He is been waiting', { accept: ["He's been waiting"] }).kind).toBe('no_match')
    })

    it('respects contraction restrictions (require vs forbid)', () => {
      const specRequire: AnswerSpec = {
        accept: ["I don't know."],
        contractions: 'require',
      }
      const resRequireMismatch = matchAnswer('I do not know', specRequire)
      expect(resRequireMismatch.kind).toBe('contraction_mismatch')
      if (resRequireMismatch.kind === 'contraction_mismatch') {
        expect(resRequireMismatch.expectedForm).toBe('contracted')
      }

      const specForbid: AnswerSpec = {
        accept: ['I do not know.'],
        contractions: 'forbid',
      }
      const resForbidMismatch = matchAnswer("I don't know", specForbid)
      expect(resForbidMismatch.kind).toBe('contraction_mismatch')
      if (resForbidMismatch.kind === 'contraction_mismatch') {
        expect(resForbidMismatch.expectedForm).toBe('full')
      }
    })

    it('preserves contraction restrictions for equivalent saved answers', () => {
      const forbidResult = matchAnswer(
        "I don't know",
        { accept: ['They do not know'], contractions: 'forbid' },
        { extraAccepted: ["I don't know"] },
      )
      expect(forbidResult).toMatchObject({ kind: 'contraction_mismatch', expectedForm: 'full' })

      const requireResult = matchAnswer(
        'I do not know',
        { accept: ["They don't know"], contractions: 'require' },
        { extraAccepted: ['I do not know'] },
      )
      expect(requireResult).toMatchObject({ kind: 'contraction_mismatch', expectedForm: 'contracted' })
    })

    it('handles curly apostrophes transparently (He’s been -> He has been)', () => {
      const spec: AnswerSpec = {
        accept: ['He has been here.'],
      }
      const result = matchAnswer('He’s been here', spec)
      expect(result.kind).toMatch(/exact|variant/)
    })

    it('still rejects typos in target tokens despite contractions', () => {
      const spec: AnswerSpec = {
        accept: ['He has been waiting.'],
        targetTokens: ['waiting'],
      }
      // Typo in target token "waiting" -> "waitng" should not be forgiven
      const result = matchAnswer("He's been waitng", spec)
      expect(result.kind).toBe('no_match')
    })
  })

  describe('matchesAcceptedAnswer (grading-pipeline)', () => {
    it('matches He has been with He\'s been', () => {
      expect(matchesAcceptedAnswer("He's been working hard", ['He has been working hard'])).toBe(true)
      expect(matchesAcceptedAnswer("He has been working hard", ["He's been working hard"])).toBe(true)
    })

    it('matches I had finished with I\'d finished', () => {
      expect(matchesAcceptedAnswer("I'd finished already", ['I had finished already'])).toBe(true)
      expect(matchesAcceptedAnswer("I had finished already", ["I'd finished already"])).toBe(true)
    })

    it('matches It has got with It\'s got', () => {
      expect(matchesAcceptedAnswer("It's got worse", ['It has got worse'])).toBe(true)
      expect(matchesAcceptedAnswer("It has got worse", ["It's got worse"])).toBe(true)
    })

    it('matches don\'t and do not', () => {
      expect(matchesAcceptedAnswer("I don't agree", ['I do not agree'])).toBe(true)
      expect(matchesAcceptedAnswer("I do not agree", ["I don't agree"])).toBe(true)
    })

    it('does NOT match possessive John\'s book with John is book', () => {
      expect(matchesAcceptedAnswer("John is book", ["John's book"])).toBe(false)
      expect(matchesAcceptedAnswer("John has book", ["John's book"])).toBe(false)
    })

    it('rejects had before a base verb for an ambiguous contracted reference', () => {
      expect(matchesAcceptedAnswer('I had like to go', ["I'd like to go"])).toBe(false)
    })
  })

  describe('evaluateExercise (Coach evaluator)', () => {
    const baseDesign: ExerciseDesign = {
      id: 'coach-ex-1',
      type: 'fill_blank',
      instruction: 'Complete the sentence',
      learningGoal: 'Practice negative forms and auxiliaries',
      correctAnswer: "don't know",
      constraint: { type: 'exact_match', value: "don't know" },
      topic: 'auxiliaries',
      difficulty: 'a2',
      sentence: 'I ___ what to do.',
    }

    it('evaluates "do not know" as correct when correctAnswer is "don\'t know"', () => {
      const result = evaluateExercise('do not know', baseDesign)
      expect(result.correct).toBe(true)
      expect(result.category).toBe('correct')
    })

    it('evaluates "don\'t know" as correct when correctAnswer is "do not know"', () => {
      const design: ExerciseDesign = {
        ...baseDesign,
        correctAnswer: 'do not know',
      }
      const result = evaluateExercise("don't know", design)
      expect(result.correct).toBe(true)
      expect(result.category).toBe('correct')
    })

    it('evaluates "he\'s been" as correct when correctAnswer is "he has been"', () => {
      const design: ExerciseDesign = {
        ...baseDesign,
        correctAnswer: 'he has been',
      }
      const result = evaluateExercise("he's been", design)
      expect(result.correct).toBe(true)
      expect(result.category).toBe('correct')
    })

    it('does not credit had before a base verb when the answer key uses I\'d', () => {
      const design: ExerciseDesign = {
        ...baseDesign,
        correctAnswer: "I'd like to go",
      }
      const result = evaluateExercise('I had like to go', design)
      expect(result.correct).toBe(false)
    })
  })
})
