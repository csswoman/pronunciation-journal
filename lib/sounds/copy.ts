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

/**
 * Explicaciones intuitivas, humanas y directas para hispanohablantes.
 * Reemplazan la jerga técnica académica ("casi cerrada anterior...") por
 * instrucciones sensoriales claras y contrastes prácticos con el español.
 */
export const SOUND_LEARNER_HINT_ES: Record<string, string> = {
  "/iː/": "La «i» larga y sonriente. Tensa los labios hacia los lados con firmeza.",
  "/ɪ/": "La «i» corta y relajada. No sonrías: afloja la mandíbula y haz un sonido rápido, como una «e» perezosa.",
  "/ɛ/": "Una «e» más abierta que en español. Deja caer la mandíbula un poco más que al decir «mesa».",
  "/æ/": "Entre «a» y «e». Abre la boca como para «a», pero sonríe como para «e».",
  "/ɑ/": "Una «a» profunda y abierta desde el fondo, como cuando el médico te pide decir «aaah».",
  "/ɔ/": "Una «o» abierta con los labios redondeados hacia afuera.",
  "/ʊ/": "La «u» corta y relajada. No tenses los labios hacia adelante; mantenlos suaves.",
  "/uː/": "La «u» larga y redonda. Proyecta los labios hacia adelante con firmeza.",
  "/ʌ/": "La «a» corta y neutra. Un sonido seco y relajado desde el centro de la boca.",
  "/ɜr/": "Vocal con «r» americana. Curva la lengua hacia atrás sin tocar el paladar.",
  "/ə/": "El sonido «schwa»: el más común del inglés. Una vocal vaga, rápida y totalmente relajada.",
  "/p/": "Explosión rápida de aire cerrando los labios con fuerza.",
  "/b/": "Igual que la «p», pero con vibración sonora desde la garganta.",
  "/t/": "Apoya la punta de la lengua en la encía superior (no en los dientes como en español).",
  "/d/": "Igual que la «t», pero con vibración sonora desde la garganta.",
  "/k/": "Golpe seco de aire en la parte trasera del paladar.",
  "/g/": "Igual que la «k», pero con vibración sonora desde la garganta.",
  "/f/": "Dientes superiores sobre el labio inferior expulsando aire continuo.",
  "/v/": "Dientes superiores sobre el labio inferior, pero haciendo vibrar las cuerdas vocales.",
  "/θ/": "Como la «z» de España: asoma la punta de la lengua suavemente entre los dientes sin vibrar.",
  "/ð/": "Como la «d» de «nada»: lengua entre los dientes, pero con vibración en la garganta.",
  "/s/": "Silbido continuo de aire entre los dientes.",
  "/z/": "Igual que la «s», pero zumbando como una abeja con vibración en la garganta.",
  "/ʃ/": "El sonido «¡shhh!» para pedir silencio, con los labios redondeados hacia afuera.",
  "/ʒ/": "Igual que «sh», pero con vibración en la garganta, como en «television» o «vision».",
  "/h/": "Una exhalación suave de aire caliente, como empañar un cristal con la boca.",
  "/tʃ/": "Como la «ch» en «chocolate», expulsando el aire con energía.",
  "/dʒ/": "Como la «ch», pero con vibración sonora en la garganta (como «John» o «joy»).",
  "/m/": "Labios cerrados expulsando el sonido por la nariz.",
  "/n/": "Lengua contra la encía superior expulsando el sonido por la nariz.",
  "/ŋ/": "Pega la parte trasera de la lengua al paladar y saca el aire por la nariz (como «sing»).",
  "/l/": "Punta de la lengua firme contra la encía superior, dejando salir el aire por los lados.",
  "/r/": "La «r» americana: la lengua flota curvada hacia atrás sin tocar ninguna parte de la boca.",
  "/j/": "Sonido suave y continuo como la «y» en «yes» o la «i» en «hielo».",
  "/w/": "Labios bien redondeados como para decir «hueso» o «water».",
  "/eɪ/": "Desliza suavemente desde la «e» hacia la «i».",
  "/aɪ/": "Desliza con claridad desde la «a» hacia la «i».",
  "/ɔɪ/": "Desliza desde la «o» abierta hacia la «i».",
  "/oʊ/": "Desliza desde la «o» hacia la «u» redondeando los labios al final.",
  "/aʊ/": "Desliza desde la «a» hacia la «u» redondeando los labios.",
};

export function getSoundLearnerHint(phoneme: Pick<PhonemeData, "symbol">): string {
  return SOUND_LEARNER_HINT_ES[canonicalizeSoundIpa(phoneme.symbol)] ?? getSoundDescription(phoneme);
}
