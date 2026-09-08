import type { CefrLevel } from '@/lib/essential-words/types'
import { fetchCatalogIndex } from '@/lib/essential-words/client'
import type { RainWord } from './types'

const FALLBACK_WORDS: Record<CefrLevel, Array<{ word: string; ipa?: string }>> = {
  A1: [
    { word: 'apple', ipa: '/ˈæp.əl/' },
    { word: 'water', ipa: '/ˈwɔː.tər/' },
    { word: 'house', ipa: '/haʊs/' },
    { word: 'smile', ipa: '/smaɪl/' },
    { word: 'chair', ipa: '/tʃeər/' },
    { word: 'table', ipa: '/ˈteɪ.bəl/' },
    { word: 'bread', ipa: '/bred/' },
    { word: 'light', ipa: '/laɪt/' },
    { word: 'green', ipa: '/ɡriːn/' },
    { word: 'sleep', ipa: '/sliːp/' },
    { word: 'train', ipa: '/treɪn/' },
    { word: 'world', ipa: '/wɜːld/' },
    { word: 'music', ipa: '/ˈmjuː.zɪk/' },
    { word: 'night', ipa: '/naɪt/' },
    { word: 'happy', ipa: '/ˈhæp.i/' },
  ],
  A2: [
    { word: 'travel', ipa: '/ˈtræv.əl/' },
    { word: 'doctor', ipa: '/ˈdɒk.tər/' },
    { word: 'market', ipa: '/ˈmɑː.kɪt/' },
    { word: 'window', ipa: '/ˈwɪn.dəʊ/' },
    { word: 'garden', ipa: '/ˈɡɑː.dən/' },
    { word: 'silver', ipa: '/ˈsɪl.vər/' },
    { word: 'bridge', ipa: '/brɪdʒ/' },
    { word: 'camera', ipa: '/ˈkæm.rə/' },
    { word: 'island', ipa: '/ˈaɪ.lənd/' },
    { word: 'forest', ipa: '/ˈfɒr.ɪst/' },
    { word: 'winter', ipa: '/ˈwɪn.tər/' },
    { word: 'spring', ipa: '/sprɪŋ/' },
    { word: 'summer', ipa: '/ˈsʌm.ər/' },
    { word: 'family', ipa: '/ˈfæm.əl.i/' },
    { word: 'friend', ipa: '/frend/' },
  ],
  B1: [
    { word: 'journey', ipa: '/ˈdʒɜː.ni/' },
    { word: 'weather', ipa: '/ˈweð.ər/' },
    { word: 'purpose', ipa: '/ˈpɜː.pəs/' },
    { word: 'culture', ipa: '/ˈkʌl.tʃər/' },
    { word: 'machine', ipa: '/məˈʃiːn/' },
    { word: 'project', ipa: '/ˈprɒdʒ.ekt/' },
    { word: 'silence', ipa: '/ˈsaɪ.ləns/' },
    { word: 'quality', ipa: '/ˈkwɒl.ə.ti/' },
    { word: 'freedom', ipa: '/ˈfriː.dəm/' },
    { word: 'network', ipa: '/ˈnet.wɜːk/' },
    { word: 'balance', ipa: '/ˈbæl.əns/' },
    { word: 'history', ipa: '/ˈhɪs.tər.i/' },
    { word: 'protect', ipa: '/prəˈtekt/' },
    { word: 'support', ipa: '/səˈpɔːt/' },
    { word: 'success', ipa: '/səkˈses/' },
  ],
  B2: [
    { word: 'achieve', ipa: '/əˈtʃiːv/' },
    { word: 'advance', ipa: '/ədˈvɑːns/' },
    { word: 'capture', ipa: '/ˈkæp.tʃər/' },
    { word: 'complex', ipa: '/ˈkɒm.pleks/' },
    { word: 'dynamic', ipa: '/daɪˈnæm.ɪk/' },
    { word: 'explore', ipa: '/ɪkˈsplɔːr/' },
    { word: 'inspire', ipa: '/ɪnˈspaɪər/' },
    { word: 'measure', ipa: '/ˈmeʒ.ər/' },
    { word: 'outline', ipa: '/ˈaʊt.laɪn/' },
    { word: 'reflect', ipa: '/rɪˈflekt/' },
    { word: 'resolve', ipa: '/rɪˈzɒlv/' },
    { word: 'succeed', ipa: '/səkˈsiːd/' },
    { word: 'sustain', ipa: '/səˈsteɪn/' },
    { word: 'transform', ipa: '/trænsˈfɔːm/' },
    { word: 'venture', ipa: '/ˈven.tʃər/' },
  ],
  C1: [
    { word: 'abstract', ipa: '/ˈæb.strækt/' },
    { word: 'coherent', ipa: '/kəʊˈhɪə.rənt/' },
    { word: 'diligent', ipa: '/ˈdɪl.ɪ.dʒənt/' },
    { word: 'eloquent', ipa: '/ˈel.ə.kwənt/' },
    { word: 'feasible', ipa: '/ˈfiː.zə.bəl/' },
    { word: 'genuine', ipa: '/ˈdʒen.ju.ɪn/' },
    { word: 'insight', ipa: '/ˈɪn.saɪt/' },
    { word: 'judicious', ipa: '/dʒuːˈdɪʃ.əs/' },
    { word: 'lucid', ipa: '/ˈluː.sɪd/' },
    { word: 'meticulous', ipa: '/məˈtɪk.jə.ləs/' },
    { word: 'nuance', ipa: '/ˈnjuː.ɑːns/' },
    { word: 'pragmatic', ipa: '/præɡˈmæt.ɪk/' },
    { word: 'resilient', ipa: '/rɪˈzɪl.jənt/' },
    { word: 'scrutiny', ipa: '/ˈskruː.tɪ.ni/' },
    { word: 'tangible', ipa: '/ˈtæn.dʒə.bəl/' },
  ],
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

export function sanitizeRainWord(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z]/g, '')
}

