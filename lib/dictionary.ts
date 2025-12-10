import { Meaning } from "./types";

export interface PronunciationData {
  ipa?: string;
  audioUrl?: string;
  meanings?: Meaning[];
  sourceUrl?: string;
}

// Parse response from dictionaryapi.dev
function parseDictionaryApiDev(data: any[]): PronunciationData {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("No pronunciation data found");
  }

  const entry = data[0];
  const normalizedWord = entry.word?.toLowerCase() || "";

  // Extract IPA from phonetics array
  let ipa: string | undefined;
  let audioUrl: string | undefined;

  if (entry.phonetics && Array.isArray(entry.phonetics)) {
    // Find phonetic with both text and audio
    const phoneticWithAudio = entry.phonetics.find(
      (p: any) => p.text && p.audio
    );
    const phoneticWithText = entry.phonetics.find((p: any) => p.text);

    if (phoneticWithAudio) {
      ipa = phoneticWithAudio.text;
      audioUrl = phoneticWithAudio.audio;
    } else if (phoneticWithText) {
      ipa = phoneticWithText.text;
      // Try to find audio in other phonetics
      const audioPhonetic = entry.phonetics.find((p: any) => p.audio);
      if (audioPhonetic) {
        audioUrl = audioPhonetic.audio;
      }
    }
  }

  // Fallback: try to get IPA from phonetic field
  if (!ipa && entry.phonetic) {
    ipa = entry.phonetic;
  }

  // Extract meanings
  let meanings: Meaning[] | undefined;
  if (entry.meanings && Array.isArray(entry.meanings)) {
    meanings = entry.meanings.map((meaning: any) => ({
      partOfSpeech: meaning.partOfSpeech || "",
      definitions: (meaning.definitions || []).map((def: any) => ({
        definition: def.definition || "",
        example: def.example || undefined,
        synonyms: def.synonyms && def.synonyms.length > 0 ? def.synonyms : undefined,
        antonyms: def.antonyms && def.antonyms.length > 0 ? def.antonyms : undefined,
      })),
    }));
  }

  const sourceUrl = `https://www.dictionary.com/browse/${normalizedWord}`;

  return {
    ipa: ipa || undefined,
    audioUrl: audioUrl || undefined,
    meanings: meanings || undefined,
    sourceUrl: sourceUrl,
  };
}

// Parse response from freedictionaryapi.com
function parseFreeDictionaryApi(data: any): PronunciationData {
  if (!data || !data.entries || !Array.isArray(data.entries) || data.entries.length === 0) {
    throw new Error("No pronunciation data found");
  }

  const normalizedWord = data.word?.toLowerCase() || "";
  let ipa: string | undefined;
  let audioUrl: string | undefined;
  const meaningsMap = new Map<string, Meaning>();

  // Process all entries
  for (const entry of data.entries) {
    // Extract IPA from pronunciations
    if (entry.pronunciations && Array.isArray(entry.pronunciations)) {
      const pronunciation = entry.pronunciations.find((p: any) => p.text);
      if (pronunciation && !ipa) {
        ipa = pronunciation.text;
      }
    }

    // Extract meanings grouped by part of speech
    const partOfSpeech = entry.partOfSpeech || "";
    if (entry.senses && Array.isArray(entry.senses)) {
      if (!meaningsMap.has(partOfSpeech)) {
        meaningsMap.set(partOfSpeech, {
          partOfSpeech: partOfSpeech,
          definitions: [],
        });
      }

      const meaning = meaningsMap.get(partOfSpeech)!;
      
      for (const sense of entry.senses) {
        if (sense.definition) {
          meaning.definitions.push({
            definition: sense.definition,
            example: sense.examples && sense.examples.length > 0 ? sense.examples[0] : undefined,
            synonyms: sense.synonyms && sense.synonyms.length > 0 ? sense.synonyms : undefined,
            antonyms: sense.antonyms && sense.antonyms.length > 0 ? sense.antonyms : undefined,
          });
        }

        // Process subsenses if they exist
        if (sense.subsenses && Array.isArray(sense.subsenses)) {
          for (const subsense of sense.subsenses) {
            if (subsense.definition) {
              meaning.definitions.push({
                definition: subsense.definition,
                example: subsense.examples && subsense.examples.length > 0 ? subsense.examples[0] : undefined,
                synonyms: subsense.synonyms && subsense.synonyms.length > 0 ? subsense.synonyms : undefined,
                antonyms: subsense.antonyms && subsense.antonyms.length > 0 ? subsense.antonyms : undefined,
              });
            }
          }
        }
      }
    }
  }

  const meanings = Array.from(meaningsMap.values());
  const sourceUrl = data.source?.url || `https://www.dictionary.com/browse/${normalizedWord}`;

  return {
    ipa: ipa || undefined,
    audioUrl: audioUrl || undefined,
    meanings: meanings.length > 0 ? meanings : undefined,
    sourceUrl: sourceUrl,
  };
}

export async function fetchPronunciation(
  word: string
): Promise<PronunciationData> {
  if (!word || word.trim().length === 0) {
    throw new Error("Word cannot be empty");
  }

  const normalizedWord = word.trim().toLowerCase();

  // Try dictionaryapi.dev first
  try {
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${normalizedWord}`;
    const response = await fetch(apiUrl);

    if (response.ok) {
      const data = await response.json();
      const result = parseDictionaryApiDev(data);
      
      // Only return if we have some useful data
      if (result.ipa || result.audioUrl || result.meanings) {
        return result;
      }
    }
  } catch (error) {
    // Continue to try the other API
    console.log(`DictionaryAPI.dev failed for "${word}", trying Free Dictionary API...`);
  }

  // Try freedictionaryapi.com as fallback
  try {
    const apiUrl = `https://api.freedictionaryapi.com/v1/en/${normalizedWord}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Word "${word}" not found in dictionary`);
      }
      throw new Error(`Failed to fetch pronunciation: ${response.statusText}`);
    }

    const data = await response.json();
    const result = parseFreeDictionaryApi(data);

    if (!result.ipa && !result.audioUrl && !result.meanings) {
      throw new Error("No pronunciation data available for this word");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while fetching pronunciation");
  }
}

