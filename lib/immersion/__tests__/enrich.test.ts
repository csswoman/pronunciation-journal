import { describe, it, expect } from 'vitest'
import {
  isPlaceholderVocabulary,
  parseImmersionEnrichment,
} from '../enrich'

const validPayload = {
  summary: 'Podrás reconocer y producir el ritmo natural del inglés hablado en frases cotidianas.',
  keyVocabulary: [
    { word: 'gonna', ipa: '/ˈɡʌnə/', definition: 'Forma reducida de "going to" en habla rápida.', contextSentence: "I'm gonna call you later." },
    { word: 'wanna', ipa: '/ˈwɑnə/', definition: 'Forma reducida de "want to".', contextSentence: 'Do you wanna go?' },
    { word: 'kinda', ipa: '/ˈkaɪndə/', definition: 'Forma reducida de "kind of".', contextSentence: "It's kinda cold." },
  ],
  targetPhrases: [
    { phrase: "What're you doing?", ipa: '/ˈwʌtər juː ˈduːɪŋ/', note: 'Une "what" y "are" en un solo golpe.' },
    { phrase: 'I dunno', ipa: '/aɪ dəˈnoʊ/', note: 'Reducción muy común de "I don\'t know".' },
  ],
  quiz: [
    { question: '¿Qué es una forma reducida?', options: ['a', 'b', 'c', 'd'], correctIndex: 0, explanation: 'Es una contracción del habla rápida.' },
    { question: '¿Cuándo se usa?', options: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'En registro informal hablado.' },
  ],
}

describe('isPlaceholderVocabulary', () => {
  it('rejects bare numbers left over from slug-derived templates', () => {
    expect(isPlaceholderVocabulary({ word: '3', ipa: '/3/' })).toBe(true)
  })

  it('rejects IPA that merely echoes the word', () => {
    expect(isPlaceholderVocabulary({ word: 'friends', ipa: '/friends/' })).toBe(true)
  })

  it('accepts a real word with real IPA', () => {
    expect(isPlaceholderVocabulary({ word: 'gonna', ipa: '/ˈɡʌnə/' })).toBe(false)
  })
})

describe('parseImmersionEnrichment', () => {
  it('parses a valid payload and assigns sequential quiz ids', () => {
    const result = parseImmersionEnrichment(JSON.stringify(validPayload))
    expect(result.keyVocabulary).toHaveLength(3)
    expect(result.quiz.map((q) => q.id)).toEqual(['q1', 'q2'])
  })

  it('strips markdown fences before parsing', () => {
    const fenced = '```json\n' + JSON.stringify(validPayload) + '\n```'
    expect(parseImmersionEnrichment(fenced).summary).toBe(validPayload.summary)
  })

  it('throws when the model returns placeholder vocabulary', () => {
    const bad = {
      ...validPayload,
      keyVocabulary: [
        { word: '12', ipa: '/12/', definition: 'Placeholder generado por plantilla.', contextSentence: 'Study how 12 is used.' },
        ...validPayload.keyVocabulary.slice(1),
      ],
    }
    expect(() => parseImmersionEnrichment(JSON.stringify(bad))).toThrow(/placeholder/)
  })

  it('rejects a quiz question without exactly four options', () => {
    const bad = {
      ...validPayload,
      quiz: [{ question: '¿Y esto?', options: ['a', 'b'], correctIndex: 0, explanation: 'Faltan opciones.' }],
    }
    expect(() => parseImmersionEnrichment(JSON.stringify(bad))).toThrow()
  })
})