/**
 * Loads vocabulary words tailored to the given CEFR level for Word Rain.
 */
export async function loadWordRainWords(
  level: CefrLevel,
  count = 30
): Promise<RainWord[]> {
  try {
    const catalog = await fetchCatalogIndex()
    const matching = catalog.filter((item) => {
      if (item.cefr_level !== level) return false
      const clean = sanitizeRainWord(item.word)
      return clean.length >= 3 && clean.length <= 12 && !item.word.includes(' ') && !item.word.includes('-')
    })

    if (matching.length >= 10) {
      const shuffled = shuffle(matching)
      return shuffled.slice(0, count).map((item, idx) => ({
        id: `rain-${level}-${item.rank}-${idx}`,
        word: sanitizeRainWord(item.word),
        ipa: item.ipa_strong || null,
        pos: item.pos,
        cefr_level: level,
      }))
    }
  } catch (err) {
    console.warn('[WordRain] Fallback to curated vocabulary:', err)
  }

  // Fallback if catalog fails or is incomplete for the target level
  const fallbackList = FALLBACK_WORDS[level] ?? FALLBACK_WORDS.A2
  const shuffledFallback = shuffle(fallbackList)
  return shuffledFallback.map((item, idx) => ({
    id: `rain-fallback-${level}-${idx}`,
    word: sanitizeRainWord(item.word),
    ipa: item.ipa ?? null,
    cefr_level: level,
  }))
}

export const DISTRACTOR_WORDS = [
  'teh', 'wierd', 'seperate', 'untill', 'definately',
  'truely', 'becuase', 'freind', 'goverment', 'beleive',
  'calender', 'occured', 'tommorow', 'wich', 'realy',
  'alot', 'recieved', 'embarass', 'neccessary', 'writting',
]

export function getRandomDistractor(): string {
  const idx = Math.floor(Math.random() * DISTRACTOR_WORDS.length)
  return DISTRACTOR_WORDS[idx]
}

