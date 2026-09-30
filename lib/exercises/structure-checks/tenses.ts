import type { StructureCheck } from './types'
import { isParticipleVerb, isPastSimpleVerb } from './irregular-verbs'

const ADVERB_INTERRUPTIONS = new Set([
  'never', 'already', 'just', 'ever', 'always', 'not', 'really', 'also', 'often',
  'hardly', 'scarcely', 'definitely', 'certainly', 'still',
])

function findAuxiliaryFollowedBy(
  tokens: string[],
  isAux: (w: string) => boolean,
  predicate: (w: string) => boolean,
  maxGap = 2,
): boolean {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].toLowerCase()
    if (isAux(t)) {
      for (let j = i + 1; j <= Math.min(i + 1 + maxGap, tokens.length - 1); j++) {
        const next = tokens[j].toLowerCase()
        if (predicate(next)) return true
        if (!ADVERB_INTERRUPTIONS.has(next)) break
      }
    }
  }
  return false
}

export function isHaveAux(w: string): boolean {
  return w === 'have' || w === 'has' || w.endsWith("'ve") || w.endsWith("'s") || w === "haven't" || w === "hasn't"
}

export function isHadAux(w: string): boolean {
  return w === 'had' || w === "hadn't" || w.endsWith("'d")
}

export function isWillAux(w: string): boolean {
  return w === 'will' || w === "won't" || w.endsWith("'ll")
}

export function isBeAux(w: string): boolean {
  return (
    w === 'is' || w === 'are' || w === 'was' || w === 'were' || w === 'be' ||
    w === 'been' || w === 'being' || w.endsWith("'s") || w.endsWith("'re") ||
    w.endsWith("'m") || w === "isn't" || w === "aren't" || w === "wasn't" || w === "weren't"
  )
}

export const TENSE_CHECKS: Record<string, StructureCheck> = {
  past_simple: {
    id: 'past_simple',
    minLevel: 'A2',
    labelEs: 'past simple (verbo en pasado)',
    hintEs: 'Usa un verbo en pasado simple (ej. went, bought, was, played).',
    checkEn: 'The response must contain at least one past simple verb (e.g. went, bought, was). Present-tense-only responses fail.',
    test: (tokens) => {
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i].toLowerCase()
        if (t === "didn't" || t === "wasn't" || t === "weren't" || (t === 'did' && tokens[i + 1]?.toLowerCase() === 'not')) return true
        if (isPastSimpleVerb(t)) return true
      }
      return false
    },
  },

  past_continuous: {
    id: 'past_continuous',
    minLevel: 'B1',
    labelEs: 'past continuous (was/were + -ing)',
    hintEs: 'Usa past continuous: was o were seguido de un verbo en -ing.',
    checkEn: 'The response must contain a past continuous ("was/were" + -ing).',
    test: (tokens) => {
      const aux = (w: string) => w === 'was' || w === 'were' || w === "wasn't" || w === "weren't"
      return findAuxiliaryFollowedBy(tokens, aux, (w) => w.endsWith('ing') && w.length >= 5)
    },
  },

  present_perfect: {
    id: 'present_perfect',
    minLevel: 'B1',
    labelEs: 'present perfect (have/has + participio)',
    hintEs: 'Usa present perfect: have o has seguido de un participio (ej. have seen, has worked).',
    checkEn: 'The response must use present perfect (have/has + past participle). Past simple alone fails.',
    test: (tokens) => {
      return findAuxiliaryFollowedBy(tokens, isHaveAux, (w) => isParticipleVerb(w))
    },
  },

  past_perfect: {
    id: 'past_perfect',
    minLevel: 'B1',
    labelEs: 'past perfect (had + participio)',
    hintEs: 'Usa past perfect: had seguido de un participio (ej. had eaten, had finished).',
    checkEn: 'The response must use past perfect (had + past participle).',
    test: (tokens) => {
      return findAuxiliaryFollowedBy(tokens, isHadAux, (w) => isParticipleVerb(w))
    },
  },

  going_to_future: {
    id: 'going_to_future',
    minLevel: 'A2',
    labelEs: 'futuro con going to',
    hintEs: 'Usa la estructura "going to" seguida de un verbo (ej. I am going to visit).',
    checkEn: 'The response must express future with "going to".',
    test: (tokens) => {
      for (let i = 0; i < tokens.length - 2; i++) {
        if (tokens[i].toLowerCase() === 'going' && tokens[i + 1].toLowerCase() === 'to') {
          const next = tokens[i + 2].toLowerCase()
          if (/^[a-z]+$/.test(next) && next !== 'the' && next !== 'a') return true
        }
      }
      return false
    },
  },

  will_future: {
    id: 'will_future',
    minLevel: 'A2',
    labelEs: 'futuro con will',
    hintEs: 'Usa "will" o "won\'t" para hablar de futuro.',
    checkEn: 'The response must express future with "will" or "won\'t".',
    test: (tokens) => {
      return findAuxiliaryFollowedBy(tokens, isWillAux, (w) => /^[a-z]+$/.test(w) && w.length >= 2)
    },
  },

  passive: {
    id: 'passive',
    minLevel: 'B1',
    labelEs: 'voz pasiva (be + participio)',
    hintEs: 'Usa la voz pasiva con una forma del verbo to be y un participio (ej. was written, is made).',
    checkEn: 'The response must contain a passive voice construction (form of be + past participle).',
    test: (tokens) => {
      return findAuxiliaryFollowedBy(tokens, isBeAux, (w) => isParticipleVerb(w))
    },
  },

  modal_perfect: {
    id: 'modal_perfect',
    minLevel: 'B2',
    labelEs: 'modal perfect (modal + have + participio)',
    hintEs: 'Usa un modal en pasado: should/would/could/might/must + have + participio.',
    checkEn: 'The response must contain a modal perfect construction (modal + have + past participle).',
    test: (tokens) => {
      const modals = new Set(['should', 'would', 'could', 'might', 'must', 'may'])
      for (let i = 0; i < tokens.length - 2; i++) {
        const m = tokens[i].toLowerCase()
        if (modals.has(m)) {
          let haveIndex = -1
          for (let j = i + 1; j <= Math.min(i + 3, tokens.length - 1); j++) {
            const next = tokens[j].toLowerCase()
            if (next === 'have' || next.endsWith("'ve")) {
              haveIndex = j
              break
            }
          }
          if (haveIndex !== -1) {
            for (let k = haveIndex + 1; k <= Math.min(haveIndex + 2, tokens.length - 1); k++) {
              if (isParticipleVerb(tokens[k].toLowerCase())) return true
            }
          }
        }
      }
      return false
    },
  },

  participle_clause: {
    id: 'participle_clause',
    minLevel: 'B2',
    labelEs: 'cláusula de participio (-ing / -ed)',
    hintEs: 'Comienza o conecta con una cláusula de participio (ej. Having finished..., Walking home...).',
    checkEn: 'The response must contain a participle clause.',
    test: (tokens) => {
      if (tokens.length < 3) return false
      const first = tokens[0].toLowerCase()
      if (first === 'having' && isParticipleVerb(tokens[1]?.toLowerCase() ?? '')) return true
      if (first.endsWith('ing') && first.length >= 5) return true
      if (isParticipleVerb(first)) return true
      for (let i = 1; i < tokens.length - 2; i++) {
        if (tokens[i].toLowerCase() === 'having' && isParticipleVerb(tokens[i + 1]?.toLowerCase() ?? '')) return true
      }
      return false
    },
  },
}
