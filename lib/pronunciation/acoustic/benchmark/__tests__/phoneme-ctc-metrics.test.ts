import { describe, expect, it } from 'vitest'
import {
  computePhonemeCtcBenchmark,
  computePhonemeMetrics,
  percentile,
  type PhonemeTrial,
} from '../phoneme-ctc-metrics'
import {
  decidePhonemeGate,
  phaseCUnlocked,
  PHONEME_CTC_MAX_FALSE_ALARM_RATE,
  PHONEME_CTC_MAX_P95_LATENCY_MS,
  PHONEME_CTC_MIN_FLAGGED_PRECISION,
  PHONEME_CTC_MIN_HUMAN_ERRORS,
  PHONEME_CTC_MIN_PASSING_PHONEMES,
} from '../decision-thresholds'

function trials(
  expected: string,
  spec: { model: boolean; human: boolean; abstained?: boolean }[],
): PhonemeTrial[] {
  return spec.map((s) => ({
    expected,
    modelFlagged: s.model,
    humanFlagged: s.human,
    abstained: s.abstained ?? false,
  }))
}

function repeat(
  expected: string,
  count: number,
  s: { model: boolean; human: boolean },
): PhonemeTrial[] {
  return trials(expected, Array.from({ length: count }, () => s))
}

describe('computePhonemeMetrics', () => {
  it('calcula precisión, falsa alarma y recall sobre los mismos ensayos', () => {
    const m = computePhonemeMetrics(
      trials('V', [
        { model: true, human: true }, // acierto
        { model: true, human: true }, // acierto
        { model: true, human: false }, // falsa alarma
        { model: false, human: true }, // error no detectado
        { model: false, human: false },
        { model: false, human: false },
      ]),
    )
    expect(m.flaggedPrecision).toBeCloseTo(2 / 3)
    expect(m.falseAlarmRate).toBeCloseTo(1 / 3)
    expect(m.recall).toBeCloseTo(2 / 3)
    expect(m.humanErrorCount).toBe(3)
    expect(m.humanCorrectCount).toBe(3)
  })

  it('excluye los ensayos con abstención de todas las métricas', () => {
    const m = computePhonemeMetrics(
      trials('V', [
        { model: true, human: true },
        { model: true, human: false, abstained: true },
      ]),
    )
    expect(m.flaggedPrecision).toBe(1)
    expect(m.falseAlarmRate).toBe(0)
    expect(m.abstentionRate).toBeCloseTo(0.5)
    expect(m.trialCount).toBe(2)
  })

  it('no inventa un 100% cuando el modelo no marcó nada', () => {
    const m = computePhonemeMetrics(trials('V', [{ model: false, human: true }]))
    expect(m.flaggedPrecision).toBe(0)
    expect(m.recall).toBe(0)
  })
})

describe('percentile', () => {
  it('devuelve null sin datos, en vez de un cero engañoso', () => {
    expect(percentile([], 95)).toBeNull()
  })

  it('no depende del orden de entrada', () => {
    expect(percentile([300, 100, 200], 50)).toBe(200)
    expect(percentile([100, 200, 300], 50)).toBe(200)
  })

  it('el p95 de 20 valores es el penúltimo mayor', () => {
    const values = Array.from({ length: 20 }, (_, i) => (i + 1) * 100)
    expect(percentile(values, 95)).toBe(1900)
  })
})

describe('computePhonemeCtcBenchmark', () => {
  it('agrupa por fonema y conserva el total', () => {
    const report = computePhonemeCtcBenchmark([
      ...repeat('V', 4, { model: true, human: true }),
      ...repeat('IY', 2, { model: true, human: false }),
    ])
    expect(Object.keys(report.byPhoneme)).toEqual(['IY', 'V'])
    expect(report.byPhoneme.V.flaggedPrecision).toBe(1)
    expect(report.byPhoneme.IY.falseAlarmRate).toBe(1)
    expect(report.overall.trialCount).toBe(6)
  })

  it('reporta la latencia solo si se midió', () => {
    expect(computePhonemeCtcBenchmark([]).latencyP95Ms).toBeNull()
    expect(computePhonemeCtcBenchmark([], [500, 900]).latencyP95Ms).toBe(900)
  })
})

describe('puerta de decisión pre-registrada', () => {
  it('conserva los umbrales del plan 038', () => {
    expect(PHONEME_CTC_MIN_FLAGGED_PRECISION).toBe(0.8)
    expect(PHONEME_CTC_MAX_FALSE_ALARM_RATE).toBe(0.05)
    expect(PHONEME_CTC_MIN_HUMAN_ERRORS).toBe(30)
    expect(PHONEME_CTC_MIN_PASSING_PHONEMES).toBe(4)
    expect(PHONEME_CTC_MAX_P95_LATENCY_MS).toBe(3000)
  })

  it('pasa solo con precisión alta y falsa alarma baja', () => {
    expect(decidePhonemeGate({ flaggedPrecision: 0.8, falseAlarmRate: 0.05, humanErrorCount: 30 })).toBe('pass')
    expect(decidePhonemeGate({ flaggedPrecision: 0.79, falseAlarmRate: 0.01, humanErrorCount: 30 })).toBe('fail')
    expect(decidePhonemeGate({ flaggedPrecision: 0.95, falseAlarmRate: 0.06, humanErrorCount: 30 })).toBe('fail')
  })

  it('llama no medible, no aprobado, al fonema con pocos errores anotados', () => {
    expect(decidePhonemeGate({ flaggedPrecision: 1, falseAlarmRate: 0, humanErrorCount: 29 })).toBe('not_measurable')
  })

  it('abre la fase C con 4 fonemas y latencia dentro del presupuesto', () => {
    const passing = { V: 'pass', TH: 'pass', DH: 'pass', Z: 'pass' } as const
    expect(phaseCUnlocked(passing, 2500)).toBe(true)
    expect(phaseCUnlocked(passing, 3001)).toBe(false)
    expect(phaseCUnlocked({ V: 'pass', TH: 'pass', DH: 'pass' }, 100)).toBe(false)
  })

  it('no abre la fase C si la latencia no se midió', () => {
    const passing = { V: 'pass', TH: 'pass', DH: 'pass', Z: 'pass' } as const
    expect(phaseCUnlocked(passing, null)).toBe(false)
  })

  it('no cuenta los no medibles como aprobados', () => {
    const mixed = { V: 'pass', TH: 'pass', DH: 'not_measurable', Z: 'not_measurable' } as const
    expect(phaseCUnlocked(mixed, 500)).toBe(false)
  })
})
