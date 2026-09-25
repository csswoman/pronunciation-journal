import { describe, expect, it } from 'vitest'
import { parsePhonemeCtcFlags, runPhonemeCtcBenchmark } from '../run-benchmark'
import { buildPhonemeTrials } from '../phoneme-ctc-trials'
import type { AnnotatedPhone, L2ArcticUtterance } from '../l2arctic-loader'
import type { RecognizedPhoneme } from '../../phoneme-ctc-evaluator'

function phone(partial: Partial<AnnotatedPhone>): AnnotatedPhone {
  return {
    canonical: 'V',
    perceived: 'V',
    error: null,
    perceivedUncertain: false,
    deviation: false,
    startMs: 0,
    endMs: 80,
    ...partial,
  }
}

function utterance(phones: AnnotatedPhone[]): L2ArcticUtterance {
  return { speakerId: 'EBVS', utteranceId: 'arctic_a0001', wavPath: '/nope.wav', phones }
}

function recognized(ipas: string[]): RecognizedPhoneme[] {
  return ipas.map((ipa, i) => ({ ipa, startMs: i * 80, endMs: (i + 1) * 80, confidence: 0.9 }))
}

describe('buildPhonemeTrials', () => {
  it('cruza el veredicto del modelo con el de la persona, fonema a fonema', () => {
    const trials = buildPhonemeTrials(
      utterance([
        phone({ canonical: 'V', perceived: 'B', error: 'substitution' }),
        phone({ canonical: 'EH' }),
      ]),
      recognized(['b', 'ɛ']),
      'test-v1',
    )
    expect(trials).toEqual([
      { expected: 'V', modelFlagged: true, humanFlagged: true, abstained: false },
      { expected: 'EH', modelFlagged: false, humanFlagged: false, abstained: false },
    ])
  })

  it('cuenta como falsa alarma lo que el modelo marca y la persona no', () => {
    const trials = buildPhonemeTrials(utterance([phone({ canonical: 'V' })]), recognized(['b']), 'test-v1')
    expect(trials[0]).toMatchObject({ modelFlagged: true, humanFlagged: false })
  })

  it('excluye las adiciones: no tienen fonema esperado que juzgar', () => {
    const trials = buildPhonemeTrials(
      utterance([phone({ canonical: null, perceived: 'EH', error: 'addition' }), phone({ canonical: 'S', perceived: 'S' })]),
      recognized(['e', 's']),
      'test-v1',
    )
    expect(trials.map((t) => t.expected)).toEqual(['S'])
  })

  it('se abstiene cuando el anotador no pudo juzgar el fonema percibido', () => {
    const trials = buildPhonemeTrials(
      utterance([phone({ canonical: 'V', perceived: null, perceivedUncertain: true, error: 'substitution' })]),
      recognized(['b']),
      'test-v1',
    )
    expect(trials[0].abstained).toBe(true)
  })

  it('trata la omisión humana como error marcable', () => {
    const trials = buildPhonemeTrials(
      utterance([phone({ canonical: 'HH', perceived: null, error: 'deletion' }), phone({ canonical: 'AE' })]),
      recognized(['æ']),
      'test-v1',
    )
    expect(trials[0]).toMatchObject({ expected: 'HH', modelFlagged: true, humanFlagged: true })
  })
})

describe('runPhonemeCtcBenchmark', () => {
  it('agrega ensayos y latencias de varios enunciados y aplica la puerta', async () => {
    const utterances = [
      utterance([phone({ canonical: 'V', perceived: 'B', error: 'substitution' })]),
      utterance([phone({ canonical: 'TH', perceived: 'T', error: 'substitution' })]),
    ]
    const report = await runPhonemeCtcBenchmark(
      utterances,
      async (u) => ({
        phonemes: recognized([u.phones[0].canonical === 'V' ? 'b' : 't']),
        latencyMs: 1200,
      }),
      'test-v1',
    )

    expect(report.utteranceCount).toBe(2)
    expect(report.overall.trialCount).toBe(2)
    expect(report.latencyP95Ms).toBe(1200)
    // Solo 1 error humano por fonema: por debajo del mínimo de 30 de la puerta.
    expect(report.verdicts).toEqual({ TH: 'not_measurable', V: 'not_measurable' })
    expect(report.phaseCUnlocked).toBe(false)
  })

  it('no abre la fase C sin enunciados', async () => {
    const report = await runPhonemeCtcBenchmark([], async () => ({ phonemes: [], latencyMs: 0 }), 'test-v1')
    expect(report.phaseCUnlocked).toBe(false)
    expect(report.latencyP95Ms).toBeNull()
  })
})

describe('parsePhonemeCtcFlags', () => {
  it('usa el evaluador de formantes salvo que se pida el CTC', () => {
    expect(parsePhonemeCtcFlags([]).evaluator).toBe('formant_dsp')
    expect(parsePhonemeCtcFlags(['--evaluator=phoneme_ctc']).evaluator).toBe('phoneme_ctc')
  })

  it('toma el corpus de la flag y, si no, de L2ARCTIC_DIR', () => {
    expect(parsePhonemeCtcFlags(['--corpus=D:/a'], { L2ARCTIC_DIR: 'D:/b' }).corpusDir).toBe('D:/a')
    expect(parsePhonemeCtcFlags([], { L2ARCTIC_DIR: 'D:/b' }).corpusDir).toBe('D:/b')
    expect(parsePhonemeCtcFlags([], {}).corpusDir).toBeNull()
  })

  it('ignora un límite no numérico en vez de contar cero enunciados', () => {
    expect(parsePhonemeCtcFlags(['--limit=50']).limit).toBe(50)
    expect(parsePhonemeCtcFlags(['--limit=abc']).limit).toBeNull()
    expect(parsePhonemeCtcFlags([]).limit).toBeNull()
  })
})
