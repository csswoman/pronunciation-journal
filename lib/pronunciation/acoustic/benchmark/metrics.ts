export interface BenchmarkTrial {
  targetVowel: string
  predictedVowel: string | null
  abstained: boolean
  humanScore: number
}

export interface BenchmarkMetrics {
  agreementRate: number
  perVowelAgreement: Record<string, number>
  abstentionRate: number
  confusionMatrix: Record<string, Record<string, number>>
  trialCount: number
}

export function computeBenchmarkMetrics(trials: BenchmarkTrial[]): BenchmarkMetrics {
  const scored = trials.filter((t) => !t.abstained)
  const correct = scored.filter((t) => t.predictedVowel === t.targetVowel)

  const perVowelAgreement: Record<string, number> = {}
  const vowels = Array.from(new Set(trials.map((t) => t.targetVowel)))
  for (const vowel of vowels) {
    const vowelTrials = scored.filter((t) => t.targetVowel === vowel)
    const vowelCorrect = vowelTrials.filter((t) => t.predictedVowel === vowel)
    perVowelAgreement[vowel] = vowelTrials.length === 0 ? 0 : vowelCorrect.length / vowelTrials.length
  }

  const confusionMatrix: Record<string, Record<string, number>> = {}
  for (const vowel of vowels) confusionMatrix[vowel] = {}
  for (const trial of scored) {
    const predicted = trial.predictedVowel as string
    confusionMatrix[trial.targetVowel][predicted] = (confusionMatrix[trial.targetVowel][predicted] ?? 0) + 1
  }

  return {
    agreementRate: scored.length === 0 ? 0 : correct.length / scored.length,
    perVowelAgreement,
    abstentionRate: trials.length === 0 ? 0 : trials.filter((t) => t.abstained).length / trials.length,
    confusionMatrix,
    trialCount: trials.length,
  }
}
