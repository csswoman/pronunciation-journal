/**
 * Guías articulatorias y biomecánicas de fonemas en inglés para hispanohablantes.
 * Enfoque de alta precisión pedagógica (colocación de lengua, labios, cuerdas vocales y trampas comunes).
 */

export interface ArticulationGuide {
  phoneme: string;
  name: string;
  type: 'vowel' | 'consonant' | 'diphthong';
  voiced: boolean;
  tonguePosition: string;
  lipsPosition: string;
  airflow: string;
  spanishTrap: string;
  biomechanicsTip: string;
  keyWords: { word: string; ipa: string; translation: string }[];
  diagramType: 'interdental' | 'labiodental' | 'vowel-high-front' | 'vowel-lax-front' | 'vowel-open' | 'schwa' | 'postalveolar';
}

export const PHONEME_ARTICULATION_GUIDES: Record<string, ArticulationGuide> = {
  '/θ/': {
    phoneme: '/θ/',
    name: 'TH Sorda (Voiceless TH)',
    type: 'consonant',
    voiced: false,
    tonguePosition: 'Punta de la lengua suavemente asomada entre los dientes frontales superiores e inferiores.',
    lipsPosition: 'Relajados y ligeramente abiertos.',
    airflow: 'El aire pasa continuamente entre los dientes y la lengua. No uses cuerdas vocales.',
    spanishTrap: 'Evita pronunciarla como una "S" o una "T". El aire debe ser continuo y suave.',
    biomechanicsTip: 'Tócate la garganta: NO debe haber ninguna vibración. Solo aire expulsado.',
    keyWords: [
      { word: 'Think', ipa: '/θɪŋk/', translation: 'Pensar' },
      { word: 'Thanks', ipa: '/θæŋks/', translation: 'Gracias' },
      { word: 'Bath', ipa: '/bæθ/', translation: 'Baño' },
    ],
    diagramType: 'interdental',
  },
  '/ð/': {
    phoneme: '/ð/',
    name: 'TH Sonora (Voiced TH)',
    type: 'consonant',
    voiced: true,
    tonguePosition: 'Punta de la lengua entre los dientes frontales, igual que /θ/, pero activando la voz.',
    lipsPosition: 'Relajados y entreabiertos.',
    airflow: 'Fricción continua con zumbido audible en la garganta.',
    spanishTrap: 'Evita pronunciarla como una "D" fuerte en español. La lengua no debe golpear el paladar.',
    biomechanicsTip: 'Tócate la garganta: DEBES sentir una vibración o zumbido claro.',
    keyWords: [
      { word: 'This', ipa: '/ðɪs/', translation: 'Esto' },
      { word: 'Mother', ipa: '/ˈmʌðər/', translation: 'Madre' },
      { word: 'Breathe', ipa: '/briːð/', translation: 'Respirar' },
    ],
    diagramType: 'interdental',
  },
  '/iː/': {
    phoneme: '/iː/',
    name: 'Vocal I Larga y Tensa (Fleece)',
    type: 'vowel',
    voiced: true,
    tonguePosition: 'Lengua alta y adelantada hacia el paladar duro. Los músculos están tensos.',
    lipsPosition: 'Sonrisa amplia y labios estirados lateralmente.',
    airflow: 'Sonido sostenido, claro y brillante.',
    spanishTrap: 'Similar a la "i" en español, pero más larga y con una sonrisa más tensa.',
    biomechanicsTip: 'Estira las comisuras de los labios hacia afuera como si sonrieras para una foto.',
    keyWords: [
      { word: 'Sheep', ipa: '/ʃiːp/', translation: 'Oveja' },
      { word: 'Beach', ipa: '/biːtʃ/', translation: 'Playa' },
      { word: 'Feel', ipa: '/fiːl/', translation: 'Sentir' },
    ],
    diagramType: 'vowel-high-front',
  },
  '/ɪ/': {
    phoneme: '/ɪ/',
    name: 'Vocal I Corta y Relajada (Kit)',
    type: 'vowel',
    voiced: true,
    tonguePosition: 'Lengua en posición media-alta pero completamente relajada, más baja que en /iː/.',
    lipsPosition: 'Labios neutros y relajados, sin sonrisa forzada.',
    airflow: 'Sonido muy corto y apagado.',
    spanishTrap: 'NO existe en español. NO es una "i" latina; suena a medio camino entre una "i" y una "e".',
    biomechanicsTip: 'Deja caer la mandíbula un par de milímetros y relaja toda la tensión muscular.',
    keyWords: [
      { word: 'Ship', ipa: '/ʃɪp/', translation: 'Barco' },
      { word: 'Bitch', ipa: '/bɪtʃ/', translation: 'Perra / Quejarse' },
      { word: 'Fill', ipa: '/fɪl/', translation: 'Llenar' },
    ],
    diagramType: 'vowel-lax-front',
  },
  '/æ/': {
    phoneme: '/æ/',
    name: 'Vocal A Abierta (Trap / Cat)',
    type: 'vowel',
    voiced: true,
    tonguePosition: 'Lengua baja y plana en el fondo de la boca, con la parte frontal ligeramente elevada.',
    lipsPosition: 'Boca muy abierta verticalmente y comisuras estiradas.',
    airflow: 'Sonido abierto y resonante.',
    spanishTrap: 'No es la "a" española (que es central). Es una "a" más amplia y lateralizada.',
    biomechanicsTip: 'Abre la boca como si fueras a decir "a" pero intenta pronunciar "e".',
    keyWords: [
      { word: 'Cat', ipa: '/kæt/', translation: 'Gato' },
      { word: 'Man', ipa: '/mæn/', translation: 'Hombre' },
      { word: 'Bad', ipa: '/bæd/', translation: 'Malo' },
    ],
    diagramType: 'vowel-open',
  },
  '/ə/': {
    phoneme: '/ə/',
    name: 'El Sonido Schwa (Vocal Neutra)',
    type: 'vowel',
    voiced: true,
    tonguePosition: 'Lengua en el centro exacto de la boca, en reposo absoluto.',
    lipsPosition: 'Completamente relajados, sin redondeo ni sonrisa.',
    airflow: 'Mínimo esfuerzo acústico, solo aparece en sílabas NO acentuadas (átonas).',
    spanishTrap: 'Los hispanohablantes tienden a pronunciar la vocal escrita (a, e, o). En inglés casi todo se reduce a Schwa.',
    biomechanicsTip: 'Emite un sonido de pereza como "uh" sin mover la mandíbula.',
    keyWords: [
      { word: 'About', ipa: '/əˈbaʊt/', translation: 'Acerca de' },
      { word: 'Banana', ipa: '/bəˈnænə/', translation: 'Plátano' },
      { word: 'Problem', ipa: '/ˈprɑːbləm/', translation: 'Problema' },
    ],
    diagramType: 'schwa',
  },
  '/v/': {
    phoneme: '/v/',
    name: 'Fricativa Labiodental (V Sonora)',
    type: 'consonant',
    voiced: true,
    tonguePosition: 'Lengua en posición neutra.',
    lipsPosition: 'Dientes superiores delanteros tocando suavemente el labio inferior.',
    airflow: 'El aire escapa entre los dientes y el labio mientras vibran las cuerdas vocales.',
    spanishTrap: 'En español "B" y "V" suenan exactamente igual. En inglés "V" SIEMPRE requiere dientes sobre el labio.',
    biomechanicsTip: 'Muerde ligeramente tu labio inferior por dentro y haz vibrar tu garganta como el motor de una moto.',
    keyWords: [
      { word: 'Very', ipa: '/ˈvɛri/', translation: 'Muy' },
      { word: 'Van', ipa: '/væn/', translation: 'Furgoneta' },
      { word: 'Live', ipa: '/lɪv/', translation: 'Vivir' },
    ],
    diagramType: 'labiodental',
  },
};

