import type { EssentialWordPos } from "./types";

const POS_LABELS: Record<EssentialWordPos, string> = {
  noun: "sustantivo",
  verb: "verbo",
  adjective: "adjetivo",
  adverb: "adverbio",
  pronoun: "pronombre",
  preposition: "preposición",
  conjunction: "conjunción",
  determiner: "determinante",
  article: "artículo",
  modal: "modal",
  auxiliary: "auxiliar",
  number: "número",
  interjection: "interjección",
};

export function essentialWordPosLabel(pos: EssentialWordPos): string {
  return POS_LABELS[pos] ?? pos;
}
