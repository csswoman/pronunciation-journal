export interface PronunciationData {
  ipa?: string;
  audioUrl?: string;
}

export async function fetchPronunciation(
  word: string
): Promise<PronunciationData> {
  if (!word || word.trim().length === 0) {
    throw new Error("Word cannot be empty");
  }

  const normalizedWord = word.trim().toLowerCase();
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${normalizedWord}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Word "${word}" not found in dictionary`);
      }
      throw new Error(`Failed to fetch pronunciation: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No pronunciation data found");
    }

    // Get the first entry
    const entry = data[0];

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

    if (!ipa && !audioUrl) {
      throw new Error("No pronunciation data available for this word");
    }

    return {
      ipa: ipa || undefined,
      audioUrl: audioUrl || undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while fetching pronunciation");
  }
}

