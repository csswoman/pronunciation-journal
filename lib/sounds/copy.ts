import type { PhonemeData } from "@/components/ipa/data";
import { canonicalizeSoundIpa } from "./inventory";

/**
 * Spanish learner-facing descriptions for the canonical sound inventory.
 * The technical English source remains in `components/ipa/data.ts`; this map
 * keeps the Spanish product UI explicit instead of exposing that source copy.
 */
export const SOUND_DESCRIPTION_ES: Record<string, string> = {
  "/iː/": "Vocal cerrada anterior no redondeada, como la «ee» de «see». Es tensa.",
  "/ɪ/": "Vocal casi cerrada, casi anterior y no redondeada, como la «i» de «sit». Es relajada.",
  "/ɛ/": "Vocal abierta-media anterior no redondeada, como la «e» de «bed». Es más abierta que la «e» española.",
  "/æ/": "Vocal casi abierta anterior no redondeada, como la «a» de «cat».",
  "/ɑ/": "Vocal abierta posterior no redondeada, como la «o» de «hot».",
  "/ɔ/": "Vocal abierta-media posterior redondeada, como «aw» en «law».",
  "/ʊ/": "Vocal casi cerrada, casi posterior y redondeada, como «oo» en «book». Es relajada.",
  "/uː/": "Vocal cerrada posterior redondeada, como «oo» en «moon». Es tensa.",
  "/ʌ/": "Vocal abierta-media posterior no redondeada, como la «u» de «cup». Aparece en sílabas tónicas.",
  "/ɜr/": "Vocal central media con color de R, como «ur» en «nurse». La vocal y la R forman un solo sonido.",
  "/ə/": "Vocal central media no redondeada, la vocal más común del inglés. Solo aparece en sílabas átonas.",
  "/p/": "Oclusiva bilabial sorda, como la «p» de «pen».",
  "/b/": "Oclusiva bilabial sonora, como la «b» de «bed».",
  "/t/": "Oclusiva alveolar sorda, como la «t» de «ten».",
  "/d/": "Oclusiva alveolar sonora, como la «d» de «dog».",
  "/k/": "Oclusiva velar sorda, como la «c» de «cat».",
  "/g/": "Oclusiva velar sonora, como la «g» de «go».",
  "/f/": "Fricativa labiodental sorda, como la «f» de «fan».",
  "/v/": "Fricativa labiodental sonora, como la «v» de «van».",
  "/θ/": "Fricativa dental sorda, como «th» en «think».",
  "/ð/": "Fricativa dental sonora, como «th» en «this».",
  "/s/": "Fricativa alveolar sorda, como la «s» de «see».",
  "/z/": "Fricativa alveolar sonora, como la «z» de «zoo».",
  "/ʃ/": "Fricativa postalveolar sorda, como «sh» en «she».",
  "/ʒ/": "Fricativa postalveolar sonora, como la «s» de «vision».",
  "/h/": "Fricativa glotal sorda, como la «h» de «hat».",
  "/tʃ/": "Africada postalveolar sorda, como «ch» en «church».",
  "/dʒ/": "Africada postalveolar sonora, como la «j» de «judge».",
  "/m/": "Nasal bilabial sonora, como la «m» de «man».",
  "/n/": "Nasal alveolar sonora, como la «n» de «no».",
  "/ŋ/": "Nasal velar sonora, como «ng» en «sing». Nunca aparece al inicio de palabra.",
  "/l/": "Aproximante lateral alveolar sonora, como la «l» de «leg».",
  "/r/": "Aproximante postalveolar sonora, como la «r» de «red».",
  "/j/": "Aproximante palatal sonora, como la «y» de «yes».",
  "/w/": "Aproximante labial-velar sonora, como la «w» de «wet».",
  "/eɪ/": "Diptongo ascendente anterior, como «ay» en «day».",
  "/aɪ/": "Diptongo ascendente anterior, como la «i» de «time».",
  "/ɔɪ/": "Diptongo, como «oy» en «boy».",
  "/oʊ/": "Diptongo ascendente posterior, como la «o» de «go». No es una «o» española plana.",
  "/aʊ/": "Diptongo ascendente posterior, como «ow» en «now».",
};

export function getSoundDescription(phoneme: Pick<PhonemeData, "symbol">): string {
  return SOUND_DESCRIPTION_ES[canonicalizeSoundIpa(phoneme.symbol)] ?? "Descripción articulatoria del sonido.";
}
