/**
 * Generates grammar deck JSON for pattern gaps across levels.
 * Run: pnpm exec tsx scripts/generate-grammar-pattern-decks.ts
 */
import fs from "fs";
import path from "path";
import { NEW_PATTERN_DECK_SLUGS } from "../lib/courses/grammar-patterns";
import { A1_DECK_SPECS } from "./grammar-pattern-deck-specs-a1";
import { A2_DECK_SPECS } from "./grammar-pattern-deck-specs-a2";
import { B1_B2_DECK_SPECS } from "./grammar-pattern-deck-specs-b1-b2";
import { C1_C2_DECK_SPECS } from "./grammar-pattern-deck-specs-c1-c2";

export type DeckSpec = {
  slug: string;
  eyebrow: string;
  title: string;
  emphasis?: string;
  goal: string;
  conceptRows: Array<{ key: string; value: string; highlights?: string[] }>;
  structureRows?: Array<{ key: string; value: string; highlights?: string[] }>;
  contextExamples?: Array<{ key: string; value: string }>;
  contrastColumns?: Array<{ label: string; rule: string; examples: string[] }>;
  quickReferenceRows?: Array<{ key: string; value: string }>;
  mistake: { bad: string; good: string; note: string };
  quiz: Array<{ q: string; options: string[]; answer: number; explain: string }>;
};

const SPECS: DeckSpec[] = [
  ...A1_DECK_SPECS,
  ...A2_DECK_SPECS,
  ...B1_B2_DECK_SPECS,
  ...C1_C2_DECK_SPECS,
];

function buildDeck(spec: DeckSpec) {
  const prefix = spec.slug;
  return {
    isGenerated: true,
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
        lede: "Observa la estructura completa antes de producir tus propios ejemplos.",
        blocks: [{ type: "rules", rows: spec.structureRows ?? spec.conceptRows.slice(0, 3) }],
      },
      {
        id: `${prefix}-examples`,
        tag: "En contexto",
        title: "Ejemplos naturales",
        lede: "Lee cada ejemplo en situaciones reales del día a día.",
        blocks: [
          {
            type: "rules",
            rows: spec.contextExamples ?? spec.conceptRows.map((r, i) => ({
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
        lede: "Compara estas opciones para saber cuándo elegir cada una.",
        blocks: [
          {
            type: "contrast",
            columns: spec.contrastColumns ?? [
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
        lede: "Compara la versión incorrecta con la forma natural en inglés.",
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
        title: "Guía rápida de uso",
        lede: "Comprueba las reglas clave para este patrón.",
        blocks: [
          {
            type: "rules",
            rows: spec.quickReferenceRows ?? [
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