import {
  ARTICULATION_GUIDE_MAP,
  type PhonemeArticulationGuide,
} from "@/lib/pronunciation/articulation-guide-data";

function fromCatalogGuide(guide: PhonemeArticulationGuide): ArticulationGuide {
  let spanishTrap = `Presta atención al punto de articulación: ${guide.placeEs}.`;
  let biomechanicsTip = guide.visualCueEs;

  if (guide.symbol === "/z/") {
    spanishTrap = 'En español no existe la /z/ sonora; tendemos a decir /s/. Haz vibrar tus cuerdas vocales.';
    biomechanicsTip = 'Coloca los dedos en tu garganta: debes sentir un zumbido continuo como una abeja.';
  } else if (guide.symbol === "/ʃ/") {
    spanishTrap = 'Difiere de la "ch" española (/tʃ/). No toques el paladar con la lengua; el aire debe salir continuo.';
    biomechanicsTip = 'Haz el gesto de pedir silencio ("shhh") redondeando suavemente los labios hacia adelante.';
  } else if (guide.symbol === "/tʃ/") {
    spanishTrap = 'Similar a la "ch" española, pero con una expulsión de aire más marcada.';
    biomechanicsTip = 'Bloquea el aire un instante con la lengua tras los dientes superiores y luego suéltalo.';
  } else if (guide.symbol === "/dʒ/") {
    spanishTrap = 'Sonora: requiere voz activa. Los hispanohablantes a veces la pronuncian como "y" o "ch".';
    biomechanicsTip = 'Pronuncia una "ch" pero haciendo vibrar fuertemente las cuerdas vocales en la garganta.';
  } else if (["/p/", "/t/", "/k/"].includes(guide.symbol)) {
    spanishTrap = 'En inglés al inicio de sílaba estas consonantes son aspiradas con un soplo de aire.';
    biomechanicsTip = 'Pon tu mano frente a la boca: debes sentir una ráfaga clara de aire al pronunciarla.';
  } else if (["/b/", "/d/", "/g/"].includes(guide.symbol)) {
    spanishTrap = 'En posición final o entre vocales, no las ensordezcas; en inglés deben mantenerse sonoras.';
    biomechanicsTip = 'Mantén la vibración vocal en la garganta hasta que concluya la consonante.';
  }

  const diagramMap: Record<string, ArticulationGuide["diagramType"]> = {
    "tip-between-teeth": "interdental",
    "teeth-on-lip": "labiodental",
    "high-front": "vowel-high-front",
    "mid-front": "vowel-lax-front",
    central: "schwa",
    "low-front": "vowel-open",
  };

  return {
    phoneme: guide.symbol,
    name: guide.nameEs,
    type: guide.category,
    voiced: guide.voicing === "voiced",
    tonguePosition: guide.placeEs,
    lipsPosition: `Forma de labios: ${guide.lipShape}, apertura: ${guide.jawOpening}`,
    airflow: guide.mannerEs,
    spanishTrap,
    biomechanicsTip,
    keyWords: [],
    diagramType: diagramMap[guide.tonguePosition] ?? "postalveolar",
  };
}

