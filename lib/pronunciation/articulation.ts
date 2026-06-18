/**
 * Descripciones articulatorias en español, una por símbolo IPA.
 * Texto fijo (sin IA): cómo producir cada sonido del inglés. Indexado por el
 * mismo símbolo IPA que ARPABET_TO_IPA (lib/pronunciation/phonemes.ts) emite,
 * de modo que se enlaza directo con PhonemeAlignment.ipa.
 */
export const ARTICULATION: Record<string, string> = {
  // Vocales
  ɑ: "Abre bien la boca y mantén la lengua baja y atrás, como en 'father'.",
  æ: "Abre la boca y baja la lengua al frente, como la 'a' de 'cat'.",
  ʌ: "Relaja la boca con una abertura media, sonido corto como en 'but'.",
  ɔ: "Redondea los labios ligeramente con la lengua atrás, como en 'law'.",
  aʊ: "Empieza con la boca abierta ('a') y cierra hacia 'u', como en 'cow'.",
  aɪ: "Empieza con 'a' abierta y desliza hacia 'i', como en 'bite'.",
  ɛ: "Boca entreabierta, lengua media al frente, como la 'e' de 'bet'.",
  ɜr: "Lengua central con los labios neutros y el sonido de 'r', como en 'bird'.",
  eɪ: "Empieza en 'e' y desliza hacia 'i', como en 'bake'.",
  ɪ: "Sonido corto y relajado, como la 'i' de 'bit' (no tan tenso como 'beet').",
  iː: "Estira los labios y tensa la lengua arriba al frente, como en 'beet'.",
  oʊ: "Empieza redondeando los labios y desliza hacia 'u', como en 'boat'.",
  ɔɪ: "Empieza en 'o' redondeada y desliza hacia 'i', como en 'boy'.",
  ʊ: "Sonido corto con labios algo redondeados, como en 'book'.",
  uː: "Redondea bien los labios y eleva la lengua atrás, como en 'boot'.",
  // Consonantes
  b: "Junta los labios y suéltalos con voz (vibración en la garganta).",
  tʃ: "Combina 't' + 'sh' en un golpe, como en 'cheese'.",
  d: "Presiona la lengua contra las encías superiores y suéltala con voz.",
  ð: "Saca un poco la lengua entre los dientes y vibra, como en 'the'.",
  f: "Apoya los dientes superiores sobre el labio inferior y deja salir el aire.",
  ɡ: "Eleva la parte de atrás de la lengua contra el paladar y suelta con voz.",
  h: "Deja salir un soplo de aire suave desde la garganta, como en 'hat'.",
  dʒ: "Combina 'd' + el sonido suave de 'g', como en 'jump'.",
  k: "Eleva la parte de atrás de la lengua contra el paladar y suelta sin voz.",
  l: "Toca con la punta de la lengua las encías superiores dejando salir el aire por los lados.",
  m: "Junta los labios dejando salir el aire por la nariz.",
  n: "Apoya la punta de la lengua en las encías superiores y deja salir el aire por la nariz.",
  ŋ: "Eleva la parte de atrás de la lengua y deja salir el aire por la nariz, como en 'sing'.",
  p: "Junta los labios y suéltalos con un golpe de aire, sin voz.",
  ɹ: "Curva la lengua hacia atrás sin tocar el paladar, como la 'r' inglesa de 'red'.",
  s: "Deja que el aire fluya suavemente entre la lengua y el paladar, sin detenerlo.",
  ʃ: "Redondea un poco los labios y deja salir el aire, como el 'sh' de 'shoe'.",
  t: "Presiona la lengua contra las encías superiores, detrás de los dientes, y suéltala con un golpe de aire.",
  θ: "Saca un poco la lengua entre los dientes y deja salir el aire sin voz, como en 'think'.",
  v: "Apoya los dientes superiores sobre el labio inferior y vibra con voz.",
  w: "Redondea los labios y deslízalos hacia la vocal, como en 'we'.",
  j: "Empieza con la lengua alta al frente y desliza hacia la vocal, como la 'y' de 'yes'.",
  z: "Como la 's' pero con voz: deja fluir el aire vibrando, como en 'zoo'.",
  ʒ: "Como 'sh' pero con voz, como en 'vision'.",
}

export function getArticulation(ipa: string): string | null {
  return ARTICULATION[ipa] ?? null
}
