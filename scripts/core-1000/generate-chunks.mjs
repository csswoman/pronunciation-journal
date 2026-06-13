/**
 * One-shot generator for public/core-1000/words-*.json
 * Run: node scripts/core-1000/generate-chunks.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = path.join(__dirname, "../..");

const ARPABET_TO_IPA = {
  AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", EH: "ɛ", ER: "ɜr",
  EY: "eɪ", IH: "ɪ", IY: "iː", OW: "oʊ", OY: "ɔɪ", UH: "ʊ", UW: "uː",
  B: "b", CH: "tʃ", D: "d", DH: "ð", F: "f", G: "ɡ", HH: "h", JH: "dʒ",
  K: "k", L: "l", M: "m", N: "n", NG: "ŋ", P: "p", R: "ɹ", S: "s", SH: "ʃ",
  T: "t", TH: "θ", V: "v", W: "w", Y: "j", Z: "z", ZH: "ʒ",
};

const mod = require("cmu-pronouncing-dictionary");
const dict = mod.dictionary ?? mod.default ?? mod;

function stripStress(p) {
  return p.replace(/\d$/, "");
}

function lookupIpa(word) {
  const key = word.toLowerCase().replace(/[^a-z0-9']/g, "");
  if (!key) return null;
  const entry =
    dict[key] ??
    dict[key.replace(/-/g, "")] ??
    (key.endsWith("s") && key.length > 3 ? dict[key.slice(0, -1)] : undefined);
  if (!entry) return null;
  const ipa = entry
    .split(" ")
    .map((p) => ARPABET_TO_IPA[stripStress(p)] ?? stripStress(p).toLowerCase())
    .join("");
  return `/${ipa}/`;
}

function sentenceIpa(sentence, targetWord, weakIpa) {
  const tokens = sentence.match(/\b[\w']+\b/g) ?? [];
  const parts = tokens.map((tok) => {
    if (tok.toLowerCase() === targetWord.toLowerCase() && weakIpa) {
      return weakIpa.replace(/^\/|\/$/g, "");
    }
    const ipa = lookupIpa(tok);
    return ipa ? ipa.replace(/^\/|\/$/g, "") : tok.toLowerCase();
  });
  return `/${parts.join(" ")}/`;
}

/** Weak-form entries: sentence puts the word in unstressed position. */
const WEAK = {
  a: { ipa_weak: "/ə/", example: "I need a pen now." },
  an: { ipa_weak: "/ən/", example: "She is an old friend." },
  the: { ipa_weak: "/ðə/", example: "Give me the book please." },
  and: { ipa_weak: "/ənd/", example: "Bread and butter here." },
  but: { ipa_weak: "/bət/", example: "Small but very nice." },
  or: { ipa_weak: "/ɚ/", example: "Tea or coffee today?" },
  as: { ipa_weak: "/əz/", example: "Do as I say please." },
  than: { ipa_weak: "/ðən/", example: "Better than before now." },
  that: { ipa_weak: "/ðət/", example: "I hope that it works." },
  at: { ipa_weak: "/ət/", example: "Look at the map now." },
  for: { ipa_weak: "/fər/", example: "This gift is for you." },
  from: { ipa_weak: "/frəm/", example: "It came from home today." },
  of: { ipa_weak: "/əv/", example: "A cup of tea please." },
  to: { ipa_weak: "/tə/", example: "I want to go home." },
  into: { ipa_weak: "/ˈɪntə/", example: "Go into the room now." },
  he: { ipa_weak: "/i/", example: "Did he say yes today?" },
  him: { ipa_weak: "/ɪm/", example: "I saw him at school." },
  her: { ipa_weak: "/ɚ/", example: "Give her the book now." },
  she: { ipa_weak: "/ʃi/", example: "Did she call you today?" },
  we: { ipa_weak: "/wi/", example: "We can go home now." },
  us: { ipa_weak: "/əs/", example: "Come with us today please." },
  you: { ipa_weak: "/jə/", example: "Did you see that today?" },
  them: { ipa_weak: "/ðəm/", example: "Tell them to wait please." },
  there: { ipa_weak: "/ðɚ/", example: "There is a cat outside." },
  have: { ipa_weak: "/həv/", example: "I have a dog at home." },
  has: { ipa_weak: "/həz/", example: "She has a new book." },
  had: { ipa_weak: "/həd/", example: "They had a good day." },
  do: { ipa_weak: "/du/", example: "What do you want today?" },
  does: { ipa_weak: "/dəz/", example: "Does she know the way?" },
  can: { ipa_weak: "/kən/", example: "I can help you today." },
  could: { ipa_weak: "/kəd/", example: "Could you help me please?" },
  will: { ipa_weak: "/əl/", example: "I will call you later." },
  would: { ipa_weak: "/əd/", example: "Would you like some tea?" },
  should: { ipa_weak: "/ʃəd/", example: "You should rest today please." },
  must: { ipa_weak: "/məst/", example: "You must try again today." },
  some: { ipa_weak: "/səm/", example: "I need some help today." },
  your: { ipa_weak: "/jər/", example: "Is this your book today?" },
  his: { ipa_weak: "/ɪz/", example: "This is his new car." },
  is: { ipa_weak: "/z/", example: "She is at home today." },
  are: { ipa_weak: "/ɚ/", example: "They are at home now." },
  was: { ipa_weak: "/wəz/", example: "She was at home today." },
  were: { ipa_weak: "/wɚ/", example: "We were at home then." },
};