export function findArticulationGuide(phoneme: string): ArticulationGuide | null {
  if (!phoneme) return null;
  const clean = phoneme.replace(/[/\[\]ˈˌ\s]/g, '').trim();
  if (!clean) return null;

  const withSlashes = `/${clean}/`;
  if (PHONEME_ARTICULATION_GUIDES[withSlashes]) {
    return PHONEME_ARTICULATION_GUIDES[withSlashes];
  }

  if (PHONEME_ARTICULATION_GUIDES[clean]) {
    return PHONEME_ARTICULATION_GUIDES[clean];
  }

  const ALIASES: Record<string, string> = {
    th: '/θ/',
    dh: '/ð/',
    iy: '/iː/',
    ih: '/ɪ/',
    ae: '/æ/',
    ah: '/ʌ/',
    ax: '/ə/',
    v: '/v/',
    sh: '/ʃ/',
    zh: '/ʒ/',
    ch: '/tʃ/',
    jh: '/dʒ/',
    z: '/z/',
    s: '/s/',
    w: '/w/',
    r: '/r/',
  };

  const alias = ALIASES[clean.toLowerCase()];
  if (alias && PHONEME_ARTICULATION_GUIDES[alias]) {
    return PHONEME_ARTICULATION_GUIDES[alias];
  }

  // Fallback universal: buscar en el catálogo completo de 44 fonemas
  const catalogGuide =
    ARTICULATION_GUIDE_MAP[withSlashes] ??
    ARTICULATION_GUIDE_MAP[clean] ??
    (alias ? ARTICULATION_GUIDE_MAP[alias] : undefined);

  if (catalogGuide) {
    return fromCatalogGuide(catalogGuide);
  }

  return null;
}

export function getArticulationGuide(phoneme: string): ArticulationGuide | undefined {
  return findArticulationGuide(phoneme) ?? undefined;
}
