// lessonContent.ts
// Full content for each of the 50 mini lessons.
// Linked to miniLessons.ts via `slug`. Same order: basic → intermediate → advanced.

export interface LessonSection {
  heading: string;
  body: string; // supports markdown-ish: **bold**, *italic*, `code`
}

export interface LessonExample {
  english: string;
  ipa?: string;
  translation?: string;
  note?: string;
}

export interface LessonExercise {
  instruction: string;
  items: string[];
  answers?: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // index of correct option
  explanation: string;
}

export interface LessonContent {
  slug: string;
  sections: LessonSection[];
  examples: LessonExample[];
  exercises: LessonExercise[];
  quiz: QuizQuestion[];
}

export const lessonContent: LessonContent[] = [

  // ─── 01 · schwa-sound ────────────────────────────────────────────────────────
  {
    slug: "schwa-sound",
    sections: [
      {
        heading: "What is the schwa?",
        body: "The schwa /ə/ is the most common vowel sound in English — and also the most ignored. It's the lazy, neutral sound your mouth makes when a vowel is unstressed: somewhere between 'uh' and 'eh', produced with a relaxed jaw and tongue in the center of the mouth.",
      },
      {
        heading: "Why it matters",
        body: "Spanish is a full-vowel language: every vowel sounds the way it's spelled. English is not. In English, unstressed vowels collapse into /ə/ regardless of how they're written. If you pronounce every vowel fully, you'll sound robotic — and harder to understand, not easier.",
      },
      {
        heading: "Where to find it",
        body: "The schwa appears in unstressed syllables of almost any word with two or more syllables. It also appears in function words (articles, prepositions, conjunctions) that aren't stressed in natural speech: 'a', 'the', 'to', 'of', 'and', 'but', 'for'.",
      },
      {
        heading: "How to practice",
        body: "Take any multi-syllable word and say it out loud. Find the stressed syllable — it's the one you say louder and longer. Every other vowel? Try replacing it with /ə/ and listen. Chances are that's how native speakers say it.",
      },
    ],
    examples: [
      { english: "banana", ipa: "/bəˈnɑː.nə/", translation: "First and last 'a' are schwas — only the middle is stressed.", },
      { english: "about", ipa: "/əˈbaʊt/", translation: "The 'a' at the start is a schwa." },
      { english: "photograph", ipa: "/ˈfoʊ.tə.ɡræf/", translation: "The 'o' in the middle collapses to /ə/." },
      { english: "the book", ipa: "/ðə bʊk/", translation: "'The' before a consonant is always /ðə/." },
      { english: "a cat", ipa: "/ə kæt/", translation: "The article 'a' is always a schwa in natural speech." },
    ],
    exercises: [
      {
        instruction: "Find the schwa in each word. How many schwas does each word contain?",
        items: ["family", "information", "comfortable", "different", "yesterday"],
        answers: ["fam-uh-lee (2)", "in-fuh-MAY-shun (2)", "COMF-tuh-bul (2)", "DIF-runt (1)", "YES-tuh-day (1)"],
      },
      {
        instruction: "Say these function words naturally in a sentence. Notice how 'of', 'to', 'and' reduce to /ə/, /tə/, /ən/.",
        items: [
          "a cup of tea",
          "I want to go",
          "fish and chips",
          "out of the question",
        ],
      },
    ],
    quiz: [
      {
        question: "Which syllable in 'banana' is NOT a schwa?",
        options: ["The first 'a'", "The second 'a' (stressed)", "The third 'a'", "None — all are schwas"],
        correct: 1,
        explanation: "Only the stressed middle syllable /ˈnɑː/ is a full vowel. The first and last 'a' are both /ə/.",
      },
      {
        question: "Why do native English speakers use the schwa so much?",
        options: [
          "They're being lazy and sloppy",
          "English is stress-timed, so unstressed syllables naturally reduce",
          "It's a regional accent feature",
          "Only British speakers use it",
        ],
        correct: 1,
        explanation: "English is a stress-timed language. Reducing unstressed syllables to /ə/ is a feature of the rhythm, not a mistake.",
      },
      {
        question: "How is 'the' pronounced before a consonant?",
        options: ["/ðiː/", "/ðeɪ/", "/ðə/", "/ðɪ/"],
        correct: 2,
        explanation: "'The' is /ðə/ before consonants and /ðɪ/ before vowels. The schwa form is far more common.",
      },
    ],
  },

  // ─── 02 · present-simple-vs-continuous ───────────────────────────────────────
  {
    slug: "present-simple-vs-continuous",
    sections: [
      {
        heading: "The core distinction",
        body: "Present Simple describes what is generally true: habits, facts, schedules, and states. Present Continuous describes what is happening at or around the moment of speaking — actions in progress or temporary situations.",
      },
      {
        heading: "Signal words",
        body: "Present Simple often appears with: always, usually, often, sometimes, never, every day/week/year, on Mondays. Present Continuous often appears with: now, right now, at the moment, currently, today, this week.",
      },
      {
        heading: "Stative verbs — the exception",
        body: "Some verbs describe states, not actions, and almost never appear in continuous form even when you're talking about right now. These are called stative verbs: know, believe, understand, want, need, prefer, love, hate, seem, appear, contain, belong.",
      },
      {
        heading: "Changing meaning",
        body: "A few verbs change meaning depending on which form you use. 'I think you're right' expresses an opinion (stative). 'I'm thinking about the problem' describes a mental process in progress (dynamic). Same verb, very different meaning.",
      },
    ],
    examples: [
      { english: "She works at a hospital.", note: "Habit / general fact — Present Simple" },
      { english: "She's working from home this week.", note: "Temporary situation — Present Continuous" },
      { english: "Water boils at 100°C.", note: "Scientific fact — always Present Simple" },
      { english: "I'm thinking about quitting.", note: "'Think' used dynamically — Continuous OK" },
      { english: "I think that's wrong.", note: "'Think' as opinion — Continuous NOT OK" },
    ],
    exercises: [
      {
        instruction: "Choose the correct form: Present Simple or Present Continuous.",
        items: [
          "I ___ (study) Japanese right now.",
          "She ___ (drink) coffee every morning.",
          "They ___ (not / understand) the question.",
          "We ___ (visit) my parents this weekend.",
          "He ___ (seem) tired lately.",
        ],
        answers: ["am studying", "drinks", "don't understand", "are visiting", "seems"],
      },
    ],
    quiz: [
      {
        question: "Which sentence is correct?",
        options: [
          "I am knowing the answer.",
          "I know the answer.",
          "I am knowing the answer right now.",
          "I do know the answer at the moment.",
        ],
        correct: 1,
        explanation: "'Know' is a stative verb and doesn't take the continuous form.",
      },
      {
        question: "'She is always losing her keys.' This use of Present Continuous expresses:",
        options: ["A habit", "An annoying repeated behavior", "A scheduled future event", "A permanent fact"],
        correct: 1,
        explanation: "Present Continuous + always expresses an annoying or surprising repeated behavior — often with an emotional tone.",
      },
    ],
  },

  // ─── 03 · silent-letters ─────────────────────────────────────────────────────
  {
    slug: "silent-letters",
    sections: [
      {
        heading: "Why does English have silent letters?",
        body: "English spelling was largely fixed in the 15th century, but pronunciation kept evolving. Silent letters are relics — sounds that were once pronounced but disappeared over centuries of language change.",
      },
      {
        heading: "Common silent letter patterns",
        body: "**Silent K:** always before 'n' at the start of a word (know, knife, kneel, knock). **Silent W:** before 'r' at the start of a word (write, wrong, wrap, wrist). **Silent G:** before 'n' at the start or end (gnat, gnaw, sign, foreign). **Silent B:** after 'm' at the end (bomb, comb, lamb, thumb). **Silent H:** in many common words (hour, honest, heir, ghost).",
      },
      {
        heading: "Silent letters in the middle",
        body: "Many common words have silent letters in the middle that trip up even advanced learners: 'Wednesday' /ˈwɛnzdeɪ/, 'February' /ˈfɛbruɛri/ → often /ˈfɛbjuɛri/, 'comfortable' /ˈkʌmftəbəl/, 'vegetable' /ˈvɛdʒtəbəl/.",
      },
    ],
    examples: [
      { english: "knife", ipa: "/naɪf/", translation: "K is silent" },
      { english: "island", ipa: "/ˈaɪlənd/", translation: "S is silent" },
      { english: "castle", ipa: "/ˈkæsəl/", translation: "T is silent" },
      { english: "receipt", ipa: "/rɪˈsiːt/", translation: "P is silent" },
      { english: "psychology", ipa: "/saɪˈkɒlədʒi/", translation: "P is silent" },
      { english: "subtle", ipa: "/ˈsʌtəl/", translation: "B is silent" },
    ],
    exercises: [
      {
        instruction: "Cross out the silent letter(s) in each word.",
        items: ["knight", "wrap", "gnome", "lamb", "honest", "daughter", "foreign", "Wednesday"],
        answers: ["k-night", "w-rap", "g-nome", "lam-b", "h-onest", "daugh-ter", "forei-gn", "Wed-nes-day"],
      },
    ],
    quiz: [
      {
        question: "Which word has a silent 'p'?",
        options: ["spin", "pneumonia", "plus", "upon"],
        correct: 1,
        explanation: "'Pneumonia' is pronounced /njuːˈmoʊniə/ — the P is completely silent.",
      },
      {
        question: "The word 'castle' is pronounced:",
        options: ["/ˈkæstəl/", "/ˈkæsəl/", "/ˈkɑːstəl/", "/ˈkæsl/"],
        correct: 1,
        explanation: "The T in 'castle' is silent: /ˈkæsəl/ (British English).",
      },
    ],
  },

  // ─── 04 · articles-a-an-the ──────────────────────────────────────────────────
  {
    slug: "articles-a-an-the",
    sections: [
      {
        heading: "The three articles",
        body: "'A' and 'an' are indefinite articles — they refer to one unspecified thing from a group. 'The' is the definite article — it refers to something specific that both speaker and listener can identify. Spanish uses definite articles far more broadly; English omits them in many places.",
      },
      {
        heading: "A vs. An",
        body: "Use 'an' before a vowel *sound* (not just a vowel letter). The rule is phonetic. 'An hour' (silent H → vowel sound). 'A university' (starts with /juː/ → consonant sound). 'An MBA' (M is pronounced 'em' → vowel sound).",
      },
      {
        heading: "When to omit the article",
        body: "No article before: plural nouns used generally ('Dogs are loyal'), uncountable nouns used generally ('Water is essential'), proper nouns ('She lives in Paris'), meals ('We had dinner'), languages ('She speaks French'), sports ('He plays tennis').",
      },
      {
        heading: "The for second mention and shared knowledge",
        body: "Once you've introduced something, refer to it with 'the'. Also use 'the' when context makes it clear which specific thing you mean — even if it's the first mention: 'Can you pass the salt?' works because there's only one salt on the table.",
      },
    ],
    examples: [
      { english: "I saw a dog. The dog was huge.", note: "First mention → 'a'. Second mention → 'the'." },
      { english: "She's a doctor.", note: "Profession: use 'a', not 'the'." },
      { english: "an hour", ipa: "/ən ˈaʊər/", note: "Silent H → treat as vowel sound" },
      { english: "a European city", ipa: "/ə jʊərəˈpiːən/", note: "'Eu' sounds like /j/ → use 'a'" },
      { english: "I love music.", note: "General uncountable → no article" },
    ],
    exercises: [
      {
        instruction: "Fill in the blank with a, an, the, or — (no article).",
        items: [
          "___ Eiffel Tower is in ___ Paris.",
          "She has ___ idea that could change everything.",
          "He plays ___ guitar every evening.",
          "I need ___ umbrella — it's raining.",
          "___ honesty is the best policy.",
        ],
        answers: ["The / —", "an", "—", "an", "—"],
      },
    ],
    quiz: [
      {
        question: "Which sentence is correct?",
        options: ["She is the doctor.", "She is a doctor.", "She is doctor.", "She is an doctor."],
        correct: 1,
        explanation: "Professions use the indefinite article 'a/an': 'She is a doctor.'",
      },
      {
        question: "'___ MBA from Harvard is valuable.' Which article fits?",
        options: ["A", "An", "The", "No article"],
        correct: 1,
        explanation: "'MBA' is pronounced 'em-bee-ay' — it starts with a vowel sound, so 'an' is correct.",
      },
    ],
  },

  // ─── 05 · common-contractions ────────────────────────────────────────────────
  {
    slug: "common-contractions",
    sections: [
      {
        heading: "Why contractions matter",
        body: "Contractions aren't informal slang — they're the natural default in spoken English and most written English outside formal documents. Avoiding them makes you sound stiff and unnaturally precise, which can actually make you harder to understand because listeners expect the contracted rhythm.",
      },
      {
        heading: "Negative contractions",
        body: "Negative contractions are especially important because they change the rhythm of the sentence significantly. 'I do not know' sounds formal or emphatic. 'I don't know' is neutral. Both are correct — but only one sounds natural in casual speech.",
      },
      {
        heading: "Weak forms and contractions together",
        body: "Contractions often combine with the weak (unstressed) forms of auxiliary verbs. In fast speech, 'I would have known' becomes 'I'd've known' /aɪdəv noʊn/. These double contractions are common in speech even if rarely written.",
      },
      {
        heading: "When NOT to contract",
        body: "Avoid contractions in formal writing (academic papers, legal documents, official letters). Also avoid them when you want to add emphasis: 'No, I am NOT going' — the stress falls on 'am' and 'not', which a contraction would eliminate.",
      },
    ],
    examples: [
      { english: "I am → I'm", ipa: "/aɪm/" },
      { english: "they are → they're", ipa: "/ðɛr/", note: "Often confused with 'there' and 'their'" },
      { english: "would not → wouldn't", ipa: "/ˈwʊdənt/" },
      { english: "I would have → I'd've", ipa: "/ˈaɪdəv/", note: "Double contraction — common in speech" },
      { english: "let us → let's", ipa: "/lɛts/" },
    ],
    exercises: [
      {
        instruction: "Rewrite each sentence using contractions where possible.",
        items: [
          "I am not sure what you are talking about.",
          "She would not have done it if she had known.",
          "They are going to be late, are they not?",
          "It is not as difficult as it looks.",
        ],
        answers: [
          "I'm not sure what you're talking about.",
          "She wouldn't have done it if she'd known.",
          "They're going to be late, aren't they?",
          "It's not as difficult as it looks.",
        ],
      },
    ],
    quiz: [
      {
        question: "Which contraction is grammatically incorrect?",
        options: ["she's", "they're", "amn't", "we've"],
        correct: 2,
        explanation: "'Amn't' exists in some dialects (Scottish, Irish English) but is not standard. The standard form is 'aren't I' in questions, or simply avoid the contraction.",
      },
      {
        question: "When should you AVOID contractions?",
        options: [
          "In casual conversation with friends",
          "In text messages",
          "In a formal academic essay",
          "When speaking to someone you just met",
        ],
        correct: 2,
        explanation: "Formal academic writing generally avoids contractions to maintain a professional, objective tone.",
      },
    ],
  },

  // ─── 06 · th-sounds ──────────────────────────────────────────────────────────
  {
    slug: "th-sounds",
    sections: [
      {
        heading: "Two sounds, one spelling",
        body: "The letters 'th' represent two distinct phonemes in English: the voiceless /θ/ (as in 'think') and the voiced /ð/ (as in 'this'). Both require the same mouth position — tongue near or between the upper and lower front teeth — but only /ð/ involves vocal cord vibration.",
      },
      {
        heading: "How to produce them",
        body: "Place the tip of your tongue lightly against the back of your upper front teeth (interdental position). For /θ/: push air out without voicing — like a sustained 's' but with the tongue forward. For /ð/: add voicing — you should feel vibration in your throat and tongue.",
      },
      {
        heading: "Which words use which?",
        body: "**Voiceless /θ/:** think, thank, through, three, throw, tooth, bath, math, cloth, both, truth. **Voiced /ð/:** this, that, the, these, those, there, then, though, with, bathe, breathe, smooth. A useful shortcut: most function words (the, this, that, they, them, their, there, then, though) use voiced /ð/.",
      },
      {
        heading: "Common substitutions and why they cause problems",
        body: "Spanish speakers often substitute /t/ or /d/ for the TH sounds, producing 'tink' for 'think' or 'dis' for 'this'. These are intelligible but noticeable. The substitution of /f/ or /v/ (common in some English dialects: 'fink', 'bruvver') also exists natively but may not be the target for learners.",
      },
    ],
    examples: [
      { english: "think / this", ipa: "/θɪŋk/ · /ðɪs/", note: "Minimal pair for the two TH sounds" },
      { english: "bath / bathe", ipa: "/bæθ/ · /beɪð/", note: "Noun vs. verb — voiceless vs. voiced" },
      { english: "teeth / teethe", ipa: "/tiːθ/ · /tiːð/", note: "Same pattern: noun voiceless, verb voiced" },
      { english: "three", ipa: "/θriː/", note: "Voiceless — content word" },
      { english: "the", ipa: "/ðə/", note: "Voiced — function word" },
    ],
    exercises: [
      {
        instruction: "Sort these words into /θ/ (voiceless) or /ð/ (voiced).",
        items: ["though", "thunder", "throw", "those", "thank", "breathe", "math", "with"],
        answers: [
          "/θ/: thunder, throw, thank, math",
          "/ð/: though, those, breathe, with",
        ],
      },
    ],
    quiz: [
      {
        question: "The /ð/ sound is called 'voiced' because:",
        options: [
          "It's louder than /θ/",
          "Your vocal cords vibrate when producing it",
          "It appears more often in English",
          "It's used in content words",
        ],
        correct: 1,
        explanation: "'Voiced' means the vocal cords vibrate. You can test this by placing a finger on your throat — you'll feel vibration for /ð/ but not for /θ/.",
      },
      {
        question: "Which group of words almost always uses voiced /ð/?",
        options: ["Nouns and adjectives", "Function words (the, this, that, they)", "Words ending in -th", "Words starting with thr-"],
        correct: 1,
        explanation: "Function words like 'the', 'this', 'that', 'they', 'them', 'there' consistently use voiced /ð/.",
      },
    ],
  },

  // ─── 07 · countable-uncountable ──────────────────────────────────────────────
  {
    slug: "countable-uncountable",
    sections: [
      {
        heading: "The core distinction",
        body: "Countable nouns can be counted as individual units and have both singular and plural forms: one apple, two apples. Uncountable nouns (also called mass nouns) refer to things seen as a continuous mass or concept — they have no natural plural and take singular verbs.",
      },
      {
        heading: "Common uncountable nouns that surprise learners",
        body: "Many nouns that have natural equivalents in Spanish are uncountable in English: advice (not 'advices'), information (not 'informations'), furniture (not 'furnitures'), luggage, homework, research, news, weather, traffic, money, time, work, knowledge.",
      },
      {
        heading: "Quantifiers",
        body: "Use different quantifiers depending on count status. Countable: many, few, a few, a number of, several. Uncountable: much, little, a little, a great deal of, an amount of. Both: some, any, a lot of, plenty of, most.",
      },
      {
        heading: "Making uncountable nouns countable",
        body: "You can make an uncountable noun countable by adding a container or unit: 'a piece of advice', 'a piece of information', 'two items of furniture', 'three pieces of luggage', 'a bit of research'. This is how native speakers quantify them.",
      },
    ],
    examples: [
      { english: "Can you give me some advice?", note: "Not 'an advice' or 'some advices'" },
      { english: "I need more information.", note: "Not 'more informations'" },
      { english: "a piece of furniture", note: "Container word makes it countable" },
      { english: "two loaves of bread", note: "'Loaves' is the container for 'bread'" },
      { english: "There's a lot of traffic today.", note: "'Traffic' is uncountable" },
    ],
    exercises: [
      {
        instruction: "Are these nouns countable (C) or uncountable (U)? Then use them in a short sentence.",
        items: ["luggage", "suitcase", "knowledge", "fact", "weather", "cloud", "homework", "assignment"],
        answers: ["U, C, U, C, U, C, U, C"],
      },
    ],
    quiz: [
      {
        question: "Which sentence is correct?",
        options: [
          "She gave me a good advice.",
          "She gave me some good advices.",
          "She gave me a good piece of advice.",
          "She gave me good advices.",
        ],
        correct: 2,
        explanation: "'Advice' is uncountable. To refer to one item, use 'a piece of advice'.",
      },
      {
        question: "Which quantifier can be used with BOTH countable and uncountable nouns?",
        options: ["many", "few", "a lot of", "several"],
        correct: 2,
        explanation: "'A lot of' works with both: 'a lot of apples' (C) and 'a lot of water' (U).",
      },
    ],
  },

  // ─── 08 · linking-words-basic ────────────────────────────────────────────────
  {
    slug: "linking-words-basic",
    sections: [
      {
        heading: "Why linking words matter",
        body: "Without connectors, ideas sit next to each other with no clear relationship. Linking words show the reader how ideas connect — whether one causes another, contrasts with it, or adds to it.",
      },
      {
        heading: "And — addition",
        body: "'And' adds information of equal weight. It joins clauses, phrases, and single words. Don't start every sentence with 'and' in formal writing, but it's natural and effective in speech.",
      },
      {
        heading: "But — contrast",
        body: "'But' introduces a contrast or unexpected result. It's the most common adversative connector in English. 'However' is its formal equivalent when starting a sentence.",
      },
      {
        heading: "So — result",
        body: "'So' introduces a result or consequence. 'Therefore' and 'as a result' are its formal equivalents. Note: 'so' in conversation often functions as a discourse marker too.",
      },
      {
        heading: "Because — reason",
        body: "'Because' introduces the reason for something. It answers 'why?' It must connect two clauses. 'Because of' is followed by a noun phrase: 'because of the rain' (not 'because the rain').",
      },
    ],
    examples: [
      { english: "I was tired, but I finished the report.", note: "Contrast — unexpected result" },
      { english: "It rained, so we cancelled the trip.", note: "Result" },
      { english: "She studied hard because she wanted to pass.", note: "Reason" },
      { english: "I like tea and coffee.", note: "Addition of equal items" },
      { english: "We stayed in because of the weather.", note: "'Because of' + noun phrase" },
    ],
    exercises: [
      {
        instruction: "Connect the two sentences using and, but, so, or because.",
        items: [
          "I was hungry. I made a sandwich.",
          "She likes jazz. She doesn't like classical music.",
          "He forgot his wallet. He couldn't pay.",
          "We left early. We wanted to avoid traffic.",
        ],
        answers: [
          "I was hungry, so I made a sandwich.",
          "She likes jazz but she doesn't like classical music.",
          "He forgot his wallet, so he couldn't pay.",
          "We left early because we wanted to avoid traffic.",
        ],
      },
    ],
    quiz: [
      {
        question: "Which sentence uses 'because' correctly?",
        options: [
          "I stayed home because of I was sick.",
          "I stayed home because the rain.",
          "I stayed home because I was sick.",
          "I stayed home because of I felt ill.",
        ],
        correct: 2,
        explanation: "'Because' is followed by a full clause (subject + verb). 'Because of' is followed by a noun phrase.",
      },
    ],
  },

  // ─── 09 · question-tags ──────────────────────────────────────────────────────
  {
    slug: "question-tags",
    sections: [
      {
        heading: "What are question tags?",
        body: "Question tags are short question forms appended to the end of a statement. They invite the listener to confirm or agree. They're extremely common in spoken British English and appear in all varieties of English.",
      },
      {
        heading: "The main rule",
        body: "Positive statement → negative tag. Negative statement → positive tag. The tag uses the same auxiliary verb as the main clause. If there's no auxiliary, use do/does/did.",
      },
      {
        heading: "Intonation matters",
        body: "Rising intonation on the tag ↗ means you're genuinely asking — you're not sure of the answer. Falling intonation ↘ means you're almost certain and just confirming, or inviting agreement. This is a crucial distinction.",
      },
      {
        heading: "Tricky cases",
        body: "'I am right, aren't I?' — not 'amn't I' (non-standard) or 'am I not?' (very formal). 'Let's go, shall we?' — 'shall' is the tag for 'let's'. 'This is Tom, isn't it?' — use 'it' for introductions with 'this'.",
      },
    ],
    examples: [
      { english: "It's cold today, isn't it?", note: "Positive → negative tag. Confirming." },
      { english: "You haven't met her, have you?", note: "Negative → positive tag." },
      { english: "She works here, doesn't she?", note: "No auxiliary → use 'do' in tag." },
      { english: "Let's take a break, shall we?", note: "Special case: 'let's' → 'shall we'" },
      { english: "I'm late, aren't I?", note: "Special case: 'am' → 'aren't'" },
    ],
    exercises: [
      {
        instruction: "Add the correct question tag to each sentence.",
        items: [
          "You can drive, ___?",
          "She didn't call, ___?",
          "They've been here before, ___?",
          "It's not going to rain, ___?",
          "Let's start, ___?",
        ],
        answers: ["can't you", "did she", "haven't they", "is it", "shall we"],
      },
    ],
    quiz: [
      {
        question: "What's the correct tag for 'I am your neighbor, ___'?",
        options: ["am I not?", "aren't I?", "isn't I?", "amn't I?"],
        correct: 1,
        explanation: "'Aren't I?' is the standard question tag for 'I am' in British English.",
      },
    ],
  },

  // ─── 10 · word-stress-basics ─────────────────────────────────────────────────
  {
    slug: "word-stress-basics",
    sections: [
      {
        heading: "What is word stress?",
        body: "Word stress is the emphasis placed on one syllable of a multi-syllable word. The stressed syllable is louder, longer, and at a slightly higher pitch than the others. In English, stress placement is unpredictable from spelling alone — you need to learn it word by word, or by recognizing patterns.",
      },
      {
        heading: "Why stress placement matters",
        body: "Misplaced stress is one of the leading causes of misunderstanding in English — even when all the sounds are correct. 'DEsert' (dry land) vs. 'desSERT' (sweet course) are understood differently not because the vowels are different, but because the stress is.",
      },
      {
        heading: "Stress shift with suffixes",
        body: "Adding certain suffixes causes the stress to shift: -tion, -sion, -ity, -ic push the stress to the syllable immediately before them. PHOtograph → phoTOgraphy → phoTOgraphic → photoGRAPHer. Learning these patterns saves time.",
      },
      {
        heading: "Noun vs. verb pairs",
        body: "Many two-syllable words in English use stress to distinguish nouns from verbs. Nouns are usually stressed on the first syllable; verbs on the second. REcord (n.) / reCORD (v.). PROtest (n.) / proTEST (v.). PERmit (n.) / perMIT (v.).",
      },
    ],
    examples: [
      { english: "PHOtograph / phoTOgraphy / photoGRAPHic", note: "Stress shifts with each suffix" },
      { english: "PREsent (n.) / preSENT (v.)", note: "Noun vs. verb stress pair" },
      { english: "OBject (n.) / obJECT (v.)", note: "Same pattern" },
      { english: "INcrease (n.) / inCREASE (v.)", note: "Same pattern" },
      { english: "naTION / naTIONal / naTIONality", note: "-ity pushes stress back" },
    ],
    exercises: [
      {
        instruction: "Mark the stressed syllable in each word (write the stressed syllable in CAPS).",
        items: ["information", "comfortable", "necessary", "economy", "opportunity"],
        answers: ["inforMAtion", "COMfortable", "NECessary", "eCONomy", "opporTUnity"],
      },
    ],
    quiz: [
      {
        question: "In the sentence 'I need to record the record,' the two words 'record' are:",
        options: [
          "Both nouns",
          "Both verbs",
          "First a verb, then a noun",
          "First a noun, then a verb",
        ],
        correct: 2,
        explanation: "'To reCORD' is the verb (stress on second syllable). 'The RECord' is the noun (stress on first syllable).",
      },
    ],
  },

  // ─── 11–50: remaining lessons ─────────────────────────────────────────────────
  // Slugs follow the same order as miniLessons.ts.
  // Sections, examples, exercises, and quiz follow the same schema.

  {
    slug: "past-simple-irregular",
    sections: [
      { heading: "Why irregular verbs exist", body: "Most English irregular past tense forms are descendants of Old English and Germanic strong verbs, which changed their internal vowel to mark tense (called ablaut). Regular '-ed' endings came later and became the default for new verbs. Irregular verbs survive because they're the most commonly used." },
      { heading: "The main patterns", body: "**Vowel change (ablaut):** sing/sang/sung, drink/drank/drunk, swim/swam/swum. **-ought group:** buy/bought, think/thought, bring/brought, catch/caught, teach/taught. **Same form all three:** put/put/put, cut/cut/cut, hit/hit/hit, let/let/let. **Totally unpredictable:** go/went (from a different Old English word), be/was/were/been." },
      { heading: "The top 20 you must know", body: "be, have, do, go, say, get, make, know, think, take, come, see, want, look, use, find, give, tell, become, show — all irregular. These 20 verbs account for a huge proportion of all English usage." },
    ],
    examples: [
      { english: "go → went", note: "Suppletion — completely different root" },
      { english: "buy → bought", ipa: "/baɪ/ → /bɔːt/", note: "-ought group" },
      { english: "sing → sang → sung", note: "Ablaut — vowel change pattern" },
      { english: "put → put → put", note: "Same form in all three" },
    ],
    exercises: [
      { instruction: "Write the simple past of each verb.", items: ["fly", "break", "steal", "freeze", "choose", "speak", "hide", "bite"], answers: ["flew", "broke", "stole", "froze", "chose", "spoke", "hid", "bit"] },
    ],
    quiz: [
      { question: "Which verb follows the same vowel-change pattern as 'sing/sang/sung'?", options: ["buy", "ring", "put", "tell"], correct: 1, explanation: "'Ring/rang/rung' follows the exact same ablaut pattern as 'sing/sang/sung'." },
    ],
  },

  {
    slug: "prepositions-time",
    sections: [
      { heading: "The size rule", body: "Think of time references as containers of different sizes. 'In' holds the largest containers: years, months, seasons, decades, centuries, parts of the day. 'On' holds medium containers: days and dates. 'At' holds the smallest, most precise containers: clock times and fixed points." },
      { heading: "Fixed expressions", body: "Some time expressions take no preposition at all: last week, next year, this morning, yesterday, today, tomorrow, every day. Don't add 'on' or 'in' before these — a very common error." },
    ],
    examples: [
      { english: "in 2024 · in March · in the morning · in spring", note: "Periods" },
      { english: "on Monday · on 15 March · on my birthday", note: "Days and dates" },
      { english: "at 3pm · at midnight · at noon · at night", note: "Clock times and fixed points" },
      { english: "I'll see you next Friday.", note: "No preposition before 'next'" },
    ],
    exercises: [
      { instruction: "Fill in with in, on, at, or — (no preposition).", items: ["___ the weekend", "___ Friday morning", "___ 2010", "___ Christmas Day", "___ last night", "___ noon"], answers: ["at/on (both used regionally)", "on", "in", "on", "—", "at"] },
    ],
    quiz: [
      { question: "Which is correct?", options: ["I was born in 15 March.", "I was born on 15 March.", "I was born at 15 March.", "I was born at March 15."], correct: 1, explanation: "Specific dates use 'on'." },
    ],
  },

  {
    slug: "some-any",
    sections: [
      { heading: "The basic rule", body: "'Some' goes in affirmative sentences. 'Any' goes in negative sentences and most questions. This holds for both countable plurals and uncountable nouns." },
      { heading: "Exceptions worth knowing", body: "Use 'some' in questions when you're making an offer or request — you expect the answer to be yes. 'Would you like some coffee?' / 'Could I have some help?' Using 'any' in these would sound cold or indifferent." },
      { heading: "Any in affirmative sentences", body: "'Any' in a positive sentence means 'it doesn't matter which one': 'Take any seat you like.' 'Call me any time.' This use expresses unlimited choice, not just negation." },
    ],
    examples: [
      { english: "I have some questions.", note: "Affirmative → some" },
      { english: "I don't have any questions.", note: "Negative → any" },
      { english: "Would you like some tea?", note: "Offer → some (expecting yes)" },
      { english: "Any student can join the club.", note: "Affirmative any = 'whichever'" },
    ],
    exercises: [
      { instruction: "Choose some or any.", items: ["There aren't ___ tickets left.", "Can I have ___ water?", "She didn't eat ___ breakfast.", "Take ___ book from the shelf."], answers: ["any", "some", "any", "any"] },
    ],
    quiz: [
      { question: "'Would you like ___ help?' — which word fits best?", options: ["any", "some", "no", "many"], correct: 1, explanation: "Offers use 'some' because the speaker expects or hopes for a positive response." },
    ],
  },

  {
    slug: "basic-phrasal-verbs",
    sections: [
      { heading: "What makes phrasal verbs hard", body: "Phrasal verbs combine a verb with one or two particles (prepositions or adverbs) to create a meaning that can't be predicted from the parts. 'Give up' has nothing to do with giving or with upward direction — it means 'stop trying'." },
      { heading: "Separable vs. inseparable", body: "Separable phrasal verbs allow the object to go between the verb and particle: 'Turn off the TV' / 'Turn the TV off'. With pronouns, separation is obligatory: 'Turn it off' (not 'Turn off it'). Inseparable phrasal verbs keep the particle attached: 'run into someone' — never 'run someone into'." },
    ],
    examples: [
      { english: "give up", translation: "rendirse / dejar de intentar" },
      { english: "find out", translation: "descubrir / enterarse de" },
      { english: "look up", translation: "buscar (en diccionario o internet)" },
      { english: "turn off / turn it off", translation: "apagar — separable" },
      { english: "run out of", translation: "quedarse sin algo — inseparable" },
    ],
    exercises: [
      { instruction: "Replace the underlined words with a phrasal verb from the lesson.", items: ["I need to search for this word in the dictionary.", "She stopped trying after the third attempt.", "We've exhausted our supply of coffee.", "Can you switch off the light?"], answers: ["look up", "gave up", "run out of", "turn off"] },
    ],
    quiz: [
      { question: "Which sentence uses a phrasal verb correctly?", options: ["She gave the challenge up.", "She gave up the challenge.", "She gave up it.", "She up gave the challenge."], correct: 1, explanation: "'Give up' + noun object can go either side. But with a pronoun, you MUST separate: 'gave it up'." },
    ],
  },

  {
    slug: "modal-ability",
    sections: [
      { heading: "Can — present ability", body: "'Can' expresses general ability in the present or future. It's also used for permission (informal) and possibility. It's the most versatile and common modal." },
      { heading: "Could — past ability and more", body: "'Could' expresses general ability in the past. Importantly, for a specific achievement in the past — something you managed to do on one particular occasion — use 'was/were able to', not 'could'. 'I could swim at age 5' (general). 'I was able to swim to the shore' (specific achievement)." },
      { heading: "Be able to — formal and all tenses", body: "'Be able to' can appear in any tense, making it more flexible than 'can' or 'could'. It's also more formal and is the only option after other modals: 'You might be able to get a refund.'",
      },
    ],
    examples: [
      { english: "I can speak three languages.", note: "General present ability" },
      { english: "She could read at age 4.", note: "General past ability" },
      { english: "I was able to finish the race despite the injury.", note: "Specific past achievement — NOT 'could'" },
      { english: "You might be able to catch an earlier train.", note: "After another modal → 'be able to'" },
    ],
    exercises: [
      { instruction: "Can, could, or was/were able to?", items: ["He ___ run very fast when he was young.", "After hours of trying, she ___ solve the puzzle.", "I ___ help you tomorrow if you need.", "___ you swim before you took lessons?"], answers: ["could", "was able to", "can", "Could"] },
    ],
    quiz: [
      { question: "Why is 'could' wrong in this sentence? 'The firefighters could rescue all the trapped people.'", options: ["'Could' can only refer to the future", "'Could' is wrong in positive sentences about past achievement", "'Could' can't follow 'the'", "'Could' requires 'have'"], correct: 1, explanation: "For a specific past achievement, 'was/were able to' is correct. 'Could' implies general ability, not a one-time success." },
    ],
  },

  {
    slug: "vowel-length",
    sections: [
      { heading: "Vowel length as a phoneme", body: "In English, vowel length — how long you hold a vowel sound — is phonemically meaningful. Changing the length changes the word. This is different from Spanish, where vowel length isn't distinctive." },
      { heading: "The key pairs", body: "The most important pairs: /ɪ/ (short) vs. /iː/ (long): ship/sheep, bit/beat, fit/feet, filled/field. /ʊ/ (short) vs. /uː/ (long): full/fool, pull/pool, look/Luke." },
    ],
    examples: [
      { english: "ship / sheep", ipa: "/ʃɪp/ · /ʃiːp/" },
      { english: "bit / beat", ipa: "/bɪt/ · /biːt/" },
      { english: "full / fool", ipa: "/fʊl/ · /fuːl/" },
      { english: "pull / pool", ipa: "/pʊl/ · /puːl/" },
    ],
    exercises: [
      { instruction: "Listen (or say aloud) and identify: short /ɪ/ or long /iː/?", items: ["live (verb)", "leave", "itch", "each", "hit", "heat"] },
    ],
    quiz: [
      { question: "Which pair are minimal pairs (same except for vowel length)?", options: ["ship / chip", "bit / bite", "sheep / ship", "fill / file"], correct: 2, explanation: "'Sheep' /ʃiːp/ and 'ship' /ʃɪp/ differ only in vowel length — a minimal pair." },
    ],
  },

  {
    slug: "frequency-adverbs",
    sections: [
      { heading: "Position rules", body: "Adverbs of frequency go: after 'be' ('She is always late'), before the main verb ('I usually walk to work'), after the first auxiliary ('She has never been to Japan'). This is different from Spanish, where placement is more flexible." },
      { heading: "Meaning and nuance", body: "The scale: always (100%) → usually/generally (80–90%) → often/frequently (60–70%) → sometimes/occasionally (30–50%) → rarely/seldom (10–20%) → never (0%). 'Hardly ever' is close to 'rarely' and very natural in speech." },
    ],
    examples: [
      { english: "I always drink coffee in the morning.", note: "Before main verb" },
      { english: "She is usually on time.", note: "After 'be'" },
      { english: "He has never visited Peru.", note: "After first auxiliary" },
      { english: "I hardly ever watch TV.", note: "Natural conversational alternative to 'rarely'" },
    ],
    exercises: [
      { instruction: "Place the adverb in the correct position.", items: ["I go to the gym. (sometimes)", "She is late for meetings. (never)", "They have eaten sushi. (rarely)", "He takes the bus. (usually)"], answers: ["I sometimes go to the gym.", "She is never late for meetings.", "They have rarely eaten sushi.", "He usually takes the bus."] },
    ],
    quiz: [
      { question: "Where does 'always' go in 'She takes a walk in the evening'?", options: ["Always she takes...", "She always takes...", "She takes always...", "She takes a always walk..."], correct: 1, explanation: "Adverbs of frequency go before the main verb (and after the subject)." },
    ],
  },

  {
    slug: "basic-listening-reductions",
    sections: [
      { heading: "Why fast English sounds different", body: "The English you hear in conversation is not the English you read. Native speakers apply a set of systematic reductions to unstressed and frequent words, making speech faster and more rhythmic. These aren't mistakes — they're features of natural spoken English." },
      { heading: "The most common reductions", body: `'Want to' → 'wanna'. 'Going to' → 'gonna'. 'Have to' → 'hafta'. 'Don't know' → 'dunno'. 'Kind of' → 'kinda'. 'Out of' → 'outta'. 'Them' → 'em'. 'Him' → "'im". These are not informal — they happen automatically in normal speech.` },
      { heading: "Strategy for learners", body: "You don't need to produce these reductions — but you must be able to hear and decode them. Practice by listening to authentic audio (podcasts, YouTube) and pausing to identify what was actually said. Shadow the speaker to train your ear and mouth together." },
    ],
    examples: [
      { english: "What are you doing?", ipa: "/wʌd͡ʒə ˈduːɪŋ/", note: "whadja doing?" },
      { english: "I don't know", ipa: "/aɪ ˈdoʊnə/", note: "I dunno" },
      { english: "I'm going to eat", ipa: "/aɪm ˈɡʌnə iːt/", note: "gonna" },
      { english: "Give it to me", ipa: "/ɡɪvɪtə miː/", note: "All words link together" },
    ],
    exercises: [
      { instruction: "Write the full, careful pronunciation of each reduced form.", items: ["wanna", "hafta", "kinda", "gonna", "outta"], answers: ["want to", "have to", "kind of", "going to", "out of"] },
    ],
    quiz: [
      { question: "Why do native speakers use reductions?", options: ["To be rude or lazy", "Because they don't know the full forms", "Because English is stress-timed and reductions create natural rhythm", "To confuse learners"], correct: 2, explanation: "Reductions are a natural feature of English rhythm. Stress-timed language compresses unstressed syllables — reductions are the result." },
    ],
  },

  // ─── INTERMEDIATE ─────────────────────────────────────────────────────────────

  {
    slug: "present-perfect-vs-past",
    sections: [
      { heading: "The Spanish interference problem", body: "Spanish uses preterite for both functions. 'He visto esa película' can mean both 'I saw that film' (specific past event) and 'I have seen that film' (life experience). English separates these into two tenses with strict rules." },
      { heading: "Present Perfect: connection to now", body: "Use Present Perfect when the time of the action is unspecified, irrelevant, or still connected to the present. Three main uses: experience ('I've been to Japan'), recent past with present result ('She's broken her arm'), and continuing situations ('I've worked here for 5 years')." },
      { heading: "Past Simple: completed in the past", body: "Use Past Simple when the action is complete and the time is specified or implied to be a finished period: 'yesterday', 'last week', 'in 2019', 'when I was a child', 'after dinner'." },
    ],
    examples: [
      { english: "I've seen that film.", note: "Experience — when is irrelevant" },
      { english: "I saw that film last Friday.", note: "Specific time → Past Simple" },
      { english: "She's lost her keys.", note: "Recent past with present result: she still doesn't have them" },
      { english: "She lost her keys yesterday.", note: "Specific time → Past Simple" },
    ],
    exercises: [
      { instruction: "Present Perfect or Simple Past?", items: ["I ___ (never / try) sushi. Do you recommend it?", "We ___ (meet) at a conference in 2021.", "She ___ (just / finish) the report.", "___ you ever ___ (be) to Ireland?"], answers: ["have never tried", "met", "has just finished", "Have you ever been"] },
    ],
    quiz: [
      { question: "Which sentence is correct?", options: ["Did you ever eat fugu?", "Have you ever eaten fugu?", "Have you ever ate fugu?", "Did you eat ever fugu?"], correct: 1, explanation: "'Ever' in a general life-experience question uses Present Perfect: 'Have you ever eaten...?'" },
    ],
  },

  {
    slug: "sentence-stress",
    sections: [
      { heading: "Content words vs. function words", body: "In natural English, content words (nouns, main verbs, adjectives, adverbs) are stressed. Function words (articles, prepositions, pronouns, auxiliary verbs, conjunctions) are unstressed and often reduced. This creates the characteristic rhythm of English." },
      { heading: "Contrastive stress", body: "When you want to contrast or correct something, you shift stress deliberately: 'I said I LIKE him, not that I LOVE him.' The stressed word is the one that carries the contrast. This is one of the most expressive tools in spoken English." },
    ],
    examples: [
      { english: "I didn't say SHE stole the money.", note: "Implies: someone else did" },
      { english: "I didn't say she STOLE the money.", note: "Implies: she did something else with it" },
      { english: "I didn't SAY she stole the money.", note: "Implies: I wrote it / implied it" },
      { english: "I DIDN'T say she stole the money.", note: "Implies: someone else said it" },
    ],
    exercises: [
      { instruction: "Underline the word you'd stress to convey the meaning in parentheses.", items: ["He drives a red car. (not a blue one)", "She plays piano. (not guitar)", "I want coffee. (not tea)"] },
    ],
    quiz: [
      { question: "In stress-timed English, which words are typically unstressed?", options: ["Nouns and adjectives", "Main verbs and adverbs", "Prepositions and articles", "All words equally"], correct: 2, explanation: "Function words (prepositions, articles, pronouns, auxiliaries) are typically unstressed and reduced in natural speech." },
    ],
  },

  {
    slug: "conditionals-zero-first",
    sections: [
      { heading: "Zero conditional", body: "Structure: If + present simple, present simple. Used for universal truths, scientific facts, and things that always happen as a consequence of something else. 'If' can be replaced with 'when' without changing meaning." },
      { heading: "First conditional", body: "Structure: If + present simple, will + infinitive. Used for real, likely situations in the present or future. The 'if' clause sets up a realistic condition; the main clause states its probable result." },
      { heading: "Other modals in first conditional", body: "The main clause doesn't have to use 'will'. You can use: might (less certain), can (ability), should (advice), imperative: 'If you're hungry, help yourself.'" },
    ],
    examples: [
      { english: "If you heat ice, it melts.", note: "Zero — always true" },
      { english: "If it rains tomorrow, I'll stay home.", note: "First — likely future" },
      { english: "If you see her, tell her I called.", note: "First — imperative in main clause" },
      { english: "If you're tired, you might want to rest.", note: "First — 'might' for less certain result" },
    ],
    exercises: [
      { instruction: "Complete with the correct form.", items: ["If you ___ (mix) red and blue, you ___ (get) purple.", "If she ___ (study) harder, she ___ (pass) the exam.", "Water ___ (boil) if you ___ (heat) it to 100°C."], answers: ["mix / get", "studies / will pass", "boils / heat"] },
    ],
    quiz: [
      { question: "Which conditional is used for real, likely future situations?", options: ["Zero", "First", "Second", "Third"], correct: 1, explanation: "First conditional (if + present simple, will + infinitive) describes real, probable future situations." },
    ],
  },

  {
    slug: "collocations-make-do",
    sections: [
      { heading: "The rough rule", body: "'Make' tends to involve creating, producing, or causing something to come into existence. 'Do' tends to involve activities, tasks, and processes — things you perform or carry out." },
      { heading: "Make collocations", body: "make a decision, make a mistake, make money, make a suggestion, make progress, make an effort, make a phone call, make a reservation, make friends, make sense, make a noise, make an excuse." },
      { heading: "Do collocations", body: "do homework, do research, do your best, do exercise, do the dishes, do someone a favor, do damage, do business, do your hair, do a course, do well/badly, do without." },
    ],
    examples: [
      { english: "She made an important decision.", note: "Not 'did a decision'" },
      { english: "He does research at a university.", note: "Not 'makes research'" },
      { english: "You made a mistake.", note: "Not 'did a mistake'" },
      { english: "I'll do my best.", note: "Fixed expression with 'do'" },
    ],
    exercises: [
      { instruction: "Make or do?", items: ["___ a suggestion", "___ the laundry", "___ progress", "___ someone a favor", "___ a profit", "___ exercise"], answers: ["make", "do", "make", "do", "make", "do"] },
    ],
    quiz: [
      { question: "Which sentence is correct?", options: ["I did a mistake.", "I made a mistake.", "I made the dishes.", "I did a suggestion."], correct: 1, explanation: "'Make a mistake' is a fixed collocation. 'Do' is used with 'the dishes' and 'do' activities." },
    ],
  },

  {
    slug: "passive-voice-intro",
    sections: [
      { heading: "When to use passive", body: "Use passive voice when: (1) the action is more important than the agent, (2) the agent is unknown or obvious, (3) you want to avoid mentioning the agent (tactful or formal writing)." },
      { heading: "How to form it", body: "Subject + be (conjugated) + past participle. The tense of 'be' determines the tense: 'is written' (present simple passive), 'was written' (past simple passive), 'has been written' (present perfect passive)." },
      { heading: "By-phrase", body: "Add 'by + agent' only when the agent is new information worth mentioning. 'The Mona Lisa was painted by Leonardo da Vinci.' — here the agent matters. 'My bike was stolen.' — no agent because it's unknown." },
    ],
    examples: [
      { english: "The contract was signed yesterday.", note: "Agent unknown or irrelevant" },
      { english: "English is spoken in over 50 countries.", note: "Agent obvious" },
      { english: "The company has been sold.", note: "Present perfect passive" },
      { english: "She was awarded the Nobel Prize.", note: "Agent could be added: '...by the committee'" },
    ],
    exercises: [
      { instruction: "Rewrite in passive voice.", items: ["Someone broke the window.", "They manufacture these cars in Germany.", "The manager will announce the results.", "People speak French in Quebec."], answers: ["The window was broken.", "These cars are manufactured in Germany.", "The results will be announced.", "French is spoken in Quebec."] },
    ],
    quiz: [
      { question: "When should you NOT include 'by + agent' in a passive sentence?", options: ["When the agent is famous", "When the agent is unknown or obvious", "Always — passive never uses 'by'", "When the sentence is in present tense"], correct: 1, explanation: "Add 'by + agent' only when the agent provides meaningful new information. Omit it when the agent is unknown or obvious." },
    ],
  },

  {
    slug: "intonation-questions",
    sections: [
      { heading: "Rising intonation ↗", body: "Rising intonation signals that something is open, unfinished, or invites a response. Yes/No questions rise at the end because the speaker doesn't know the answer. Also used in lists (except the final item) and in question tags when genuinely asking." },
      { heading: "Falling intonation ↘", body: "Falling intonation signals completion, certainty, or conclusion. Wh- questions (who, what, where, when, why, how) fall — the speaker expects information, not just yes/no. Statements also fall when the speaker is confident." },
      { heading: "Intonation and attitude", body: "The same words with different intonation can convey very different attitudes. A flat or falling 'really?' sounds skeptical or uninterested. A rising 'really?' sounds surprised and engaged. Intonation carries enormous pragmatic weight in English." },
    ],
    examples: [
      { english: "Are you coming? ↗", note: "Yes/no question — rising" },
      { english: "Where are you going? ↘", note: "Wh- question — falling" },
      { english: "Coffee, tea, ↗ or water? ↘", note: "List: rise on each item, fall on last" },
      { english: "It's cold today, isn't it? ↘", note: "Tag question confirming — falling" },
    ],
    exercises: [
      { instruction: "Mark each with ↗ (rising) or ↘ (falling).", items: ["What time does it start?", "Is this seat taken?", "Who called?", "Did you enjoy the film?", "How do you spell that?"] },
    ],
    quiz: [
      { question: "A rising intonation on a question tag means:", options: ["You're certain of the answer", "You're genuinely asking and not sure of the answer", "You're being sarcastic", "You're annoyed"], correct: 1, explanation: "Rising intonation on a question tag signals genuine uncertainty — you really want confirmation." },
    ],
  },

  {
    slug: "reported-speech",
    sections: [
      { heading: "Backshifting", body: "When you report what someone said, you shift verbs one tense back: present simple → past simple, present continuous → past continuous, past simple → past perfect, will → would, can → could, may → might." },
      { heading: "Other changes", body: "Pronouns change to match the new perspective. Time and place expressions often change: now → then, today → that day, yesterday → the day before, here → there, this → that." },
      { heading: "When NOT to backshift", body: "Don't backshift if the statement is still true at the time of reporting: 'She said she lives in Madrid' (still true now). Also, statements about general truths or scientific facts don't need backshifting." },
    ],
    examples: [
      { english: "'I am tired.' → She said she was tired.", note: "am → was" },
      { english: "'I will call you.' → He said he would call me.", note: "will → would" },
      { english: "'I've finished.' → She said she had finished.", note: "present perfect → past perfect" },
      { english: "'I can help.' → He said he could help.", note: "can → could" },
    ],
    exercises: [
      { instruction: "Report each sentence using 'said'.", items: ["'I'm leaving tomorrow.' (she)", "'We have already eaten.' (they)", "'I'll meet you at noon.' (he)", "'I can't find my keys.' (she)"], answers: ["She said she was leaving the next day.", "They said they had already eaten.", "He said he would meet me at noon.", "She said she couldn't find her keys."] },
    ],
    quiz: [
      { question: "You report: 'He said, \"I work at Google.\"' Which is correct?", options: ["He said he works at Google.", "He said he worked at Google.", "He said he has worked at Google.", "He said I work at Google."], correct: 1, explanation: "Backshift: works → worked. (Unless Google is clearly his current employer and you're reporting it as still true.)" },
    ],
  },

  {
    slug: "get-collocations",
    sections: [
      { heading: "'Get' as become", body: "'Get' + adjective means to become: get tired, get angry, get better, get worse, get married, get dressed, get lost, get stuck. This is extremely common and more natural than 'become' in spoken English." },
      { heading: "'Get' as obtain/receive", body: "'Get' + noun can mean receive or obtain: get a call, get a message, get a raise, get a job, get the point, get a degree, get permission." },
      { heading: "'Get' as arrive/reach", body: "'Get' + place or 'get to' + place means arrive: 'When did you get home?' 'I got to the office late.' 'Get there early.'" },
    ],
    examples: [
      { english: "I'm getting tired.", translation: "me estoy cansando" },
      { english: "She got a promotion last month.", translation: "recibió / consiguió" },
      { english: "What time did you get home?", translation: "llegaste a casa" },
      { english: "I don't get it.", translation: "no lo entiendo" },
      { english: "Get well soon.", translation: "expresión fija: mejórate pronto" },
    ],
    exercises: [
      { instruction: "Replace the underlined word with the correct form of 'get'.", items: ["She became very angry.", "I received your email.", "He arrived home late.", "I don't understand the joke."], answers: ["got", "got", "got", "get"] },
    ],
    quiz: [
      { question: "'Get' + adjective most closely means:", options: ["to have", "to become", "to give", "to find"], correct: 1, explanation: "'Get' + adjective describes a transition into a new state — it means 'become'." },
    ],
  },

  {
    slug: "second-conditional",
    sections: [
      { heading: "Structure and meaning", body: "If + past simple, would + infinitive. The second conditional describes unreal or unlikely situations in the present or future. The past tense in the if-clause doesn't refer to the past — it creates 'distance' from reality." },
      { heading: "Were, not was", body: "In formal English and in careful speech, use 'were' for all persons in second conditional if-clauses: 'If I were you...', 'If she were here...', 'If it were possible...'. 'Was' is increasingly accepted informally, but 'were' is the safe choice." },
      { heading: "Giving advice", body: "'If I were you, I would...' is the standard structure for advice. It's extremely common and useful in both professional and personal contexts." },
    ],
    examples: [
      { english: "If I had more time, I'd learn the piano.", note: "Unreal present — I don't have more time" },
      { english: "If she were taller, she could be a model.", note: "Formal 'were' for all persons" },
      { english: "If I were you, I'd apologize immediately.", note: "Advice formula" },
      { english: "What would you do if you won the lottery?", note: "Unlikely hypothetical" },
    ],
    exercises: [
      { instruction: "Complete with second conditional.", items: ["If I ___ (be) you, I ___ (tell) him the truth.", "She ___ (travel) more if she ___ (have) money.", "If he ___ (study) medicine, he ___ (become) a doctor.", "What ___ you ___ (do) if you ___ (lose) your job?"], answers: ["were / would tell", "would travel / had", "would have become / had studied", "would you do / lost"] },
    ],
    quiz: [
      { question: "The second conditional describes:", options: ["Real, likely future situations", "Unreal or hypothetical present/future situations", "Past regrets", "Permanent universal truths"], correct: 1, explanation: "Second conditional = imaginary or unlikely present/future. The past form in the if-clause signals distance from reality." },
    ],
  },

  {
    slug: "discourse-markers",
    sections: [
      { heading: "What discourse markers do", body: "Discourse markers organize spoken and written language. They signal what comes next: a contrast, an example, a conclusion, a new point, a clarification. Using them makes you sound fluent and coherent rather than halting." },
      { heading: "For contrast and concession", body: "'Having said that' / 'That said' — acknowledge a point then introduce a qualification. 'Even so' — despite what was just said. 'Be that as it may' — formal, accepting a point but not letting it change your argument." },
      { heading: "For adding and emphasizing", body: "'As a matter of fact' — introduces a surprising or strong supporting fact. 'Come to think of it' — something you've just remembered or realized. 'Not to mention' — adds a powerful extra point." },
    ],
    examples: [
      { english: "The project was difficult. Having said that, the results were impressive.", note: "Introduces a qualification" },
      { english: "As a matter of fact, I've been here three times.", note: "Introduces a surprising supporting detail" },
      { english: "Come to think of it, I left my keys inside.", note: "Something just remembered" },
      { english: "The food was excellent, not to mention the service.", note: "Adds extra emphasis" },
    ],
    exercises: [
      { instruction: "Insert a discourse marker from the lesson.", items: ["The movie was too long. ___, the acting was superb.", "I've never been to Tokyo. ___, I'd love to go.", "She's experienced. ___, she's also brilliant under pressure."] },
    ],
    quiz: [
      { question: "'Having said that' is used to:", options: ["Introduce a supporting point", "Introduce a contrast or qualification after acknowledging something", "Change the subject", "Summarize what was said"], correct: 1, explanation: "'Having said that' acknowledges the previous point but then introduces something that qualifies or contrasts with it." },
    ],
  },

  {
    slug: "noun-verb-conversion",
    sections: [
      { heading: "Conversion in English", body: "English allows many words to shift grammatical category without any change in form. This process — called conversion or zero derivation — is more common in English than in most languages. When a noun becomes a verb, it typically gains the meaning 'to act as a [noun]' or 'to use a [noun]'." },
      { heading: "Stress as the signal", body: "For two-syllable noun/verb pairs, stress is the only phonetic signal. REcord (noun) / reCORD (verb). PROtest / proTEST. PERmit / perMIT. PROgress / proGRESS. REfund / reFUND." },
    ],
    examples: [
      { english: "a REcord (n.) / to reCORD (v.)", note: "Stress shift signals the category" },
      { english: "to email someone", note: "Noun 'email' converted to verb" },
      { english: "to Google something", note: "Proper noun → verb" },
      { english: "to text someone", note: "Noun → verb — now standard" },
      { english: "to shortlist candidates", note: "Compound noun → verb" },
    ],
    exercises: [
      { instruction: "Use each word as both a noun and a verb in two sentences.", items: ["email", "water", "book", "police"] },
    ],
    quiz: [
      { question: "In 'We need to progress faster', 'progress' is:", options: ["A noun stressed on the first syllable", "A verb stressed on the second syllable", "An adjective", "An adverb"], correct: 1, explanation: "When 'progress' is a verb, stress falls on the second syllable: proGRESS." },
    ],
  },

  {
    slug: "modals-deduction",
    sections: [
      { heading: "Degrees of certainty", body: "Must (95%+): logical conclusion from evidence. Might/may/could (30–60%): possibility, not certain. Can't/couldn't (near 0%): logical impossibility — contradicts evidence." },
      { heading: "Past deduction", body: "Add 'have + past participle' for deduction about the past: 'She must have forgotten.' 'He might have left already.' 'That can't have been her — she was abroad.'" },
    ],
    examples: [
      { english: "She must be exhausted — she's been awake for 30 hours.", note: "Strong logical conclusion" },
      { english: "He might be in a meeting.", note: "Possibility — you're not sure" },
      { english: "That can't be right — I checked the figures myself.", note: "Logical impossibility" },
      { english: "She must have missed the train.", note: "Past deduction" },
    ],
    exercises: [
      { instruction: "Use must, might, or can't to react to each situation.", items: ["The light is on and music is playing. (someone is home)", "She's not answering her phone. (busy / asleep / out)", "He says he's 7 feet tall. (impossible / unlikely)", "She got 100% on every test. (very intelligent)"] },
    ],
    quiz: [
      { question: "'That can't be Tom — he moved to Australia.' 'Can't' here expresses:", options: ["Inability", "Permission denied", "Logical impossibility", "A request"], correct: 2, explanation: "'Can't be' expresses logical impossibility based on evidence — equivalent to 'it's impossible that it is Tom'." },
    ],
  },

  {
    slug: "relative-clauses",
    sections: [
      { heading: "Defining relative clauses", body: "A defining relative clause identifies which person or thing you mean. Without it, the sentence loses its meaning or becomes too vague. No commas. Can use 'that' instead of 'who/which'. The relative pronoun can be omitted if it's the object: 'The book (that) I bought was excellent.'" },
      { heading: "Non-defining relative clauses", body: "A non-defining relative clause adds extra, non-essential information about a noun already identified. Always use commas. Cannot use 'that'. Cannot omit the relative pronoun. 'My sister, who lives in London, is visiting.' — remove the clause and the sentence still makes sense." },
    ],
    examples: [
      { english: "The woman who called is my manager.", note: "Defining — tells us which woman" },
      { english: "My manager, who called earlier, wants to meet.", note: "Non-defining — manager already identified" },
      { english: "The film (that) I recommended was great.", note: "Object relative pronoun — can be omitted" },
      { english: "Shakespeare, whose plays are still performed, was born in 1564.", note: "Non-defining with 'whose'" },
    ],
    exercises: [
      { instruction: "Add commas if the clause is non-defining. Write 'D' or 'ND'.", items: ["The house where I grew up has been demolished.", "My father who is a doctor works at the local hospital.", "The report that you submitted had several errors.", "Lima which is the capital of Peru is a fascinating city."] },
    ],
    quiz: [
      { question: "Which sentence uses a non-defining relative clause correctly?", options: ["The car that is red is mine.", "My car, which is red, is mine.", "My car which is red is mine.", "The car, that is red, is mine."], correct: 1, explanation: "Non-defining clauses: commas required, 'which' not 'that', pronoun cannot be omitted." },
    ],
  },

  {
    slug: "connected-speech",
    sections: [
      { heading: "Linking", body: "When a word ends in a consonant and the next begins with a vowel, they link together as if part of the same word: 'an apple' → /ə ˈnæp.əl/, 'turn it off' → /ˈtɜː.nɪt ɒf/. This is the most frequent connected speech process." },
      { heading: "Elision", body: "Elision is the disappearance of a sound. The most common: /t/ and /d/ between two consonants ('last night' → /læs naɪt/, 'next door' → /nɛks dɔːr/), and the /h/ in unstressed pronouns ('tell him' → /ˈtɛl ɪm/)." },
      { heading: "Assimilation", body: "Assimilation is when one sound changes to become more like an adjacent sound. 'Ten boys' → /ˈtem bɔɪz/ (n → m before a bilabial). 'That person' → /ˈðæp ˈpɜːsən/ (t → p before bilabial). This happens automatically in fast speech." },
    ],
    examples: [
      { english: "an apple", ipa: "/ə ˈnæp.əl/", note: "Linking: n + vowel" },
      { english: "next day", ipa: "/nɛks deɪ/", note: "Elision: /t/ disappears" },
      { english: "ten boys", ipa: "/ˈtem bɔɪz/", note: "Assimilation: /n/ → /m/ before /b/" },
      { english: "give me", ipa: "/ˈɡɪmi/", note: "Linking and reduction together" },
    ],
    exercises: [
      { instruction: "Identify which process (linking, elision, or assimilation) applies to each phrase.", items: ["in an hour", "good boy", "last chance", "pick it up"] },
    ],
    quiz: [
      { question: "In 'that person', the /t/ at the end of 'that' changes to /p/ because:", options: ["The speaker is being lazy", "Assimilation: the /t/ anticipates the bilabial /p/ that follows", "Elision removes the sound entirely", "Linking joins the two words"], correct: 1, explanation: "This is anticipatory (regressive) assimilation — the place of articulation of /t/ shifts to match the following /p/." },
    ],
  },

  {
    slug: "hedging-language",
    sections: [
      { heading: "Why hedge?", body: "Hedging is not weakness — it's intellectual honesty and rhetorical strategy. Absolute claims are easy to disprove. Hedged claims are more defensible. In academic and professional English, strong claims without hedging signal overconfidence or naivety." },
      { heading: "Modal hedges", body: "Modals for hedging: may, might, could, should. 'This may suggest...', 'The results could indicate...', 'There might be a connection...' Note: 'should' in academic writing sometimes means 'logically ought to be the case'." },
      { heading: "Lexical hedges", body: "Verbs: suggest, indicate, appear, seem, tend to, point to. Adjectives/adverbs: possible, probable, likely, relatively, generally, broadly, approximately. Phrases: 'it is worth noting that', 'the evidence tends to suggest'." },
    ],
    examples: [
      { english: "This suggests a link between X and Y.", note: "'Suggests' — not 'proves'" },
      { english: "It seems likely that the trend will continue.", note: "'Seems' + 'likely' — double hedge" },
      { english: "The data tend to indicate a correlation.", note: "'Tend to indicate' — not 'show'" },
      { english: "Approximately 60% of participants...", note: "'Approximately' — not '60%' with false precision" },
    ],
    exercises: [
      { instruction: "Soften each claim using hedging language.", items: ["Climate change causes more extreme weather.", "Social media makes teenagers depressed.", "The new policy will reduce crime.", "People who exercise live longer."], answers: ["Climate change may contribute to more extreme weather.", "Social media might be linked to increased depression in teenagers.", "The new policy could help reduce crime.", "Evidence suggests that people who exercise tend to live longer."] },
    ],
    quiz: [
      { question: "Which sentence uses the STRONGEST hedge?", options: ["This proves a link.", "This suggests a link.", "This may suggest a possible link.", "This indicates a link."], correct: 2, explanation: "'May suggest a possible link' contains multiple hedges — modal 'may' + verb 'suggest' + adjective 'possible'. It's the most cautious formulation." },
    ],
  },

  {
    slug: "false-friends",
    sections: [
      { heading: "What are false friends?", body: "False friends (or false cognates) are words in two languages that look or sound similar but have different meanings. Spanish and English share many Latin roots, which means there are hundreds of false friends waiting to trip you up." },
      { heading: "The most embarrassing ones", body: "'Embarrassed' does not mean embarazada (pregnant) — it means ashamed or awkward. 'Actually' does not mean actualmente (currently/nowadays) — it means in fact / in reality. 'Eventually' does not mean eventualmente (possibly) — it means in the end / sooner or later." },
      { heading: "More common false friends", body: "'Library' = biblioteca (not librería). 'Sensible' = sensato/a (not sensible). 'Sympathetic' = compasivo/a (not simpático/a). 'Lecture' = clase magistral / conferencia (not lectura). 'Success' = éxito (not suceso)." },
    ],
    examples: [
      { english: "I was so embarrassed.", translation: "Estaba muy avergonzada — NOT 'embarazada'" },
      { english: "Actually, I agree with you.", translation: "En realidad / De hecho — NOT 'actualmente'" },
      { english: "She was very sympathetic.", translation: "Era muy comprensiva / compasiva — NOT 'simpática'" },
      { english: "He's a sensible person.", translation: "Es una persona sensata — NOT 'sensible'" },
    ],
    exercises: [
      { instruction: "Translate these sentences, avoiding false friends.", items: ["The conference was a great success.", "I attend a lecture every Monday.", "She finally introduced herself — she seemed quite sympathetic.", "He eventually admitted his mistake."] },
    ],
    quiz: [
      { question: "'Eventually' in English means:", options: ["Sometimes / possibly", "Currently / nowadays", "In the end / sooner or later", "Actually / in reality"], correct: 2, explanation: "'Eventually' means 'in the end' or 'after a long time'. It does NOT mean 'possibly' like Spanish 'eventualmente'." },
    ],
  },

  {
    slug: "present-perfect-continuous",
    sections: [
      { heading: "Form", body: "Have/has + been + verb-ing. This tense combines the Present Perfect (connection to now) with the Continuous (ongoing process), emphasizing the duration or the recent activity that produced a visible result." },
      { heading: "Duration vs. result", body: "'I've been running' can emphasize how long you've been doing it ('for 2 hours') or explain a visible result ('I'm sweaty and out of breath'). Both meanings coexist in the same form." },
      { heading: "Vs. Present Perfect Simple", body: "Simple ('I've read 50 pages') emphasizes what has been accomplished — a result or quantity. Continuous ('I've been reading') emphasizes the ongoing activity. With 'for' and 'since', both can work — but Continuous often feels more natural for ongoing activities." },
    ],
    examples: [
      { english: "I've been studying for three hours.", note: "Duration emphasized" },
      { english: "She's been crying — her eyes are red.", note: "Visible result of recent activity" },
      { english: "They've been arguing all morning.", note: "Ongoing, irritating activity" },
      { english: "How long have you been waiting?", note: "Duration question — always Continuous" },
    ],
    exercises: [
      { instruction: "Present Perfect Simple or Continuous?", items: ["I ___ (write) 5 emails today. (completed quantity)", "She ___ (learn) Japanese for two years. (ongoing)", "He ___ (work) all night — he looks exhausted. (visible result)", "How many pages ___ you ___ (read)? (completed quantity)"] },
    ],
    quiz: [
      { question: "'I've been cooking.' What does this sentence emphasize?", options: ["The number of dishes cooked", "The completed result", "The ongoing activity and/or its duration", "A general ability"], correct: 2, explanation: "Present Perfect Continuous emphasizes the activity as ongoing or recently completed, often with a visible result or duration in focus." },
    ],
  },

  {
    slug: "idioms-time",
    sections: [
      { heading: "Why idioms about time?", body: "Time is one of the most common conceptual domains in any language. English has an unusually rich set of idioms for time — many come from sailing, agriculture, and the rhythms of pre-industrial life." },
      { heading: "The most useful ones", body: "'In the nick of time' — just before it's too late. 'Once in a blue moon' — very rarely (blue moons are rare astronomical events). 'Against the clock' — rushing because of a deadline. 'Around the clock' — continuously, 24 hours. 'In no time (at all)' — very quickly." },
    ],
    examples: [
      { english: "We caught the last train in the nick of time.", translation: "justo a tiempo — por muy poco" },
      { english: "She calls her parents once in a blue moon.", translation: "muy raramente" },
      { english: "The team was working against the clock.", translation: "corriendo contra el tiempo" },
      { english: "The hospital is staffed around the clock.", translation: "las 24 horas" },
      { english: "Don't worry, I'll finish it in no time.", translation: "en un momento / muy rápido" },
    ],
    exercises: [
      { instruction: "Replace the underlined words with a time idiom.", items: ["She arrived just before the meeting started.", "He exercises very rarely.", "They finished the report very quickly.", "The servers run continuously."] },
    ],
    quiz: [
      { question: "'Once in a blue moon' means:", options: ["Every month", "Every night", "Very rarely", "At midnight"], correct: 2, explanation: "A blue moon is a rare astronomical event — the idiom means something happens very infrequently." },
    ],
  },

  // ─── ADVANCED ─────────────────────────────────────────────────────────────────

  {
    slug: "third-conditional",
    sections: [
      { heading: "Third conditional structure", body: "If + past perfect, would have + past participle. This structure describes imaginary situations in the past — things that didn't happen, and their hypothetical consequences. It's the tense of regret and retrospective speculation." },
      { heading: "Mixed conditionals", body: "Mixed conditionals combine time frames. Past → present: 'If I had studied medicine (past unreal), I would be a doctor now (present).' Present → past: 'If I were more careful (present unreal state), I wouldn't have made that mistake (past consequence).'"},
      { heading: "Contracted and reduced forms", body: "In natural speech, third conditionals are heavily contracted: 'If I'd known, I'd've told you' /aɪd noʊn, aɪdəv/. The double contraction 'I'd've' is extremely common in speech even if rarely written." },
    ],
    examples: [
      { english: "If she had studied, she would have passed.", note: "Past unreal — she didn't study" },
      { english: "If I hadn't slept, I'd be exhausted now.", note: "Mixed: past condition → present result" },
      { english: "If I were more organized, I wouldn't have lost that file.", note: "Mixed: present state → past consequence" },
      { english: "I'd've come if I'd known.", note: "Natural contracted speech form" },
    ],
    exercises: [
      { instruction: "Complete with third conditional or mixed conditional.", items: ["If she ___ (tell) me earlier, I ___ (help) her.", "If I ___ (be) braver, I ___ (ask) him out last year.", "He ___ (not / miss) the flight if he ___ (leave) on time."], answers: ["had told / would have helped", "were / would have asked", "would not have missed / had left"] },
    ],
    quiz: [
      { question: "'If I had taken that job, I would be living in Tokyo now.' This is:", options: ["First conditional", "Second conditional", "Third conditional", "A mixed conditional"], correct: 3, explanation: "Past condition (had taken) + present result (would be living) = mixed conditional." },
    ],
  },

  {
    slug: "inversion-emphasis",
    sections: [
      { heading: "What is inversion?", body: "Inversion places the auxiliary verb (or 'be') before the subject, creating emphasis and a formal or dramatic tone. It's triggered by negative or restrictive adverbials at the beginning of a sentence." },
      { heading: "Common inversion triggers", body: "Never, rarely, seldom, hardly, scarcely, barely, no sooner, not only, not until, on no account, in no way, under no circumstances, little (= not much), only + time expression." },
      { heading: "Structure", body: "Trigger + auxiliary + subject + main verb. 'Never have I seen such courage.' 'Not only did she win, but she also broke the record.' 'Rarely does he make a mistake.' Compare normal order: 'He rarely makes a mistake.'" },
    ],
    examples: [
      { english: "Never have I seen such dedication.", note: "Normal: I have never seen..." },
      { english: "Not only did she win, she broke a world record.", note: "Not only... but also" },
      { english: "Rarely does he lose his temper.", note: "Formal/literary tone" },
      { english: "Only after the meeting did I understand the plan.", note: "Only + time expression" },
      { english: "Under no circumstances should you share this.", note: "Imperative-like with inversion" },
    ],
    exercises: [
      { instruction: "Rewrite using inversion for emphasis.", items: ["I have never heard such nonsense.", "She not only apologized but also sent flowers.", "He had barely arrived when the trouble started.", "You should under no circumstances open that file."] },
    ],
    quiz: [
      { question: "Which sentence uses inversion correctly?", options: ["Never I have seen that.", "Never have I seen that.", "Never have seen I that.", "Never that I have seen."], correct: 1, explanation: "Inversion structure: negative trigger + auxiliary + subject + main verb: 'Never have I seen'." },
    ],
  },

  {
    slug: "register",
    sections: [
      { heading: "What is register?", body: "Register is the variety of language suited to a particular social situation. English has a wider range of register variation than most languages — from deeply informal slang to highly formal legal and academic prose. C1 speakers switch fluently between them." },
      { heading: "Markers of formal register", body: "Formal: longer words (often Latinate), passive voice, no contractions, impersonal constructions ('It is suggested that...'), complex sentence structure, hedging, precise vocabulary." },
      { heading: "Markers of informal register", body: "Informal: shorter words (often Germanic), active voice, contractions, direct address, phrasal verbs instead of single verbs, fillers, ellipsis, colloquialisms." },
    ],
    examples: [
      { english: "Can you help? → I was wondering if you'd be able to assist.", note: "Informal → Formal" },
      { english: "get in touch → contact", note: "Phrasal verb → single verb (more formal)" },
      { english: "So → Therefore / Consequently", note: "Informal connector → formal connector" },
      { english: "need → require", note: "Germanic → Latinate (more formal)" },
    ],
    exercises: [
      { instruction: "Rewrite each sentence in the register indicated.", items: ["I wanna ask you something. (formal)", "We request that you vacate the premises. (informal)", "She's been fired. (formal)", "We regret to inform you that your application was unsuccessful. (neutral)"] },
    ],
    quiz: [
      { question: "Which of these is a marker of formal register?", options: ["Contractions", "Phrasal verbs", "Passive voice", "Colloquialisms"], correct: 2, explanation: "Passive voice is associated with formal register because it creates distance, removes personal agency, and sounds more objective." },
    ],
  },

  {
    slug: "cleft-sentences",
    sections: [
      { heading: "What cleft sentences do", body: "Cleft sentences split a simple sentence into two clauses to throw emphasis onto one element. They answer the implied question: 'Which one? / What exactly? / Who specifically?' They're especially useful in writing and in speech when you need to correct a misunderstanding." },
      { heading: "It-clefts", body: "Structure: It + be + focused element + relative clause. 'Maria called.' → 'It was Maria who called.' (emphasizes Maria, not someone else). 'It's the design that needs changing, not the content.'" },
      { heading: "Wh-clefts (pseudo-clefts)", body: "Structure: What + clause + be + focused element. 'What I need is more time.' 'What surprised me was her reaction.' Often used to introduce or conclude a key point formally." },
    ],
    examples: [
      { english: "It was the manager who approved it.", note: "It-cleft: emphasizes the manager" },
      { english: "It's the deadline that worries me.", note: "It-cleft: clarifies what specifically" },
      { english: "What I want is a clear explanation.", note: "Wh-cleft: emphatic subject" },
      { english: "What she did was remarkable.", note: "Wh-cleft: emphasizes the action" },
    ],
    exercises: [
      { instruction: "Rewrite using a cleft sentence to emphasize the underlined element.", items: ["She appreciated the honesty.", "He failed because of poor planning.", "The noise woke me up.", "I need your full attention right now."] },
    ],
    quiz: [
      { question: "'What I enjoy most is the process.' This is a:", options: ["It-cleft", "Wh-cleft (pseudo-cleft)", "Non-defining relative clause", "Reported speech structure"], correct: 1, explanation: "Wh-clefts start with 'What + clause + be + focused element'. It-clefts start with 'It + be + focused element + relative clause'." },
    ],
  },

  {
    slug: "participle-clauses",
    sections: [
      { heading: "What they are", body: "Participle clauses replace a subordinate clause with a condensed form using a participle (-ing, past participle, or having + past participle). They're common in formal and academic writing because they're concise and elegant." },
      { heading: "Present participle (-ing)", body: "The -ing clause typically shows that two actions happen simultaneously or that the participle action explains the main action: 'Feeling tired, she went to bed.' 'Knowing the risks, he proceeded anyway.'" },
      { heading: "Past participle", body: "Past participle clauses are often passive in meaning: 'Written in 1851, Moby Dick was initially a commercial failure.' 'Disappointed by the results, the team requested a review.'" },
      { heading: "Perfect participle (having + pp)", body: "'Having finished the report, she sent it immediately.' The perfect participle emphasizes that the first action was completed before the second began." },
    ],
    examples: [
      { english: "Having studied all night, she felt confident.", note: "Perfect participle — before the main action" },
      { english: "Exhausted by the journey, they went straight to bed.", note: "Past participle — passive meaning" },
      { english: "Not knowing what to say, he remained silent.", note: "Negative present participle" },
      { english: "Built in 1920, the bridge still stands.", note: "Past participle — describes subject" },
    ],
    exercises: [
      { instruction: "Combine the sentences using a participle clause.", items: ["She had finished her work. She left the office.", "The report was written in English. It was difficult to translate.", "He didn't know the answer. He stayed quiet.", "After she had waited for an hour, she left."] },
    ],
    quiz: [
      { question: "'Having reviewed the data, the team presented their findings.' The participle clause tells us:", options: ["The team reviewed data at the same time as presenting", "The review was completed before the presentation", "The data reviewed itself", "The findings caused the review"], correct: 1, explanation: "Perfect participle (having + pp) signals that the participle action was completed before the main clause action." },
    ],
  },

  {
    slug: "raise-rise",
    sections: [
      { heading: "The core distinction", body: "'Raise' is a transitive verb — it always needs an object. Something or someone raises something else. 'Rise' is intransitive — it never takes an object. Things rise by themselves." },
      { heading: "Raise collocations", body: "Raise a question, raise awareness, raise funds, raise concerns, raise an objection, raise one's voice, raise the bar, raise a child, raise an army, raise prices (if someone is doing it deliberately)." },
      { heading: "Rise collocations", body: "Prices rise, temperatures rise, the sun rises, sea levels rise, crime rises, expectations rise, he rose to fame, she rose through the ranks, costs rise (if they go up naturally/without an agent)." },
    ],
    examples: [
      { english: "The government raised taxes.", note: "Raise + object (transitive)" },
      { english: "Taxes rose by 3%.", note: "Rise — no object (intransitive)" },
      { english: "She raised a valid point.", note: "Transitive — raise + object" },
      { english: "He rose to become CEO.", note: "Intransitive — no object" },
    ],
    exercises: [
      { instruction: "Raise or rise (in the correct form)?", items: ["The board ___ salaries last year.", "Temperatures ___ sharply in summer.", "She ___ her hand to ask a question.", "The company's profits ___ by 15%.", "They hope to ___ awareness about climate change."], answers: ["raised", "rise", "raised", "rose", "raise"] },
    ],
    quiz: [
      { question: "Which sentence is grammatically correct?", options: ["The sun raises every morning.", "They rose the flag.", "She raised her concerns at the meeting.", "Prices have raised dramatically."], correct: 2, explanation: "'Raise her concerns' — transitive with object. 'The sun rises', 'they raised the flag', 'prices have risen'." },
    ],
  },

  {
    slug: "pragmatics",
    sections: [
      { heading: "What is pragmatics?", body: "Pragmatics is the study of how context shapes meaning — what speakers imply, presuppose, and perform with language beyond its literal meaning. At advanced level, understanding pragmatics separates fluent speakers from truly proficient ones." },
      { heading: "Indirectness in English", body: "English speakers (particularly British English) rely heavily on indirectness to be polite, face-saving, or diplomatic. A direct refusal ('No, I won't do that') can seem rude. An indirect one ('I'm not sure I'll have time for that') conveys the same message more tactfully." },
      { heading: "Implicature", body: "Grice's maxims describe how we imply things beyond our words. 'Can you pass the salt?' is literally a yes/no question about ability — but pragmatically it's a request. 'The food was edible' implies it wasn't good (otherwise you'd say 'delicious')." },
    ],
    examples: [
      { english: "'It's a bit warm in here...'", note: "Implies: please open a window / turn on the AC" },
      { english: "'That's an interesting idea.'", note: "Often implies: I have reservations about this" },
      { english: "'I'm sure you did your best.'", note: "Can imply: the result wasn't great" },
      { english: "'We should catch up sometime.'", note: "May be a social formula, not a real plan" },
    ],
    exercises: [
      { instruction: "What does each utterance imply in context? Write a more direct version.", items: ["'I might be able to make it.' (to an invitation)", "'Your first draft shows real effort.' (on written work)", "'This neighborhood has changed a lot.' (said by a longtime resident)"] },
    ],
    quiz: [
      { question: "Someone says 'I don't disagree with you.' This most likely means:", options: ["Complete agreement", "Partial agreement or reluctant agreement", "Strong disagreement", "No opinion"], correct: 1, explanation: "Double negation ('don't disagree') implies reluctant or partial agreement — the speaker doesn't want to fully commit." },
    ],
  },

  {
    slug: "subjunctive",
    sections: [
      { heading: "What is the English subjunctive?", body: "The English subjunctive uses the base form of the verb (infinitive without 'to') regardless of subject and tense. It's most visible when it contrasts with a form you'd normally expect: 'It's vital that he attend' (not 'attends')." },
      { heading: "When it appears", body: "After verbs of demand/suggestion/recommendation + that: insist, suggest, recommend, demand, request, propose, ask, require, urge. After adjectives of importance or necessity + that: vital, essential, important, necessary, critical, imperative." },
      { heading: "Were-subjunctive", body: "In conditional sentences expressing hypothetical or contrary-to-fact situations, formal English uses 'were' for all persons: 'If I were you...', 'If she were here...', 'Were I in your position...'. This is the were-subjunctive, also called the past subjunctive." },
    ],
    examples: [
      { english: "I suggest that she be promoted.", note: "Not 'is' — base form after 'suggest'" },
      { english: "It is vital that he attend the meeting.", note: "Not 'attends'" },
      { english: "They demanded that the report be submitted immediately.", note: "Passive subjunctive" },
      { english: "If I were taller, I'd play basketball.", note: "Were-subjunctive in condition" },
    ],
    exercises: [
      { instruction: "Correct the verb form if necessary.", items: ["It's essential that every student submits the form.", "I recommend that he takes the earlier flight.", "If I was you, I'd reconsider.", "The committee insisted that she is present."], answers: ["submit", "take", "were", "be present"] },
    ],
    quiz: [
      { question: "Which sentence uses the subjunctive correctly?", options: ["She insisted that he leaves.", "She insisted that he leave.", "She insisted that he is leaving.", "She insisted that he left."], correct: 1, explanation: "After 'insist that', the subjunctive requires the base form: 'leave', not 'leaves'." },
    ],
  },

  {
    slug: "ellipsis",
    sections: [
      { heading: "Ellipsis — omitting what's recoverable", body: "Ellipsis removes words that can be understood from context, making speech and writing more fluent. It's extremely common in dialogue. The omitted words can always be mentally restored: 'Are you coming?' '[I'm] coming [right now].'" },
      { heading: "Substitution — replacing with a shorter form", body: "Substitution replaces a word or phrase with a pro-form (one, so, do so, not, such). 'Would you like a coffee?' 'I'd love one.' [one = a coffee]. 'Will she come?' 'I think so.' [so = she will come]." },
      { heading: "So and not as substitutes", body: "'I think so / I hope so / I'm afraid so' use 'so' to substitute a whole proposition. 'I think not / I hope not / I'm afraid not' use 'not' for the negative. These are fixed, natural patterns." },
    ],
    examples: [
      { english: "'Can you drive?' 'I might [be able to].'", note: "Ellipsis: omit recoverable words" },
      { english: "'I want a biscuit.' 'Take one.'", note: "Substitution: one = a biscuit" },
      { english: "'Is she coming?' 'I think so.'", note: "so = she is coming" },
      { english: "'Was it difficult?' 'Very [difficult].'", note: "Ellipsis after degree adverb" },
    ],
    exercises: [
      { instruction: "Identify: ellipsis (E) or substitution (S)?", items: ["'Do you like jazz?' 'I do.'", "'Is it going to rain?' 'I hope not.'", "'Are you ready?' 'Almost [ready].'", "'I need a pen.' 'Here's one.'"] },
    ],
    quiz: [
      { question: "'Will they agree?' 'I think so.' What does 'so' replace?", options: ["'they'", "'will agree'", "the whole proposition 'they will agree'", "'I think'"], correct: 2, explanation: "'So' substitutes the entire proposition — it means 'I think [that they will agree]'." },
    ],
  },

  {
    slug: "advanced-idioms",
    sections: [
      { heading: "What makes an idiom 'advanced'?", body: "Advanced idioms are less frequent than basics, more metaphorically opaque (harder to guess from the parts), and more contextually restricted. They tend to appear in journalism, literature, and professional conversation — not everyday small talk." },
      { heading: "Risk and decision idioms", body: "'Bite the bullet' — endure something painful or difficult. 'Throw caution to the wind' — take a risk by ignoring warnings. 'Hedge your bets' — cover multiple possibilities to reduce risk. 'Be on the fence' — be undecided." },
      { heading: "Communication and truth idioms", body: "'Beat around the bush' — avoid getting to the point. 'Call a spade a spade' — say things directly without softening. 'Read between the lines' — perceive hidden meaning. 'Take something with a grain of salt' — be skeptical." },
    ],
    examples: [
      { english: "She bit the bullet and had the surgery.", translation: "aguantó / se armó de valor" },
      { english: "He threw caution to the wind and quit his job.", translation: "se arriesgó sin precaución" },
      { english: "I'm still on the fence about the proposal.", translation: "indeciso/a" },
      { english: "Stop beating around the bush — just say it.", translation: "andarse con rodeos" },
    ],
    exercises: [
      { instruction: "Match the idiom to its use in context.", items: ["The consultant recommended hedging our bets.", "The article was biased — take it with a grain of salt.", "She read between the lines and realized he was unhappy.", "Let's call a spade a spade: the project failed."] },
    ],
    quiz: [
      { question: "'Take something with a grain of salt' means:", options: ["Accept something completely", "Add salt to food", "Be skeptical or not take something too seriously", "Offer something generously"], correct: 2, explanation: "To take something with a grain of salt means to be skeptical — to not accept it as fully true or reliable." },
    ],
  },

  {
    slug: "academic-cohesion",
    sections: [
      { heading: "Cohesion vs. coherence", body: "Coherence is about ideas making logical sense together. Cohesion is the linguistic glue — the specific words and structures that link sentences and paragraphs. You can have coherent ideas with poor cohesion (choppy, disconnected sentences), or good cohesion with incoherent ideas (linked but pointless)." },
      { heading: "Lexical cohesion", body: "Lexical chains use related words across a text to maintain topic unity: 'climate → temperature → warming → heat → emissions'. Synonyms and near-synonyms reduce repetition while maintaining connection. Collocation patterns reinforce domain." },
      { heading: "Grammatical cohesion", body: "Reference: using pronouns and determiners to point back to earlier nouns ('this finding', 'such data', 'the aforementioned'). Conjunction: using connectors to show logical relationships. Substitution and ellipsis (as covered separately)." },
    ],
    examples: [
      { english: "water → liquid → fluid → H₂O → hydration", note: "Lexical chain — keeps topic unified" },
      { english: "'This approach... Such methods... These findings...'", note: "Anaphoric reference — points back" },
      { english: "'The results were significant. Moreover, they were reproducible.'", note: "Additive conjunction" },
    ],
    exercises: [
      { instruction: "Identify the cohesive device in each pair.", items: ["'She submitted the report. It was well-received.'", "'The experiment failed. Nevertheless, the team persisted.'", "'Water levels rose. Sea temperatures also increased.'"] },
    ],
    quiz: [
      { question: "'This suggests that...' — what cohesive device is 'this'?", options: ["Conjunction", "Lexical repetition", "Anaphoric reference", "Substitution"], correct: 2, explanation: "'This' is a demonstrative pronoun that points back (anaphorically) to previously mentioned content." },
    ],
  },

  {
    slug: "phonemic-pairs",
    sections: [
      { heading: "Beyond basics", body: "At advanced level, the phonemic challenge shifts from obvious errors (like TH sounds) to subtle distinctions that even intermediate learners collapse: vowel pairs in specific phonological environments, distinctions that vary by dialect, and perception vs. production gaps." },
      { heading: "The cot/caught merger", body: "In many American English dialects, /ɒ/ (cot) and /ɔː/ (caught) have merged — speakers say them identically. In other dialects (British, some American), they remain distinct. Knowing this variation helps you understand different speakers." },
      { heading: "Perception first", body: "Research shows that you can't reliably produce a distinction you can't reliably perceive. Ear training — deliberately listening for minimal pairs and categorizing them — must come before production training. Apps like Sounds Right or minimal pair exercises are effective." },
    ],
    examples: [
      { english: "collar / caller", ipa: "/ˈkɒl.ər/ · /ˈkɔː.lər/", note: "Distinct in British English" },
      { english: "cot / caught", ipa: "/kɒt/ · /kɔːt/", note: "Merged in much of American English" },
      { english: "pin / pen", ipa: "/pɪn/ · /pɛn/", note: "Merged in Southern American English" },
    ],
    exercises: [
      { instruction: "For each pair, note: are they distinct in your target accent (British RP / General American)?", items: ["horse / hoarse", "marry / merry / Mary", "which / witch", "cot / caught"] },
    ],
    quiz: [
      { question: "Why is dialect awareness important for advanced pronunciation?", options: ["To eliminate all accents", "To understand that distinctions vary by accent — what's a minimal pair in one dialect may not be in another", "To sound like a native speaker from one specific region", "To avoid regional vocabulary"], correct: 1, explanation: "Sound distinctions are dialect-relative. Advanced learners need to understand variation, not just a single 'correct' system." },
    ],
  },

  {
    slug: "discourse-analysis",
    sections: [
      { heading: "The challenge of complex spoken discourse", body: "At advanced level, listening difficulty is rarely about individual words — it's about tracking the macro-structure: what is the speaker's main point, how are they building their argument, where are the pivots, what is implied vs. stated?" },
      { heading: "Signpost language", body: "Speakers signal their discourse structure explicitly. 'On the one hand... on the other' = contrast coming. 'What I'm really trying to say is...' = simplification/summary. 'Having said that...' = qualification. 'Let me step back...' = perspective shift. These are the structural 'headers' of spoken argument." },
      { heading: "Active listening strategies", body: "Top-down processing: use your knowledge of the topic to predict what's coming. Bottom-up: focus on key stressed words and discourse markers. Selective attention: don't try to catch every word — identify the main point and the structure." },
    ],
    examples: [
      { english: "'What I'm really trying to say is...'", note: "Signal: rephrasing/clarification of the core point" },
      { english: "'That said...' / 'Having said that...'", note: "Signal: a qualification is coming" },
      { english: "'To put it another way...'", note: "Signal: a reformulation for clarity" },
      { english: "'The bottom line is...'", note: "Signal: conclusion / most important point" },
    ],
    exercises: [
      { instruction: "What discourse function does each phrase signal?", items: ["'Let me give you an example...'", "'To return to my earlier point...'", "'This brings me to my main argument...'", "'In other words...'"] },
    ],
    quiz: [
      { question: "When a speaker says 'The bottom line is...', what are they signaling?", options: ["A financial topic", "An introductory remark", "The most important conclusion or key point", "A transition to a new topic"], correct: 2, explanation: "'The bottom line is' signals the speaker is about to state the most essential point — their core conclusion." },
    ],
  },

  {
    slug: "style-voice",
    sections: [
      { heading: "What is voice?", body: "Voice is the consistent set of stylistic choices that makes writing recognizably yours: sentence rhythm, the vocabulary you gravitate toward, the way you structure arguments, your relationship with the reader. It's distinct from grammar — you can be grammatically flawless and still have no voice." },
      { heading: "Rhythm and sentence length", body: "Sentence length creates rhythm. Short sentences have impact. They stop the reader. Longer sentences, by contrast, can carry the reader across ideas with a more flowing, deliberate pace, subordinating detail and expanding the space a thought occupies. Varying length is more powerful than either alone." },
      { heading: "Diction — choosing words", body: "Every word choice is a voice decision. 'He walked quickly' vs. 'he strode' vs. 'he rushed'. Precision in verbs creates a more vivid and specific voice. Avoiding nominalization ('make a decision' → 'decide') creates energy. Preferring Anglo-Saxon words over Latinate ones often creates warmth." },
      { heading: "Developing your voice in a second language", body: "Voice in L2 takes longer to develop than accuracy because it requires confidence — the willingness to be deliberately stylistic, not just correct. Read English writers you admire. Notice what they do. Imitate them consciously. Then break away." },
    ],
    examples: [
      { english: "Short sentences create urgency.", note: "Impact through brevity" },
      { english: "Longer sentences, by contrast, allow ideas to unfold at a more deliberate pace.", note: "Elaboration through extension" },
      { english: "'decide' > 'make a decision'", note: "Prefer verbs over nominalized phrases" },
      { english: "'strode' vs. 'walked quickly'", note: "Precise verbs vs. verb + adverb" },
    ],
    exercises: [
      { instruction: "Revise each sentence to make it more vivid or energetic.", items: ["She made the decision to leave the company.", "He walked in a slow and careful manner.", "There was a feeling of excitement among the team.", "The report was written by the committee."] },
    ],
    quiz: [
      { question: "What distinguishes 'voice' from 'grammar'?", options: ["Voice is only about vocabulary; grammar is about structure", "Voice refers to passive/active constructions only", "Voice is the consistent stylistic identity of a writer — it's about choices, not correctness", "Voice is less important than grammar for advanced writers"], correct: 2, explanation: "Voice is the sum of deliberate stylistic choices that make writing recognizably belong to one writer. Grammar is a prerequisite — but voice is what makes writing memorable." },
    ],
  },
];

// ─── Helper: get full content by slug ────────────────────────────────────────
export function getLessonContent(slug: string): LessonContent | undefined {
  return lessonContent.find((l) => l.slug === slug);
}