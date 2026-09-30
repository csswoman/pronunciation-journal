import type { StructureCheck } from './types'
import { isParticipleVerb, isPastSimpleVerb } from './irregular-verbs'

function hasWord(tokens: string[], word: string): boolean {
  return tokens.some((t) => t.toLowerCase() === word)
}

function hasWill(tokens: string[]): boolean {
  return tokens.some((t) => {
    const w = t.toLowerCase()
    return w === 'will' || w === "won't" || w.endsWith("'ll")
  })
}

function hasWould(tokens: string[]): boolean {
  return tokens.some((t) => {
    const w = t.toLowerCase()
    return w === 'would' || w === 'could' || w === 'might' || w === 'must' || w === "wouldn't" || w.endsWith("'d")
  })
}

function hasHad(tokens: string[]): boolean {
  return tokens.some((t) => {
    const w = t.toLowerCase()
    return w === 'had' || w === "hadn't" || w.endsWith("'d")
  })
}

function hasHave(tokens: string[]): boolean {
  return tokens.some((t) => {
    const w = t.toLowerCase()
    return w === 'have' || w.endsWith("'ve")
  })
}

export const CONDITIONAL_CHECKS: Record<string, StructureCheck> = {
  first_conditional: {
    id: 'first_conditional',
    minLevel: 'A2',
    labelEs: 'first conditional (if + presente, will + verbo)',
    hintEs: 'Usa primer condicional: una parte con "if" en presente y otra con "will" o "won\'t".',
    checkEn: 'The response must contain a first conditional structure with an "if" clause and "will/won\'t".',
    test: (tokens) => {
      return hasWord(tokens, 'if') && hasWill(tokens)
    },
  },

  second_conditional: {
    id: 'second_conditional',
    minLevel: 'B1',
    labelEs: 'second conditional (if + pasado, would + verbo)',
    hintEs: 'Usa segundo condicional: "if" con un verbo en pasado simple y "would" o "could".',
    checkEn: 'The response must contain a second conditional: an "if" clause with past simple plus a "would" main clause.',
    test: (tokens) => {
      const ifFound = hasWord(tokens, 'if')
      const wouldFound = hasWould(tokens)
      const pastFound = tokens.some((t) => isPastSimpleVerb(t.toLowerCase()))
      return ifFound && wouldFound && pastFound
    },
  },

  third_conditional: {
    id: 'third_conditional',
    minLevel: 'B2',
    labelEs: 'third conditional (if + had + participio, would have + participio)',
    hintEs: 'Usa tercer condicional: "if" con had + participio, y would/could/might have + participio.',
    checkEn: 'The response must contain a third conditional: "if" + had + participle and would/could/might + have + participle.',
    test: (tokens) => {
      const ifFound = hasWord(tokens, 'if')
      const hadFound = hasHad(tokens)
      const wouldFound = hasWould(tokens)
      const haveFound = hasHave(tokens)
      const participles = tokens.filter((t) => isParticipleVerb(t.toLowerCase()))
      return ifFound && hadFound && wouldFound && haveFound && participles.length >= 2
    },
  },

  mixed_conditional: {
    id: 'mixed_conditional',
    minLevel: 'B2',
    labelEs: 'mixed conditional',
    hintEs: 'Usa condicional mixto combinando pasado y presente (ej. If I had listened, I would be happy now).',
    checkEn: 'The response must contain a mixed conditional construction.',
    test: (tokens) => {
      const ifFound = hasWord(tokens, 'if')
      const wouldFound = hasWould(tokens)
      const hadFound = hasHad(tokens)
      const haveFound = hasHave(tokens)
      const pastFound = tokens.some((t) => isPastSimpleVerb(t.toLowerCase()))

      // Pattern 1: If had + participle, would + base (no have)
      if (ifFound && hadFound && wouldFound && !haveFound) return true
      // Pattern 2: If past simple, would have + participle
      if (ifFound && pastFound && wouldFound && haveFound) return true
      return false
    },
  },

  wish_past: {
    id: 'wish_past',
    minLevel: 'B2',
    labelEs: 'wish + past simple (deseo sobre el presente)',
    hintEs: 'Usa "wish" seguido de un verbo en pasado simple (ej. I wish I had more time).',
    checkEn: 'The response must contain wish followed by past simple.',
    test: (tokens) => {
      for (let i = 0; i < tokens.length - 1; i++) {
        const t = tokens[i].toLowerCase()
        if (t === 'wish' || t === 'wishes') {
          for (let j = i + 1; j <= Math.min(i + 4, tokens.length - 1); j++) {
            const next = tokens[j].toLowerCase()
            if (next === 'had' || next === 'were' || isPastSimpleVerb(next)) return true
          }
        }
      }
      return false
    },
  },

  wish_past_perfect: {
    id: 'wish_past_perfect',
    minLevel: 'B2',
    labelEs: 'wish + past perfect (arrepentimiento sobre el pasado)',
    hintEs: 'Usa "wish" seguido de had + participio (ej. I wish I had known that).',
    checkEn: 'The response must contain wish followed by past perfect (had + past participle).',
    test: (tokens) => {
      for (let i = 0; i < tokens.length - 2; i++) {
        const t = tokens[i].toLowerCase()
        if (t === 'wish' || t === 'wishes') {
          for (let j = i + 1; j <= Math.min(i + 4, tokens.length - 1); j++) {
            const next = tokens[j].toLowerCase()
            if (next === 'had' || next.endsWith("'d")) {
              for (let k = j + 1; k <= Math.min(j + 3, tokens.length - 1); k++) {
                if (isParticipleVerb(tokens[k].toLowerCase())) return true
              }
            }
          }
        }
      }
      return false
    },
  },
}
