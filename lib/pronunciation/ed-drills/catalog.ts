import type { EdDrillItem } from './types'

export const TEMPORAL_ADVERB_BLOCKLIST = [
  'yesterday',
  'ago',
  'tomorrow',
  'now',
  'already',
  'just',
  'everyday',
  'every day',
  'last week',
  'last year',
  'last night',
] as const

export const ED_DRILL_CATALOG = [
  {
    id: 'ed-achieve', baseVerb: 'achieve', pastVerb: 'achieved', allophone: 'd', cluster: 'vd', baseIpa: '/əˈtʃiːv/', pastIpa: '/əˈtʃiːvd/',
    environments: {
      1: { level: 1, environmentType: 'before_vowel', sentence: 'I achieved it.', contrastSentence: 'I achieve it.', syllabified: 'a-chie-vdit', ipa: '/aˈtʃiːv‿dɪt/', targetChunk: 'achieved it' },
      2: { level: 2, environmentType: 'pre_pausal', sentence: "That's what I achieved.", contrastSentence: "That's what I achieve.", syllabified: 'a-chieved', ipa: '/aˈtʃiːvd/', targetChunk: 'achieved' },
      3: { level: 3, environmentType: 'before_consonant', sentence: 'They achieved goals.', contrastSentence: 'They achieve goals.', syllabified: 'a-chieved-goals', ipa: '/ðeɪ aˈtʃiːvd ɡoʊlz/', targetChunk: 'achieved goals' },
    },
  },
  {
    id: 'ed-live', baseVerb: 'live', pastVerb: 'lived', allophone: 'd', cluster: 'vd', baseIpa: '/lɪv/', pastIpa: '/lɪvd/',
    environments: {
      1: { level: 1, environmentType: 'before_vowel', sentence: 'I lived in Spain.', contrastSentence: 'I live in Spain.', syllabified: 'li-vdin', ipa: '/lɪv‿dɪn/', targetChunk: 'lived in' },
      2: { level: 2, environmentType: 'pre_pausal', sentence: 'Where I lived.', contrastSentence: 'Where I live.', syllabified: 'lived', ipa: '/lɪvd/', targetChunk: 'lived' },
      3: { level: 3, environmentType: 'before_consonant', sentence: 'I lived nearby.', contrastSentence: 'I live nearby.', syllabified: 'lived-nearby', ipa: '/lɪvd nɪrˈbaɪ/', targetChunk: 'lived nearby' },
    },
  },
  {
    id: 'ed-use', baseVerb: 'use', pastVerb: 'used', allophone: 'd', cluster: 'zd', baseIpa: '/juːz/', pastIpa: '/juːzd/',
    environments: {
      1: { level: 1, environmentType: 'before_vowel', sentence: 'I used an app.', contrastSentence: 'I use an app.', syllabified: 'u-zdan', ipa: '/juːz‿dæn/', targetChunk: 'used an' },
      2: { level: 2, environmentType: 'pre_pausal', sentence: "That's what I used.", contrastSentence: "That's what I use.", syllabified: 'used', ipa: '/juːzd/', targetChunk: 'used' },
      3: { level: 3, environmentType: 'before_consonant', sentence: 'I used my phone.', contrastSentence: 'I use my phone.', syllabified: 'used-my', ipa: '/juːzd maɪ/', targetChunk: 'used my' },
    },
  },
  {
    id: 'ed-walk', baseVerb: 'walk', pastVerb: 'walked', allophone: 't', cluster: 'kt', baseIpa: '/wɔːk/', pastIpa: '/wɔːkt/',
    environments: {
      1: { level: 1, environmentType: 'before_vowel', sentence: 'I walked home.', contrastSentence: 'I walk home.', syllabified: 'walk-thome', ipa: '/wɔːkt hoʊm/', targetChunk: 'walked home' },
      2: { level: 2, environmentType: 'pre_pausal', sentence: "That's where I walked.", contrastSentence: "That's where I walk.", syllabified: 'walked', ipa: '/wɔːkt/', targetChunk: 'walked' },
      3: { level: 3, environmentType: 'before_consonant', sentence: 'I walked fast.', contrastSentence: 'I walk fast.', syllabified: 'walked-fast', ipa: '/wɔːkt fæst/', targetChunk: 'walked fast' },
    },
  },
  {
    id: 'ed-stop', baseVerb: 'stop', pastVerb: 'stopped', allophone: 't', cluster: 'pt', baseIpa: '/stɑːp/', pastIpa: '/stɑːpt/',
    environments: {
      1: { level: 1, environmentType: 'before_vowel', sentence: 'I stopped at once.', contrastSentence: 'I stop at once.', syllabified: 'sto-ptat', ipa: '/stɑːp‿tæt/', targetChunk: 'stopped at' },
      2: { level: 2, environmentType: 'pre_pausal', sentence: "That's when I stopped.", contrastSentence: "That's when I stop.", syllabified: 'stopped', ipa: '/stɑːpt/', targetChunk: 'stopped' },
      3: { level: 3, environmentType: 'before_consonant', sentence: 'I stopped by.', contrastSentence: 'I stop by.', syllabified: 'stopped-by', ipa: '/stɑːpt baɪ/', targetChunk: 'stopped by' },
    },
  },
  {
    id: 'ed-pass', baseVerb: 'pass', pastVerb: 'passed', allophone: 't', cluster: 'st', baseIpa: '/pæs/', pastIpa: '/pæst/',
    environments: {
      1: { level: 1, environmentType: 'before_vowel', sentence: 'I passed all tests.', contrastSentence: 'I pass all tests.', syllabified: 'pa-stall', ipa: '/pæs‿tɔːl/', targetChunk: 'passed all' },
      2: { level: 2, environmentType: 'pre_pausal', sentence: "That's what I passed.", contrastSentence: "That's what I pass.", syllabified: 'passed', ipa: '/pæst/', targetChunk: 'passed' },
      3: { level: 3, environmentType: 'before_consonant', sentence: 'I passed exams.', contrastSentence: 'I pass exams.', syllabified: 'passed-exams', ipa: '/pæst ɪɡˈzæmz/', targetChunk: 'passed exams' },
    },
  },
  {
    id: 'ed-clean', baseVerb: 'clean', pastVerb: 'cleaned', allophone: 'd', cluster: 'nd', baseIpa: '/kliːn/', pastIpa: '/kliːnd/',
    environments: {
      1: { level: 1, environmentType: 'before_vowel', sentence: 'I cleaned everything.', contrastSentence: 'I clean everything.', syllabified: 'clea-ndeverything', ipa: '/kliːn‿dɛvrɪθɪŋ/', targetChunk: 'cleaned everything' },
      2: { level: 2, environmentType: 'pre_pausal', sentence: "That's what I cleaned.", contrastSentence: "That's what I clean.", syllabified: 'cleaned', ipa: '/kliːnd/', targetChunk: 'cleaned' },
      3: { level: 3, environmentType: 'before_consonant', sentence: 'I cleaned rooms.', contrastSentence: 'I clean rooms.', syllabified: 'cleaned-rooms', ipa: '/kliːnd ruːmz/', targetChunk: 'cleaned rooms' },
    },
  },
  {
    id: 'ed-call', baseVerb: 'call', pastVerb: 'called', allophone: 'd', cluster: 'ld', baseIpa: '/kɔːl/', pastIpa: '/kɔːld/',
    environments: {
      1: { level: 1, environmentType: 'before_vowel', sentence: 'I called at night.', contrastSentence: 'I call at night.', syllabified: 'ca-ldat', ipa: '/kɔːl‿dæt/', targetChunk: 'called at' },
      2: { level: 2, environmentType: 'pre_pausal', sentence: "That's who I called.", contrastSentence: "That's who I call.", syllabified: 'called', ipa: '/kɔːld/', targetChunk: 'called' },
      3: { level: 3, environmentType: 'before_consonant', sentence: 'I called back.', contrastSentence: 'I call back.', syllabified: 'called-back', ipa: '/kɔːld bæk/', targetChunk: 'called back' },
    },
  },
] satisfies readonly EdDrillItem[]
