/**
 * Generates grammar deck JSON for new A1/A2/B1/B2 pattern gaps.
 * Run: pnpm exec tsx scripts/generate-grammar-pattern-decks.ts
 */
import fs from "fs";
import path from "path";
import { NEW_PATTERN_DECK_SLUGS } from "../lib/courses/grammar-patterns";
import { B1_B2_DECK_SPECS } from "./grammar-pattern-deck-specs-b1-b2";
import { C1_C2_DECK_SPECS } from "./grammar-pattern-deck-specs-c1-c2";

type DeckSpec = {
  slug: string;
  eyebrow: string;
  title: string;
  emphasis?: string;
  goal: string;
  conceptRows: Array<{ key: string; value: string; highlights?: string[] }>;
  mistake: { bad: string; good: string; note: string };
  quiz: Array<{ q: string; options: string[]; answer: number; explain: string }>;
};

const A1_A2_SPECS: DeckSpec[] = [
  {
    slug: "a1-pronombres-sujeto",
    eyebrow: "A1 · Pronombres",
    title: "Pronombres",
    emphasis: "sujeto",
    goal: "Ya puedes usar I, you, he, she, it, we y they como sujeto de una oración.",
    conceptRows: [
      { key: "I", value: "yo · I am a student.", highlights: ["I"] },
      { key: "you", value: "tú / usted · You are here.", highlights: ["You"] },
      { key: "he / she / it", value: "él / ella / eso · She works.", highlights: ["She"] },
      { key: "we / they", value: "nosotros / ellos · They live here.", highlights: ["They"] },
    ],
    mistake: { bad: "Me am tired.", good: "I am tired.", note: "el sujeto es I, no me" },
    quiz: [
      { q: "___ is my brother.", options: ["He", "Him"], answer: 0, explain: "Antes del verbo va el pronombre sujeto he." },
    ],
  },
  {
    slug: "a1-demostrativos",
    eyebrow: "A1 · Demostrativos",
    title: "Demostrativos",
    emphasis: "this, that, these, those",
    goal: "Ya puedes señalar cosas cerca o lejos con this/that/these/those.",
    conceptRows: [
      { key: "this", value: "singular cerca · this book", highlights: ["this"] },
      { key: "that", value: "singular lejos · that car", highlights: ["that"] },
      { key: "these", value: "plural cerca · these shoes", highlights: ["these"] },
      { key: "those", value: "plural lejos · those houses", highlights: ["those"] },
    ],
    mistake: { bad: "This books are new.", good: "These books are new.", note: "books es plural → these" },
    quiz: [
      { q: "Look at ___ flowers over there.", options: ["those", "that"], answer: 0, explain: "flowers es plural y están lejos → those." },
    ],
  },
  {
    slug: "a1-genitivo-sajon",
    eyebrow: "A1 · Posesión",
    title: "Genitivo sajón",
    emphasis: "'s",
    goal: "Ya puedes expresar posesión con 's: Maria's phone, my brother's car.",
    conceptRows: [
      { key: "persona + 's", value: "Maria's phone · my brother's car", highlights: ["'s"] },
      { key: "plural en -s", value: "the students' books (solo apóstrofo)", highlights: ["students'"] },
      { key: "cosas / lugares", value: "today's news · the city's park", highlights: ["today's"] },
    ],
    mistake: { bad: "The book of Maria.", good: "Maria's book.", note: "en inglés cotidiano preferimos 's" },
    quiz: [
      { q: "This is ___ laptop.", options: ["Anna's", "Anna"], answer: 0, explain: "Posesión → Anna's." },
    ],
  },
  {
    slug: "a1-palabras-interrogativas",
    eyebrow: "A1 · Preguntas",
    title: "Palabras",
    emphasis: "interrogativas",
    goal: "Ya puedes preguntar con what, who, where, when, why y how.",
    conceptRows: [
      { key: "What", value: "¿Qué? · What is this?", highlights: ["What"] },
      { key: "Who", value: "¿Quién? · Who is she?", highlights: ["Who"] },
      { key: "Where", value: "¿Dónde? · Where do you live?", highlights: ["Where"] },
      { key: "When / Why / How", value: "¿Cuándo? / ¿Por qué? / ¿Cómo?", highlights: ["When", "Why", "How"] },
    ],
    mistake: { bad: "Where you live?", good: "Where do you live?", note: "pregunta con do/does + sujeto + verbo base" },
    quiz: [
      { q: "___ is your name?", options: ["What", "Where"], answer: 0, explain: "Pides información → What." },
    ],
  },
  {
    slug: "a1-cuanto-cuantos",
    eyebrow: "A1 · Cantidad",
    title: "¿Cuánto?",
    emphasis: "how much / how many",
    goal: "Ya distingues How much (incontable) y How many (contable).",
    conceptRows: [
      { key: "How many", value: "+ plural contable · How many apples?", highlights: ["How many"] },
      { key: "How much", value: "+ incontable · How much water?", highlights: ["How much"] },
      { key: "Respuesta corta", value: "Two. / A lot. / Not much.", highlights: ["Two"] },
    ],
    mistake: { bad: "How much books?", good: "How many books?", note: "books es contable → many" },
    quiz: [
      { q: "___ money do you have?", options: ["How much", "How many"], answer: 0, explain: "money es incontable." },
    ],
  },
  {
    slug: "a1-presente-continuo",
    eyebrow: "A1 · Presente",
    title: "Presente",
    emphasis: "continuo",
    goal: "Ya puedes describir acciones que pasan ahora con am/is/are + -ing.",
    conceptRows: [
      { key: "Forma", value: "I am working · She is reading · They are waiting", highlights: ["am", "is", "are"] },
      { key: "Ahora", value: "now, right now, at the moment", highlights: ["now"] },
      { key: "Negativo", value: "I'm not working · She isn't reading", highlights: ["n't"] },
    ],
    mistake: { bad: "I working now.", good: "I am working now.", note: "falta el verbo to be" },
    quiz: [
      { q: "She ___ TV now.", options: ["is watching", "watching"], answer: 0, explain: "Continuo = is + -ing." },
    ],
  },
  {
    slug: "a1-conjunciones-basicas",
    eyebrow: "A1 · Conectores",
    title: "Conjunciones",
    emphasis: "and, but, or",
    goal: "Ya puedes unir ideas con and, but y or en frases simples.",
    conceptRows: [
      { key: "and", value: "suma · tea and coffee", highlights: ["and"] },
      { key: "but", value: "contraste · cheap but good", highlights: ["but"] },
      { key: "or", value: "opción · tea or coffee?", highlights: ["or"] },
    ],
    mistake: { bad: "I like tea, and but I prefer coffee.", good: "I like tea, but I prefer coffee.", note: "no combines but con and" },
    quiz: [
      { q: "Do you want tea ___ coffee?", options: ["or", "but"], answer: 0, explain: "Opción → or." },
    ],
  },
  {
    slug: "a1-contables-incontables",
    eyebrow: "A1 · Sustantivos",
    title: "Contables e",
    emphasis: "incontables",
    goal: "Ya distingues sustantivos que puedes contar de los que van en masa.",
    conceptRows: [
      { key: "Contable", value: "an apple, two apples, many apples", highlights: ["apples"] },
      { key: "Incontable", value: "water, rice, money (sin plural)", highlights: ["water"] },
      { key: "a/an", value: "solo con contables singulares · a book", highlights: ["a"] },
    ],
    mistake: { bad: "I need an informations.", good: "I need some information.", note: "information es incontable" },
    quiz: [
      { q: "Can I have ___ water?", options: ["some", "a"], answer: 0, explain: "water es incontable → some." },
    ],
  },
  {
    slug: "a1-adverbios-frecuencia",
    eyebrow: "A1 · Adverbios",
    title: "Adverbios de",
    emphasis: "frecuencia",
    goal: "Ya colocas always, usually, sometimes y never en la posición correcta.",
    conceptRows: [
      { key: "Orden", value: "always → usually → often → sometimes → never", highlights: ["always"] },
      { key: "Posición", value: "I always drink coffee. (después del sujeto)", highlights: ["always drink"] },
      { key: "to be", value: "She is always late. (después del verbo be)", highlights: ["is always"] },
    ],
    mistake: { bad: "I drink always coffee.", good: "I always drink coffee.", note: "el adverbio va antes del verbo principal" },
    quiz: [
      { q: "He is ___ late.", options: ["always", "always is"], answer: 0, explain: "Con to be: be + adverbio + complemento." },
    ],
  },
  {
    slug: "a2-pasado-to-be",
    eyebrow: "A2 · Pasado",
    title: "To be en",
    emphasis: "pasado",
    goal: "Ya usas was/were para describir estados y lugares en el pasado.",
    conceptRows: [
      { key: "was", value: "I / he / she / it was tired", highlights: ["was"] },
      { key: "were", value: "you / we / they were at home", highlights: ["were"] },
      { key: "Negativo", value: "wasn't / weren't", highlights: ["wasn't"] },
    ],
    mistake: { bad: "They was happy.", good: "They were happy.", note: "they → were" },
    quiz: [
      { q: "We ___ at school yesterday.", options: ["were", "was"], answer: 0, explain: "We → were." },
    ],
  },
  {
    slug: "a2-pasado-continuo",
    eyebrow: "A2 · Pasado",
    title: "Pasado",
    emphasis: "continuo",
    goal: "Ya describes acciones en progreso en el pasado con was/were + -ing.",
    conceptRows: [
      { key: "Forma", value: "I was working · They were waiting", highlights: ["was working"] },
      { key: "Fondo", value: "It was raining when we left.", highlights: ["was raining"] },
      { key: "Interrupción", value: "I was reading when you called.", highlights: ["when"] },
    ],
    mistake: { bad: "I was work at 8pm.", good: "I was working at 8pm.", note: "continuo = was/were + -ing" },
    quiz: [
      { q: "They ___ dinner at 7pm.", options: ["were having", "were have"], answer: 0, explain: "Pasado continuo = were + -ing." },
    ],
  },
  {
    slug: "a2-presente-continuo-futuro",
    eyebrow: "A2 · Futuro",
    title: "Continuo para",
    emphasis: "planes",
    goal: "Ya usas presente continuo para citas y planes ya acordados.",
    conceptRows: [
      { key: "Plan fijo", value: "I'm meeting John at 6. (ya acordado)", highlights: ["I'm meeting"] },
      { key: "Señales", value: "tonight, tomorrow, next week", highlights: ["tomorrow"] },
      { key: "vs going to", value: "I'm going to study = intención general", highlights: ["going to"] },
    ],
    mistake: { bad: "I meet him tomorrow.", good: "I'm meeting him tomorrow.", note: "cita acordada → continuo" },
    quiz: [
      { q: "We ___ lunch with them on Friday.", options: ["are having", "have"], answer: 0, explain: "Plan acordado → present continuous." },
    ],
  },
  {
    slug: "a2-when-while-pasado",
    eyebrow: "A2 · Tiempo",
    title: "When y while",
    emphasis: "en pasado",
    goal: "Ya conectas dos acciones pasadas con when y while.",
    conceptRows: [
      { key: "when + pasado", value: "When I arrived, she left.", highlights: ["When"] },
      { key: "while + continuo", value: "While I was cooking, he called.", highlights: ["While", "was cooking"] },
      { key: "Idea", value: "while enfatiza duración; when puede ser puntual", highlights: ["while"] },
    ],
    mistake: { bad: "While I cooked, he called.", good: "While I was cooking, he called.", note: "acción larga en fondo → past continuous" },
    quiz: [
      { q: "I read ___ she was sleeping.", options: ["while", "because"], answer: 0, explain: "Simultaneidad → while." },
    ],
  },
  {
    slug: "a2-pronombres-reflexivos",
    eyebrow: "A2 · Pronombres",
    title: "Pronombres",
    emphasis: "reflexivos",
    goal: "Ya usas myself, yourself, himself… cuando sujeto y objeto son la misma persona.",
    conceptRows: [
      { key: "myself", value: "I hurt myself.", highlights: ["myself"] },
      { key: "yourself", value: "Help yourself.", highlights: ["yourself"] },
      { key: "himself / herself", value: "She taught herself.", highlights: ["herself"] },
    ],
    mistake: { bad: "I cut me.", good: "I cut myself.", note: "misma persona → reflexivo" },
    quiz: [
      { q: "Be careful. Don't hurt ___.", options: ["yourself", "you"], answer: 0, explain: "Acción sobre uno mismo → yourself." },
    ],
  },
  {
    slug: "a2-one-ones",
    eyebrow: "A2 · Sustitución",
    title: "One y",
    emphasis: "ones",
    goal: "Ya evitas repetir sustantivos con the red one, these ones, a new one.",
    conceptRows: [
      { key: "one", value: "singular · Which bag? The black one.", highlights: ["one"] },
      { key: "ones", value: "plural · I like the blue ones.", highlights: ["ones"] },
      { key: "a/an + one", value: "I need a new one.", highlights: ["a new one"] },
    ],
    mistake: { bad: "I want the red.", good: "I want the red one.", note: "one reemplaza al sustantivo omitido" },
    quiz: [
      { q: "These shoes are nice, but I prefer the black ___.", options: ["ones", "one"], answer: 0, explain: "shoes es plural → ones." },
    ],
  },
  {
    slug: "a2-adverbios-grado",
    eyebrow: "A2 · Adverbios",
    title: "Adverbios de",
    emphasis: "grado",
    goal: "Ya matizas intensidad con very, really y quite delante de adjetivos.",
    conceptRows: [
      { key: "very", value: "muy · very hot, very tired", highlights: ["very"] },
      { key: "really", value: "de verdad · really good", highlights: ["really"] },
      { key: "quite", value: "bastante · quite interesting", highlights: ["quite"] },
    ],
    mistake: { bad: "It is very much hot.", good: "It is very hot.", note: "very + adjetivo, sin much" },
    quiz: [
      { q: "The movie was ___ good.", options: ["really", "real"], answer: 0, explain: "Intensificador del adjetivo → really." },
    ],
  },
];

