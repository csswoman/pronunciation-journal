import { describe, expect, it } from 'vitest'
import {
  mapManualEvents,
  toAnnotatedPhone,
  type ManualEvent,
} from '../l2arctic-manual-events'

function event(partial: Partial<ManualEvent>): ManualEvent {
  return {
    canonical_phoneme: 'V',
    perceived_phoneme: 'V',
    perceived_raw: 'V',
    error_type: 'correct',
    start: 0.05,
    end: 0.12,
    ...partial,
  }
}

describe('toAnnotatedPhone', () => {
  it('convierte segundos a milisegundos', () => {
    expect(toAnnotatedPhone(event({ start: 0.05, end: 0.123 }))).toMatchObject({
      startMs: 50,
      endMs: 123,
    })
  })

  it('lee un fonema correcto sin marcarlo como error', () => {
    expect(toAnnotatedPhone(event({}))).toMatchObject({
      canonical: 'V',
      perceived: 'V',
      error: null,
      perceivedUncertain: false,
    })
  })

  it('lee una sustitución', () => {
    expect(
      toAnnotatedPhone(event({ perceived_phoneme: 'B', perceived_raw: 'B', error_type: 'substitution' })),
    ).toMatchObject({ canonical: 'V', perceived: 'B', error: 'substitution' })
  })

  it('lee una omisión sin tratarla como percibido dudoso', () => {
    expect(
      toAnnotatedPhone(event({ perceived_phoneme: null, perceived_raw: 'sil', error_type: 'deletion' })),
    ).toMatchObject({ canonical: 'V', perceived: null, error: 'deletion', perceivedUncertain: false })
  })

  it('lee una adición, sin fonema canónico', () => {
    expect(
      toAnnotatedPhone(
        event({ canonical_phoneme: null, perceived_phoneme: 'EH', perceived_raw: 'EH', error_type: 'addition' }),
      ),
    ).toMatchObject({ canonical: null, perceived: 'EH', error: 'addition' })
  })

  it('marca como dudosa la sustitución cuyo percibido el anotador no pudo juzgar', () => {
    expect(
      toAnnotatedPhone(event({ perceived_phoneme: null, perceived_raw: 'err', error_type: 'substitution' })),
    ).toMatchObject({ error: 'substitution', perceived: null, perceivedUncertain: true })
  })

  it('detecta la marca de desviación con acento', () => {
    expect(
      toAnnotatedPhone(event({ perceived_phoneme: 'AO', perceived_raw: 'AO*', error_type: 'substitution' })),
    ).toMatchObject({ perceived: 'AO', deviation: true })
  })

  it('descarta silencio, pausa y ruido: no son fonemas que juzgar', () => {
    for (const label of ['sil', 'sp', 'spn', '']) {
      expect(
        toAnnotatedPhone(event({ canonical_phoneme: label, perceived_phoneme: label, perceived_raw: label })),
        `«${label}» debería descartarse`,
      ).toBeNull()
    }
  })

  it('no cuenta SPN como fonema esperado aunque venga en el canónico', () => {
    const phone = toAnnotatedPhone(
      event({ canonical_phoneme: 'SPN', perceived_phoneme: 'V', perceived_raw: 'V', error_type: 'substitution' }),
    )
    expect(phone?.canonical).toBeNull()
  })
})

describe('mapManualEvents', () => {
  it('filtra los intervalos de no-habla y conserva el orden', () => {
    const phones = mapManualEvents([
      event({ canonical_phoneme: 'sil', perceived_phoneme: 'sil', perceived_raw: 'sil', start: 0, end: 0.03 }),
      event({ perceived_phoneme: 'B', perceived_raw: 'B', error_type: 'substitution', start: 0.03, end: 0.1 }),
      event({ canonical_phoneme: 'EH', perceived_phoneme: 'EH', perceived_raw: 'EH', start: 0.1, end: 0.2 }),
    ])
    expect(phones.map((p) => p.canonical)).toEqual(['V', 'EH'])
    expect(phones.map((p) => p.error)).toEqual(['substitution', null])
  })

  it('devuelve vacío sin intervalos', () => {
    expect(mapManualEvents([])).toEqual([])
  })
})
