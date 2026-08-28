export interface DiffToken {
  text: string
  type: 'equal' | 'delete' | 'insert'
}

export function diffWords(
  original: string,
  modified: string,
): { originalDiff: DiffToken[]; modifiedDiff: DiffToken[] } {
  const origWords = original.trim().split(/\s+/).filter(Boolean)
  const modWords = modified.trim().split(/\s+/).filter(Boolean)
  const m = origWords.length
  const n = modWords.length

  if (m === 0) {
    return {
      originalDiff: [],
      modifiedDiff: modWords.map((text) => ({ text, type: 'insert' })),
    }
  }

  if (n === 0) {
    return {
      originalDiff: origWords.map((text) => ({ text, type: 'delete' })),
      modifiedDiff: [],
    }
  }

  const clean = (w: string) => w.toLowerCase().replace(/[^\w']/g, '')

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (clean(origWords[i]) === clean(modWords[j])) {
        dp[i + 1][j + 1] = dp[i][j] + 1
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  let i = m
  let j = n
  const origTokens: DiffToken[] = []
  const modTokens: DiffToken[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && clean(origWords[i - 1]) === clean(modWords[j - 1])) {
      origTokens.unshift({ text: origWords[i - 1], type: 'equal' })
      modTokens.unshift({ text: modWords[j - 1], type: 'equal' })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      modTokens.unshift({ text: modWords[j - 1], type: 'insert' })
      j--
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      origTokens.unshift({ text: origWords[i - 1], type: 'delete' })
      i--
    }
  }

  return { originalDiff: origTokens, modifiedDiff: modTokens }
}