const SPECS: DeckSpec[] = [
  ...A1_A2_SPECS,
  ...B1_B2_DECK_SPECS,
  ...C1_C2_DECK_SPECS,
];

function buildDeck(spec: DeckSpec) {
  const prefix = spec.slug;
  return {
    meta: {
      eyebrow: spec.eyebrow,
      title: spec.title,
      titleEmphasis: spec.emphasis,
      goal: spec.goal,
    },
    cards: [
      {
        id: `${prefix}-concept`,
        tag: "Idea central",
        title: `${spec.title}: qué expresa`,
        lede: spec.goal,
        blocks: [{ type: "rules", rows: spec.conceptRows }],
        tip: { label: "Objetivo:", body: "reconocer el patrón y usarlo en frases propias." },
      },
      {
        id: `${prefix}-form`,
        tag: "Forma",
        title: "La estructura que debes recordar",
        lede: "Observa la forma completa antes de producir tus propios ejemplos.",
        blocks: [{ type: "rules", rows: spec.conceptRows.slice(0, 3) }],
      },
      {
        id: `${prefix}-examples`,
        tag: "En contexto",
        title: "Ejemplos naturales",
        lede: "Lee cada ejemplo como una unidad completa.",
        blocks: [
          {
            type: "rules",
            rows: spec.conceptRows.map((r, i) => ({
              key: `Ejemplo ${i + 1}`,
              value: r.value.split(" · ")[1] ?? r.value,
            })),
          },
        ],
      },
      {
        id: `${prefix}-contrast`,
        tag: "Contraste",
        title: "Cómo cambia el significado",
        lede: "La elección depende del contexto y la intención.",
        blocks: [
          {
            type: "contrast",
            columns: [
              {
                label: spec.conceptRows[0]?.key ?? "A",
                rule: spec.conceptRows[0]?.value ?? "",
                examples: [spec.conceptRows[0]?.value.split(" · ")[1] ?? spec.conceptRows[0]?.value ?? ""],
              },
              {
                label: spec.conceptRows[1]?.key ?? "B",
                rule: spec.conceptRows[1]?.value ?? "",
                examples: [spec.conceptRows[1]?.value.split(" · ")[1] ?? spec.conceptRows[1]?.value ?? ""],
              },
            ],
          },
        ],
      },
      {
        id: `${prefix}-mistakes`,
        tag: "Error frecuente",
        title: "Evita este calco",
        lede: "Compara la versión incorrecta con una forma natural.",
        blocks: [
          {
            type: "pairs",
            lines: [
              { variant: "bad", text: spec.mistake.bad },
              { variant: "good", text: spec.mistake.good, note: spec.mistake.note },
            ],
          },
        ],
      },
      {
        id: `${prefix}-reference`,
        tag: "Referencia rápida",
        title: "Decisión en cuatro pasos",
        lede: "Usa esta lista para comprobar tu frase.",
        blocks: [
          {
            type: "rules",
            rows: [
              { key: "1. Intención", value: "¿Qué quieres expresar?" },
              { key: "2. Estructura", value: "Elige la forma del patrón." },
              { key: "3. Concordancia", value: "Revisa sujeto, tiempo y número." },
              { key: "4. Naturalidad", value: "Lee la frase en voz alta." },
            ],
          },
        ],
        tip: { label: "Práctica:", body: "escribe una frase personal con el patrón." },
      },
    ],
    quiz: spec.quiz,
  };
}

const outDir = path.join(process.cwd(), "public", "grammar-decks");
for (const spec of SPECS) {
  if (!NEW_PATTERN_DECK_SLUGS.includes(spec.slug as (typeof NEW_PATTERN_DECK_SLUGS)[number])) {
    throw new Error(`Unexpected slug ${spec.slug}`);
  }
  const outPath = path.join(outDir, `${spec.slug}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(buildDeck(spec), null, 2)}\n`, "utf8");
  console.log("wrote", spec.slug);
}
