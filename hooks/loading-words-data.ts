/** Static fallback words for loading UI — keep free of word-bank / network imports. */

export type LoadingWord = { text: string; ipa: string | null }

export const FALLBACK_WORDS: LoadingWord[] = [
  { text: 'thought',       ipa: '/θɔːt/' },
  { text: 'through',       ipa: '/θruː/' },
  { text: 'though',        ipa: '/ðoʊ/' },
  { text: 'world',         ipa: '/wɜːrld/' },
  { text: 'clothes',       ipa: '/kloʊðz/' },
  { text: 'comfortable',   ipa: '/ˈkʌmftərbəl/' },
  { text: 'rhythm',        ipa: '/ˈrɪðəm/' },
  { text: 'pronunciation', ipa: '/prəˌnʌnsiˈeɪʃən/' },
  { text: 'thoroughly',    ipa: '/ˈθɜːrəli/' },
  { text: 'particularly',  ipa: '/pərˈtɪkjʊlərli/' },
]
