import { fetchPronunciation as fetchPronunciationFromDictionary } from "@/lib/dictionary";
import {
  getWordSuggestions as getWordSuggestionsFromDictionarySearch,
  WordSuggestion,
} from "@/lib/dictionarySearch";
import { saveEntry as saveEntryToStorage } from "@/lib/storage";
import { Entry } from "@/lib/types";

export type { WordSuggestion };

export async function fetchPronunciation(word: string) {
  return fetchPronunciationFromDictionary(word);
}

export async function getWordSuggestions(query: string) {
  return getWordSuggestionsFromDictionarySearch(query);
}

export async function saveEntry(entry: Entry) {
  return saveEntryToStorage(entry);
}
