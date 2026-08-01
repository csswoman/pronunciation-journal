// Closed whitelist of English function words that have a standard weak form
// in General American. The content validator rejects `ipa_weak` on any word
// not listed here. Extending the list is a deliberate, reviewed change.

export const WEAK_FORM_WHITELIST: ReadonlySet<string> = new Set([
  // artículos y determinantes
  "a", "an", "the", "some",
  // conjunciones
  "and", "but", "or", "as", "than", "that",
  // preposiciones
  "at", "for", "from", "of", "to", "into", "upon", "per",
  // pronombres y posesivos
  "he", "him", "his", "her", "she", "we", "us", "you", "your", "them", "there",
  // be / have / do
  "am", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does",
  // modales
  "can", "could", "shall", "should", "will", "would", "must",
]);
