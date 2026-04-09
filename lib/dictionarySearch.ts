// Interface for word suggestions with IPA and link
export interface WordSuggestion {
  word: string;
  ipa?: string;
  sourceUrl?: string;
}

interface DatamuseSuggestion {
  word?: string;
}

interface DictionaryApiEntry {
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
}

interface FreeDictionaryEntry {
  pronunciations?: Array<{ text?: string }>;
}

interface FreeDictionaryResponse {
  entries?: FreeDictionaryEntry[];
  source?: { url?: string };
}

// Fetch word suggestions from Datamuse API
// This API provides word suggestions and spelling corrections
// Then fetch IPA from dictionary API for each suggestion
export async function getWordSuggestions(query: string): Promise<WordSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const normalizedQuery = query.toLowerCase().trim();
    // Using Datamuse API's /sug endpoint for word suggestions
    // This endpoint is specifically designed for autocomplete/suggestions
    const response = await fetch(
      `https://api.datamuse.com/sug?s=${encodeURIComponent(normalizedQuery)}&max=5`
    );

    if (!response.ok) {
      console.error("Failed to fetch suggestions");
      return [];
    }

    const data = await response.json();
    
    // Datamuse returns array of objects like: [{ word: "hello", score: 1234 }]
    const words = (data as DatamuseSuggestion[])
      .map((item) => item.word)
      .filter((word): word is string => typeof word === "string" && word.length > 0)
      .slice(0, 5);
    
    // Fetch IPA for each word suggestion (in parallel for better performance)
    const suggestionsWithIPA = await Promise.all(
      words.map(async (word: string) => {
        const normalizedWord = word.toLowerCase();
        let ipa: string | undefined;
        let sourceUrl: string | undefined;

        // Try dictionaryapi.dev first
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        try {
          // Create abort controller for timeout
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const dictResponse = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
              signal: controller.signal,
            }
          );
          
          if (timeoutId) clearTimeout(timeoutId);
          
          if (dictResponse.ok) {
            const dictData = await dictResponse.json();
              if (Array.isArray(dictData) && dictData.length > 0) {
              const entry = dictData[0] as DictionaryApiEntry;
              
              // Extract IPA
              if (entry.phonetics && Array.isArray(entry.phonetics)) {
                const phoneticWithText = entry.phonetics.find((p) => p.text);
                if (phoneticWithText) {
                  ipa = phoneticWithText.text;
                }
              }
              if (!ipa && entry.phonetic) {
                ipa = entry.phonetic;
              }
              
              sourceUrl = `https://www.dictionary.com/browse/${normalizedWord}`;
              
              if (ipa) {
                return {
                  word,
                  ipa: ipa,
                  sourceUrl: sourceUrl,
                };
              }
            }
          }
        } catch {
          if (timeoutId) clearTimeout(timeoutId);
          // Silently continue to try the other API
          // Don't log network errors, CORS errors, or timeout errors
        }

        // Try freedictionaryapi.com as fallback
        if (!ipa) {
          let timeoutId2: ReturnType<typeof setTimeout> | null = null;
          try {
            // Create abort controller for timeout
            const controller = new AbortController();
            timeoutId2 = setTimeout(() => controller.abort(), 5000);
            
            const freeDictResponse = await fetch(
              `https://api.freedictionaryapi.com/v1/en/${encodeURIComponent(normalizedWord)}`,
              {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                },
                signal: controller.signal,
              }
            );
            
            if (timeoutId2) clearTimeout(timeoutId2);
            
            if (freeDictResponse.ok) {
              const freeDictData = (await freeDictResponse.json()) as FreeDictionaryResponse;
              if (freeDictData && freeDictData.entries && Array.isArray(freeDictData.entries)) {
                // Extract IPA from first entry with pronunciation
                for (const entry of freeDictData.entries) {
                  if (entry.pronunciations && Array.isArray(entry.pronunciations)) {
                    const pronunciation = entry.pronunciations.find((p) => p.text);
                    if (pronunciation) {
                      ipa = pronunciation.text;
                      break;
                    }
                  }
                }
                
                sourceUrl = freeDictData.source?.url || `https://www.dictionary.com/browse/${normalizedWord}`;
              }
            }
          } catch {
            if (timeoutId2) clearTimeout(timeoutId2);
            // Silently fail - this is expected if the API is unavailable or has CORS issues
            // Don't log network errors, CORS errors, or timeout errors
          }
        }
        
        return {
          word,
          ipa: ipa || undefined,
          sourceUrl: sourceUrl || `https://www.dictionary.com/browse/${normalizedWord}`,
        };
      })
    );
    
    return suggestionsWithIPA;
  } catch (error) {
    console.error("Error fetching word suggestions:", error);
    return [];
  }
}

