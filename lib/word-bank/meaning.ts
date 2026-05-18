export async function fetchMeaningForWord(word: string): Promise<string | null> {
  try {
    const response = await fetch("/api/gemini/deck-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckName: word,
        deckDescription: `Give a single concise definition for the English word "${word}". Return exactly 1 suggestion with the word and its meaning.`,
        existingWords: [],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const firstSuggestion = data.suggestions?.[0];
    return firstSuggestion?.meaning ?? null;
  } catch {
    return null;
  }
}
