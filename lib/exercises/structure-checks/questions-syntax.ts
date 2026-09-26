import type { StructureCheck } from './types'

const CONTRACTION_WORDS = new Set([
  "i'm", "you're", "he's", "she's", "it's", "we're", "they're", "that's", "there's", "what's", "who's",
  "isn't", "aren't", "wasn't", "weren't", "don't", "doesn't", "didn't", "haven't", "hasn't", "hadn't",
  "can't", "couldn't", "won't", "wouldn't", "shouldn't", "i've", "you've", "we've", "they've",
  "i'll", "you'll", "we'll", "they'll", "i'd", "you'd", "he'd", "she'd", "we'd", "they'd", "let's",
])

const AUXILIARIES = new Set([
  'do', 'does', 'did', 'is', 'are', 'am', 'was', 'were', 'have', 'has', 'had',
  'can', 'could', 'will', 'would', 'should', 'might', 'must',
])

export const QUESTIONS_SYNTAX_CHECKS: Record<string, StructureCheck> = {
  contraction: {
    id: 'contraction',
    minLevel: 'A1',
    labelEs: 'contracción (ej. I\'m, don\'t)',
    hintEs: 'Usa una contracción en tu respuesta (ej. I\'m, isn\'t, don\'t, they\'re).',
    checkEn: 'The response must contain at least one contracted form.',
    test: (tokens) => {
      return tokens.some((t) => {
        const w = t.toLowerCase()
        return CONTRACTION_WORDS.has(w) || (w.includes("'") && w.length >= 3)
      })
    },
  },

  negative: {
    id: 'negative',
    minLevel: 'A1',
    labelEs: 'oración negativa (not / contracción negativa)',
    hintEs: 'Haz una oración negativa usando "not", "never" o una contracción con "n\'t".',
    checkEn: 'The response must be negative (containing not, never, or a negative contraction).',
    test: (tokens) => {
      return tokens.some((t) => {
        const w = t.toLowerCase()
        return w === 'not' || w === 'never' || w === 'no' || w.endsWith("n't")
      })
    },
  },

  yes_no_question: {
    id: 'yes_no_question',
    minLevel: 'A1',
    labelEs: 'pregunta sí/no',
    hintEs: 'Empieza la pregunta con un auxiliar (Do, Does, Is, Are, Can...).',
    checkEn: 'The response must be a yes/no question starting with an auxiliary verb.',
    test: (tokens) => {
      if (tokens.length < 2) return false
      const first = tokens[0].toLowerCase()
      return AUXILIARIES.has(first)
    },
  },

  wh_question: {
    id: 'wh_question',
    minLevel: 'A2',
    labelEs: 'pregunta con wh-',
    hintEs: 'Formula una pregunta comenzando con What, Where, When, Why, Who o How.',
    checkEn: 'The response must be a question starting with a wh- question word.',
    test: (tokens) => {
      if (tokens.length < 2) return false
      const whWords = new Set(['what', 'where', 'when', 'why', 'who', 'which', 'how', 'whose', 'whom'])
      const first = tokens[0].toLowerCase()
      if (whWords.has(first)) {
        const second = tokens[1]?.toLowerCase()
        const third = tokens[2]?.toLowerCase()
        return AUXILIARIES.has(second) || AUXILIARIES.has(third) || first === 'how'
      }
      return false
    },
  },

  comparative: {
    id: 'comparative',
    minLevel: 'A2',
    labelEs: 'comparativo (more... than / -er than)',
    hintEs: 'Usa una comparación con "more ... than", "-er than", "better than" o "as ... as".',
    checkEn: 'The response must contain a comparative structure.',
    test: (tokens) => {
      for (let i = 0; i < tokens.length; i++) {
        const w = tokens[i].toLowerCase()
        if ((w === 'more' || w === 'less' || w === 'better' || w === 'worse' || (w.endsWith('er') && w.length >= 4)) && tokens.slice(i + 1).some((t) => t.toLowerCase() === 'than')) {
          return true
        }
        if (w === 'as' && tokens.slice(i + 2).some((t) => t.toLowerCase() === 'as')) {
          return true
        }
      }
      return false
    },
  },

  superlative: {
    id: 'superlative',
    minLevel: 'A2',
    labelEs: 'superlativo (the most / the -est)',
    hintEs: 'Usa un superlativo precedido de "the" (ej. the best, the most interesting, the biggest).',
    checkEn: 'The response must contain a superlative structure with "the".',
    test: (tokens) => {
      for (let i = 0; i < tokens.length - 1; i++) {
        if (tokens[i].toLowerCase() === 'the') {
          const next = tokens[i + 1].toLowerCase()
          if (next === 'most' || next === 'best' || next === 'worst' || (next.endsWith('est') && next.length >= 5)) {
            return true
          }
        }
      }
      return false
    },
  },

  relative_clause: {
    id: 'relative_clause',
    minLevel: 'B1',
    labelEs: 'oración de relativo (who / which / that)',
    hintEs: 'Usa una oración de relativo con "who", "which", "that", "whose" o "where".',
    checkEn: 'The response must contain a relative clause.',
    test: (tokens) => {
      const relPronouns = new Set(['who', 'which', 'whose', 'where'])
      for (let i = 1; i < tokens.length - 1; i++) {
        const w = tokens[i].toLowerCase()
        if (relPronouns.has(w)) return true
        if (w === 'that' && i >= 2 && tokens.length - i >= 2) return true
      }
      return false
    },
  },

  reported_speech: {
    id: 'reported_speech',
    minLevel: 'B1',
    labelEs: 'estilo indirecto (said / told / asked)',
    hintEs: 'Usa estilo indirecto con verbos como "said", "told" o "asked".',
    checkEn: 'The response must contain reported speech.',
    test: (tokens) => {
      const reporting = new Set(['said', 'told', 'asked', 'explained', 'mentioned', 'stated'])
      return tokens.some((t) => reporting.has(t.toLowerCase()))
    },
  },

  negative_inversion: {
    id: 'negative_inversion',
    minLevel: 'C1',
    labelEs: 'inversión negativa (Never have I..., Seldom do...)',
    hintEs: 'Comienza con un adverbio negativo restrictivo seguido de auxiliar (ej. Never have I seen..., Seldom do we...).',
    checkEn: 'The response must contain a negative inversion starting with a restrictive negative adverb followed by an auxiliary.',
    test: (tokens) => {
      if (tokens.length < 3) return false
      const w1 = tokens[0].toLowerCase()
      const w2 = tokens[1].toLowerCase()
      const w3 = tokens[2].toLowerCase()

      const singleAdverbs = new Set(['never', 'rarely', 'seldom', 'hardly', 'scarcely', 'little'])
      if (singleAdverbs.has(w1) && AUXILIARIES.has(w2)) return true

      if (w1 === 'not' && w2 === 'only' && AUXILIARIES.has(w3)) return true
      if (w1 === 'no' && w2 === 'sooner' && AUXILIARIES.has(w3)) return true
      if (w1 === 'only' && (w2 === 'then' || w2 === 'later' || w2 === 'when') && AUXILIARIES.has(w3)) return true
      if (w1 === 'at' && w2 === 'no' && tokens[3] && AUXILIARIES.has(tokens[3].toLowerCase())) return true
      if (w1 === 'under' && w2 === 'no' && tokens[3] && AUXILIARIES.has(tokens[3].toLowerCase())) return true
      return false
    },
  },

  cleft_what: {
    id: 'cleft_what',
    minLevel: 'C1',
    labelEs: 'oración hendida con what (What I need is...)',
    hintEs: 'Comienza con "What" seguido de una cláusula y el verbo to be (ej. What I need is a break).',
    checkEn: 'The response must contain a wh-cleft sentence starting with "What".',
    test: (tokens) => {
      if (tokens.length < 4) return false
      if (tokens[0].toLowerCase() !== 'what') return false
      const be = new Set(['is', 'was', 'are', 'were', "'s"])
      return tokens.slice(2).some((t) => be.has(t.toLowerCase()))
    },
  },

  cleft_it: {
    id: 'cleft_it',
    minLevel: 'C1',
    labelEs: 'oración hendida con it (It was ... that/who)',
    hintEs: 'Comienza con "It is" o "It was" y conecta con "that" o "who" (ej. It was John who helped me).',
    checkEn: 'The response must contain an it-cleft sentence (It is/was ... that/who).',
    test: (tokens) => {
      if (tokens.length < 4) return false
      const first = tokens[0].toLowerCase()
      const second = tokens[1].toLowerCase()
      const isItBe = (first === 'it' && (second === 'is' || second === 'was')) || first === "it's"
      if (!isItBe) return false
      const connectors = new Set(['that', 'who', 'which'])
      return tokens.slice(2).some((t) => connectors.has(t.toLowerCase()))
    },
  },
}
