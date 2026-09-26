import { describe, expect, it } from 'vitest'
import { parseTextGrid, findTier } from '../textgrid'
import {
  parseAnnotationTextGrid,
  parsePhoneLabel,
  SPANISH_L1_SPEAKERS,
} from '../l2arctic-loader'

/**
 * TextGrid largo de Praat con la forma de una anotación de L2-ARCTIC: tiers
 * "words" y "phones", con las cuatro convenciones de etiqueta documentadas.
 */
const TEXTGRID = `File type = "ooTextFile"
Object class = "TextGrid"

xmin = 0
xmax = 0.6
tiers? <exists>
size = 2
item []:
    item [1]:
        class = "IntervalTier"
        name = "words"
        xmin = 0
        xmax = 0.6
        intervals: size = 2
        intervals [1]:
            xmin = 0
            xmax = 0.3
            text = "very"
        intervals [2]:
            xmin = 0.3
            xmax = 0.6
            text = "school"
    item [2]:
        class = "IntervalTier"
        name = "phones"
        xmin = 0
        xmax = 0.6
        intervals: size = 6
        intervals [1]:
            xmin = 0
            xmax = 0.05
            text = "sil"
        intervals [2]:
            xmin = 0.05
            xmax = 0.12
            text = "V,B,s"
        intervals [3]:
            xmin = 0.12
            xmax = 0.2
            text = "EH1"
        intervals [4]:
            xmin = 0.2
            xmax = 0.28
            text = "HH,sil,d"
        intervals [5]:
            xmin = 0.28
            xmax = 0.34
            text = "sil,EH,a"
        intervals [6]:
            xmin = 0.34
            xmax = 0.6
            text = "AH,AO*,s"
`

describe('parseTextGrid', () => {
  it('lee los tiers con nombre y sus intervalos', () => {
    const tiers = parseTextGrid(TEXTGRID)
    expect(tiers.map((t) => t.name)).toEqual(['words', 'phones'])
    expect(findTier(tiers, 'words')!.intervals).toEqual([
      { startMs: 0, endMs: 300, text: 'very' },
      { startMs: 300, endMs: 600, text: 'school' },
    ])
  })

  it('no confunde los xmin/xmax de la cabecera con un intervalo', () => {
    expect(findTier(parseTextGrid(TEXTGRID), 'phones')!.intervals).toHaveLength(6)
  })

  it('encuentra el tier sin distinguir mayúsculas y devuelve null si falta', () => {
    const tiers = parseTextGrid(TEXTGRID)
    expect(findTier(tiers, 'PHONES')!.name).toBe('phones')
    expect(findTier(tiers, 'comments')).toBeNull()
  })
})

describe('parsePhoneLabel', () => {
  it('trata la etiqueta sin coma como fonema correcto y le quita el acento', () => {
    expect(parsePhoneLabel('EH1', 0, 100)).toMatchObject({
      canonical: 'EH',
      perceived: 'EH',
      error: null,
    })
  })

  it('descarta el silencio', () => {
    expect(parsePhoneLabel('sil', 0, 50)).toBeNull()
    expect(parsePhoneLabel('', 0, 50)).toBeNull()
  })

  it('lee una sustitución', () => {
    expect(parsePhoneLabel('V,B,s', 0, 70)).toMatchObject({
      canonical: 'V',
      perceived: 'B',
      error: 'substitution',
      deviation: false,
    })
  })

  it('lee una omisión, sin fonema percibido', () => {
    expect(parsePhoneLabel('HH,sil,d', 0, 80)).toMatchObject({
      canonical: 'HH',
      perceived: null,
      error: 'deletion',
    })
  })

  it('lee una adición, sin fonema canónico', () => {
    expect(parsePhoneLabel('sil,EH,a', 0, 60)).toMatchObject({
      canonical: null,
      perceived: 'EH',
      error: 'addition',
    })
  })

  it('marca la desviación con acento sin perder el fonema percibido', () => {
    expect(parsePhoneLabel('AH,AO*,s', 0, 260)).toMatchObject({
      canonical: 'AH',
      perceived: 'AO',
      error: 'substitution',
      deviation: true,
    })
  })

  it('marca como dudoso el percibido etiquetado "err"', () => {
    expect(parsePhoneLabel('AH,err,s', 0, 100)).toMatchObject({
      canonical: 'AH',
      perceived: null,
      perceivedUncertain: true,
      error: 'substitution',
    })
  })
})

describe('parseAnnotationTextGrid', () => {
  it('devuelve los fonemas anotados sin los silencios', () => {
    const phones = parseAnnotationTextGrid(TEXTGRID)
    expect(phones.map((p) => p.error)).toEqual([
      'substitution',
      null,
      'deletion',
      'addition',
      'substitution',
    ])
    expect(phones[0]).toMatchObject({ startMs: 50, endMs: 120 })
  })

  it('falla ruidosamente si el fichero no trae tier "phones"', () => {
    const noPhones = TEXTGRID.replace('name = "phones"', 'name = "otro"')
    expect(() => parseAnnotationTextGrid(noPhones)).toThrow(/phones/)
  })
})

describe('SPANISH_L1_SPEAKERS', () => {
  it('son los 4 hablantes con L1 español del corpus', () => {
    expect(SPANISH_L1_SPEAKERS).toEqual(['EBVS', 'ERMS', 'MBMPS', 'NJS'])
  })
})