const VERBS = new Set([
  "be", "have", "do", "say", "get", "make", "go", "know", "take", "see", "come", "think",
  "look", "want", "give", "use", "find", "tell", "ask", "work", "seem", "feel", "try", "leave",
  "call", "need", "become", "put", "mean", "keep", "let", "begin", "help", "talk", "turn",
  "start", "show", "hear", "play", "run", "move", "like", "live", "believe", "hold", "bring",
  "happen", "write", "provide", "sit", "stand", "lose", "pay", "meet", "include", "continue",
  "set", "learn", "change", "lead", "understand", "watch", "follow", "stop", "create", "speak",
  "read", "allow", "add", "spend", "grow", "open", "walk", "win", "offer", "remember", "love",
  "consider", "appear", "buy", "wait", "serve", "send", "expect", "build", "stay", "fall",
  "cut", "reach", "remain", "suggest", "raise", "pass", "require", "report", "decide", "pull",
  "return", "explain", "develop", "carry", "break", "receive", "agree", "support", "hit",
  "produce", "eat", "cover", "catch", "draw", "choose", "die", "expect", "fight", "save",
  "end", "kill", "occur", "drive", "deal", "determine", "listen", "plan", "pick", "worry",
  "forget", "enter", "mention", "finish", "involve", "land", "study", "sign", "wonder",
  "accept", "act", "add", "admire", "admit", "affect", "afford", "answer", "apply", "argue",
  "arrive", "attack", "avoid", "base", "beat", "become", "behave", "belong", "blame", "borrow",
  "burn", "care", "cause", "check", "claim", "clean", "close", "collect", "compare", "complain",
  "complete", "concern", "confirm", "connect", "consist", "contain", "contribute", "control",
  "cook", "copy", "correct", "cost", "count", "cross", "cry", "damage", "dance", "deliver",
  "demand", "deny", "depend", "describe", "design", "destroy", "discover", "discuss", "divide",
  "drop", "earn", "edit", "educate", "employ", "enable", "encourage", "enjoy", "ensure",
  "escape", "establish", "examine", "exist", "expand", "experience", "express", "extend",
  "face", "fail", "feature", "fill", "fit", "fix", "fly", "focus", "force", "form", "gain",
  "gather", "generate", "handle", "hang", "hide", "hire", "hope", "identify", "ignore",
  "imagine", "improve", "increase", "indicate", "inform", "insist", "install", "intend",
  "introduce", "invest", "join", "jump", "justify", "knock", "lack", "last", "laugh", "lay",
  "lie", "lift", "like", "limit", "link", "list", "locate", "lock", "look", "maintain",
  "manage", "mark", "marry", "match", "matter", "measure", "mind", "miss", "mix", "model",
  "name", "note", "notice", "obtain", "occur", "operate", "order", "organize", "own",
  "perform", "permit", "place", "point", "prefer", "prepare", "present", "press", "prevent",
  "print", "process", "promise", "promote", "protect", "prove", "publish", "purchase",
  "push", "question", "quit", "quote", "rain", "raise", "range", "rate", "react", "realize",
  "recall", "receive", "recognize", "record", "reduce", "refer", "reflect", "refuse",
  "regard", "relate", "release", "rely", "remove", "repair", "repeat", "replace", "reply",
  "represent", "request", "research", "resolve", "respond", "rest", "result", "retain",
  "reveal", "review", "ride", "ring", "rise", "risk", "roll", "rule", "rush", "satisfy",
  "save", "schedule", "score", "search", "secure", "seek", "select", "sell", "separate",
  "settle", "shake", "shape", "share", "shift", "shoot", "shout", "shut", "sing", "sleep",
  "smile", "sort", "sound", "split", "spread", "spring", "state", "step", "stick", "strike",
  "struggle", "study", "succeed", "suffer", "supply", "suppose", "survive", "switch", "take",
  "talk", "taste", "teach", "test", "thank", "throw", "tie", "touch", "train", "transfer",
  "translate", "travel", "treat", "trust", "try", "turn", "understand", "unite", "value",
  "vary", "visit", "vote", "wake", "walk", "want", "warn", "wash", "watch", "wear", "weigh",
  "welcome", "wish", "wonder", "work", "worry", "wrap", "write",
]);

