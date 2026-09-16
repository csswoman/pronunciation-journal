/** Static fallback words for loading UI — keep free of word-bank / network imports. */

export type LoadingWord = { text: string; ipa: string | null }

export const FALLBACK_WORDS: LoadingWord[] = [
  { text: 'thought',       ipa: '/θɔːt/' },
  { text: 'rhythm',        ipa: '/ˈrɪðəm/' },
  { text: 'squirrel',      ipa: '/ˈskwɜːrəl/' },
  { text: 'comfortable',   ipa: '/ˈkʌmftərbəl/' },
  { text: 'thoroughly',    ipa: '/ˈθɜːrəli/' },
  { text: 'pronunciation', ipa: '/prəˌnʌnsiˈeɪʃən/' },
  { text: 'subtle',        ipa: '/ˈsʌtəl/' },
  { text: 'schedule',      ipa: '/ˈskɛdʒuːl/' },
  { text: 'phenomenon',    ipa: '/fəˈnɑːmɪnɑːn/' },
  { text: 'acoustic',      ipa: '/əˈkuːstɪk/' },
  { text: 'articulation',  ipa: '/ɑːrˌtɪkjʊˈleɪʃən/' },
  { text: 'clothes',       ipa: '/kloʊðz/' },
  { text: 'choir',         ipa: '/ˈkwaɪər/' },
  { text: 'mischievous',   ipa: '/ˈmɪstʃɪvəs/' },
  { text: 'fluency',       ipa: '/ˈfluːənsi/' },
  { text: 'synecdoche',    ipa: '/sɪˈnɛkdəki/' },
]


