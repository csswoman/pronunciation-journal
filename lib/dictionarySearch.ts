// Fetch word suggestions from Datamuse API
// This API provides word suggestions and spelling corrections
export async function getWordSuggestions(query: string): Promise<string[]> {
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
    return data.map((item: any) => item.word).slice(0, 5);
  } catch (error) {
    console.error("Error fetching word suggestions:", error);
    return [];
  }
}