const ADJECTIVES = new Set([
  "good", "new", "first", "last", "long", "great", "little", "own", "other", "old", "right",
  "big", "high", "different", "small", "large", "next", "early", "young", "important", "few",
  "public", "bad", "same", "able", "local", "sure", "free", "full", "special", "easy", "clear",
  "recent", "strong", "possible", "whole", "real", "best", "better", "true", "simple", "hard",
  "major", "ready", "common", "main", "serious", "happy", "similar", "human", "social",
  "personal", "political", "national", "international", "general", "particular", "available",
  "likely", "certain", "various", "necessary", "single", "short", "wide", "deep", "dark",
  "light", "poor", "rich", "low", "close", "open", "late", "wrong", "white", "black", "red",
  "blue", "green", "hot", "cold", "fast", "slow", "safe", "dangerous", "beautiful", "nice",
  "fine", "popular", "famous", "basic", "final", "original", "modern", "traditional",
  "significant", "successful", "effective", "appropriate", "additional", "previous", "current",
  "future", "present", "medical", "legal", "financial", "commercial", "industrial",
  "environmental", "educational", "professional", "technical", "cultural", "natural",
  "physical", "mental", "emotional", "positive", "negative", "direct", "indirect", "active",
  "passive", "central", "northern", "southern", "eastern", "western", "global", "regional",
  "urban", "rural", "domestic", "foreign", "internal", "external", "equal", "similar",
  "different", "familiar", "strange", "normal", "unusual", "typical", "specific", "general",
  "complex", "complete", "empty", "full", "heavy", "light", "thick", "thin", "soft", "hard",
  "smooth", "rough", "clean", "dirty", "dry", "wet", "warm", "cool", "fresh", "old", "new",
  "ancient", "young", "dead", "alive", "sick", "healthy", "weak", "strong", "tall", "short",
  "fat", "thin", "wide", "narrow", "deep", "shallow", "steep", "flat", "round", "square",
  "straight", "curved", "sharp", "blunt", "loud", "quiet", "bright", "dark", "clear", "cloudy",
  "sunny", "rainy", "windy", "snowy", "foggy", "humid", "dry", "warm", "cool", "hot", "cold",
  "favorite", "traditional", "sudden", "traditional", "welcome",
]);

