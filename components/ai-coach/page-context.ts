interface PageContext {
  label: string;
  chips: { label: string; prompt: string }[];
}

export function getPageContext(pathname: string): PageContext {
  const universal = [
    { label: "Correct my text", prompt: "Please correct the following text: " },
    { label: "Free conversation", prompt: "Let's have a free conversation in English" },
  ];
  if (pathname === "/" || pathname === "/dashboard") {
    return { label: "🏠 Home", chips: [
      { label: "What should I practice?", prompt: "What should I practice today based on my learning progress?" },
      { label: "Word of the day", prompt: "Can you give me a word of the day and explain it with examples?" },
      ...universal,
    ]};
  }
  if (pathname.startsWith("/words") || pathname.startsWith("/decks")) {
    return { label: "📖 Word Bank", chips: [
      { label: "Use it in a sentence", prompt: "Use this word in a sentence and explain when to use it" },
      { label: "Similar words?", prompt: "What's the difference between this word and similar words?" },
      ...universal,
    ]};
  }
  if (pathname.startsWith("/practice") || pathname.startsWith("/ipa") || pathname.startsWith("/review")) {
    return { label: "🎯 Practice", chips: [
      { label: "Explain this sound", prompt: "Explain this English phoneme and how to pronounce it correctly" },
      { label: "More words to practice", prompt: "Give me more words to practice with this sound" },
      ...universal,
    ]};
  }
  if (pathname.startsWith("/lessons")) {
    return { label: "📚 Lessons", chips: [
      { label: "Explain this topic", prompt: "Can you explain this grammar topic in more detail with examples?" },
      { label: "Give me examples", prompt: "Give me more examples of this grammar concept" },
      ...universal,
    ]};
  }
  return { label: "✦ AI Coach", chips: universal };
}