const ADVERBS = new Set([
  "not", "also", "very", "just", "only", "even", "still", "already", "always", "never",
  "often", "sometimes", "usually", "really", "quite", "rather", "almost", "enough", "perhaps",
  "maybe", "probably", "certainly", "finally", "suddenly", "quickly", "slowly", "carefully",
  "clearly", "directly", "simply", "mainly", "mostly", "partly", "largely", "highly", "deeply",
  "strongly", "widely", "closely", "early", "late", "soon", "now", "then", "here", "there",
  "today", "yesterday", "tomorrow", "again", "once", "twice", "well", "hard", "fast", "far",
  "near", "away", "back", "forward", "up", "down", "in", "out", "on", "off", "over", "under",
  "together", "apart", "alone", "elsewhere", "everywhere", "anywhere", "nowhere", "somewhere",
]);

const PRONOUNS = new Set([
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your",
  "his", "its", "our", "their", "mine", "yours", "hers", "ours", "theirs", "myself", "yourself",
  "himself", "herself", "itself", "ourselves", "themselves", "who", "whom", "whose", "which",
  "what", "this", "that", "these", "those", "someone", "anyone", "everyone", "nobody", "something",
  "anything", "everything", "nothing",
]);

const PREPOSITIONS = new Set([
  "in", "on", "at", "to", "for", "of", "with", "by", "from", "about", "into", "through",
  "during", "before", "after", "above", "below", "between", "under", "over", "against",
  "among", "within", "without", "upon", "per", "via", "until", "since", "despite", "except",
  "beyond", "across", "along", "around", "behind", "beside", "near", "off", "out", "up", "down",
]);

const CONJUNCTIONS = new Set([
  "and", "but", "or", "nor", "so", "yet", "for", "because", "although", "though", "while",
  "when", "where", "if", "unless", "until", "since", "as", "than", "that", "whether", "once",
]);

const DETERMINERS = new Set(["a", "an", "the", "some", "any", "each", "every", "all", "both", "half"]);

const MODALS = new Set(["can", "could", "may", "might", "shall", "should", "will", "would", "must"]);

const AUXILIARIES = new Set(["be", "am", "is", "are", "was", "were", "been", "being", "have", "has", "had", "do", "does", "did"]);

const ARTICLES = new Set(["a", "an", "the"]);

const NUMBERS = new Set([
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven",
  "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
  "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety", "hundred",
  "thousand", "million", "first", "second", "third",
]);

const INTERJECTIONS = new Set(["oh", "yes", "no", "well", "please", "thanks", "hello", "hi", "bye"]);

function classifyPos(word) {
  const w = word.toLowerCase();
  if (ARTICLES.has(w)) return "article";
  if (MODALS.has(w)) return "modal";
  if (AUXILIARIES.has(w)) return "auxiliary";
  if (DETERMINERS.has(w)) return "determiner";
  if (CONJUNCTIONS.has(w)) return "conjunction";
  if (PREPOSITIONS.has(w)) return "preposition";
  if (PRONOUNS.has(w)) return "pronoun";
  if (ADVERBS.has(w)) return "adverb";
  if (ADJECTIVES.has(w)) return "adjective";
  if (VERBS.has(w)) return "verb";
  if (NUMBERS.has(w)) return "number";
  if (INTERJECTIONS.has(w)) return "interjection";
  return "noun";
}

function cefrForRank(rank) {
  if (rank <= 100) return "A1";
  if (rank <= 350) return "A2";
  if (rank <= 650) return "B1";
  if (rank <= 850) return "B2";
  return "C1";
}

function exampleSentence(word, pos) {
  const w = word.toLowerCase();
  if (WEAK[w]) return WEAK[w].example;

  switch (pos) {
    case "verb":
      if (w === "be") return "I want to be happy.";
      return `I ${w} every day here.`;
    case "noun":
      return `The ${w} is very good.`;
    case "adjective":
      return `It is very ${w} today.`;
    case "adverb":
      return `She spoke ${w} to me.`;
    case "preposition":
      return `It is ${w} the box now.`;
    case "pronoun":
      return `I saw ${w} at school.`;
    case "determiner":
    case "article":
      return `I need ${w} new book.`;
    case "conjunction":
      return `Come ${w} go with us.`;
    case "modal":
      return `You ${w} try again today.`;
    case "auxiliary":
      if (w === "have") return "I have a dog at home.";
      if (w === "do") return "What do you want today?";
      return `They ${w} finished the work.`;
    case "number":
      return `I have ${w} books here.`;
    case "interjection":
      return `${w.charAt(0).toUpperCase() + w.slice(1)}, that sounds good.`;
    default:
      return `The ${w} is here today.`;
  }
}

function readCsv(filePath) {
  const csv = fs.readFileSync(filePath, "utf-8");
  const rows = [];
  for (const line of csv.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || line.startsWith("rank,")) continue;
    const [rankStr, word] = line.split(",");
    if (!rankStr || !word) continue;
    rows.push({ rank: Number(rankStr), word: word.trim().toLowerCase() });
  }
  return rows;
}

function buildEntry({ rank, word }) {
  const ipa_strong = lookupIpa(word);
  if (!ipa_strong) {
    console.warn(`  [WARN] No CMU IPA for rank ${rank}: "${word}" — skipping`);
    return null;
  }

  const pos = classifyPos(word);
  const cefr_level = cefrForRank(rank);
  const weak = WEAK[word];

  const entry = {
    rank,
    word,
    pos,
    ipa_strong,
    example_sentence: exampleSentence(word, pos),
    cefr_level,
  };

  if (weak) {
    entry.ipa_weak = weak.ipa_weak;
    entry.sentence_ipa = sentenceIpa(entry.example_sentence, word, weak.ipa_weak);
  }

  return entry;
}

function generateChunks(words, startChunk, endChunk, outDir) {
  for (let chunk = startChunk; chunk <= endChunk; chunk++) {
    const rankStart = (chunk - 1) * 100 + 1;
    const rankEnd = chunk * 100;
    const slice = words.filter((w) => w.rank >= rankStart && w.rank <= rankEnd);

    if (slice.length === 0) {
      console.log(`Chunk ${chunk}: no words in rank ${rankStart}–${rankEnd}, skipping`);
      continue;
    }

    const entries = slice.map(buildEntry).filter(Boolean);

    if (entries.length !== 100) {
      console.warn(`  [WARN] Chunk ${chunk}: expected 100 entries, got ${entries.length}`);
    }

    const file = path.join(outDir, `words-${String(chunk).padStart(3, "0")}.json`);
    fs.writeFileSync(file, JSON.stringify({ version: 1, entries }, null, 2) + "\n");
    console.log(`Wrote ${file} (${entries.length} entries)`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const startChunk = args[0] ? Number(args[0]) : 1;
  const endChunk = args[1] ? Number(args[1]) : 10;

  const outDir = path.join(ROOT, "public/core-1000");
  fs.mkdirSync(outDir, { recursive: true });

  // Load the right CSV based on range
  const words1k = readCsv(path.join(__dirname, "data/ngsl-1000.csv"));
  const words2800 = readCsv(path.join(__dirname, "data/ngsl-2800.csv"));
  const allWords = [...words1k, ...words2800].reduce((acc, w) => {
    if (!acc.find((x) => x.rank === w.rank)) acc.push(w);
    return acc;
  }, []);

  console.log(`Generating chunks ${startChunk}–${endChunk} (${(endChunk - startChunk + 1) * 100} words)...`);
  generateChunks(allWords, startChunk, endChunk, outDir);
  console.log("Done.");
}

main();
