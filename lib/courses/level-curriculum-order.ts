import type { CourseInput } from "./buildCurriculum";
import { phonemeTargetId } from "@/lib/pronunciation/targets/registry";
import { patternsForLevel } from "./grammar-patterns";

type LessonDef = CourseInput & { g: string };

/** Titles and flags keyed by grammar-deck slug. */
const LESSON_BY_SLUG: Record<string, Omit<CourseInput, "g">> = {
  "a1-estrategias-aprender-ingles": { t: "Cómo estudiar por tu cuenta", p: 1 },
  "a1-ingles-principiantes": { t: "Tus primeras frases", p: 1 },
  "a1-pronombres-sujeto": { t: "Yo, tú, él…: pronombres sujeto", p: 1 },
  "a1-verbo-to-be": { t: "Ser y estar (to be)", p: 1 },
  "a1-articulos-basicos": { t: "A, an y the: artículos básicos", p: 1 },
  "a1-demostrativos": { t: "This/that: demostrativos", p: 1 },
  "a1-plurales": { t: "Plurales regulares e irregulares", p: 1 },
  "a1-genitivo-sajon": { t: "El 's posesivo", p: 1 },
  "a1-posesivos": { t: "Mi, tu, su: posesivos", p: 1 },
  "a1-construccion-oraciones": { t: "Partes de la oración", p: 1 },
  "a1-presente-simple": { t: "Hábitos y rutinas (presente simple)", p: 1 },
  "a1-preguntas-do-does": { t: "Preguntas con do y does", p: 1 },
  "a1-palabras-interrogativas": { t: "What, where, who…: preguntas abiertas", p: 1 },
  "a1-there-is-there-are": { t: "There is y there are", p: 1 },
  "a1-cuanto-cuantos": { t: "How much / how many", p: 1 },
  "a1-can-capacidad-permiso": { t: "Can y can't: capacidad y permiso", p: 1 },
  "a1-verbos-comunes": { t: "Los verbos que más salen", p: 1 },
  "a1-pronombres-objeto": { t: "me, te, lo… (objeto)", p: 1 },
  "a1-imperativo": { t: "Instrucciones y órdenes", p: 1 },
  "a1-presente-continuo": { t: "Lo que pasa ahora (continuo)", p: 1 },
  "a1-preposiciones-lugar-tiempo": { t: "Preposiciones básicas de lugar y tiempo", p: 1 },
  "a1-adverbios-frecuencia": { t: "Always, usually, never", p: 1 },
  "a1-conjunciones-basicas": { t: "And, but, or: conectores básicos", p: 1 },
  "a1-contables-incontables": { t: "Contables e incontables", p: 1 },
  "a1-preferencias-habilidades": { t: "Lo que te gusta y lo que sabes hacer", p: 1 },
  "a1-pronunciacion-basica": { t: "Primeros sonidos", p: 1, s: true, pt: [phonemeTargetId("/ə/")] },
  "a1-sonido-r-americano": { t: "La erre americana /ɹ/", p: 1, s: true },
  "a1-vocales-ae-ua": { t: "Vocales /æ/ y /ʌ/", p: 1, s: true },
  "a1-alfabeto-deletreo": { t: "Deletrear con confianza", p: 0 },
  "a1-ingles-telefonico": { t: "Una llamada corta", p: 0 },
  "a1-fechas-horas-descripciones": { t: "Fechas, horas y adjetivos", p: 0 },
  "a1-vocabulario-expresiones-basicas": { t: "Palabras del día a día", p: 0 },
  "a1-escritura-basica": { t: "Escribir frases simples", p: 0 },
  "a1-practico-familia": { t: "Hablar de tu familia", p: 0 },
  "a1-practico-elementos-trabajo": { t: "En el trabajo (básico)", p: 0 },
  "a1-audio-preposiciones": { t: "Escucha: preposiciones", p: 0, s: true },
  "a1-audio-ingles-viajes": { t: "Escucha: en el aeropuerto", p: 0, s: true },

  "a2-pasado-to-be": { t: "Was y were en pasado", p: 1 },
  "a2-experiencias-pasadas-planes": { t: "Pasado y planes futuros", p: 1 },
  "a2-pasado-continuo": { t: "Pasado continuo", p: 1 },
  "a2-when-while-pasado": { t: "When y while en pasado", p: 1 },
  "a2-used-to": { t: "Hábitos del pasado con used to", p: 1 },
  "a2-presente-perfecto-experiencias": { t: "Presente perfecto: experiencias", p: 1 },
  "a2-presente-continuo-futuro": { t: "Planes ya acordados (continuo)", p: 1 },
  "a2-will-going-to": { t: "Will o going to", p: 1 },
  "a2-sustantivos-intenciones-futuras": { t: "Planes e intenciones", p: 1 },
  "a2-descripciones-comparaciones": { t: "Describir y comparar", p: 1 },
  "a2-cuantificadores-superlativos": { t: "Mucho, poco y superlativos", p: 1 },
  "a2-orden-adjetivos": { t: "Orden de los adjetivos", p: 1 },
  "a2-adverbios-expresiones-tiempo": { t: "Tiempo, frecuencia y lugar", p: 1 },
  "a2-adverbios-grado": { t: "Very, really, quite", p: 1 },
  "a2-cuantificadores-esenciales": { t: "Some, any, much y many", p: 1 },
  "a2-obligacion-prohibicion": { t: "Debes, no debes, prohibido", p: 1 },
  "a2-modales-consejo-posibilidad": { t: "Should, could y must", p: 1 },
  "a2-preguntas-respuestas": { t: "Preguntas que siempre vuelven", p: 1 },
  "a2-preguntas-indirectas": { t: "Preguntas indirectas básicas", p: 1 },
  "a2-conjunciones-verbos": { t: "Conectores y verbos", p: 1 },
  "a2-infinitivos-presente-continuo": { t: "Lo que estás haciendo ahora", p: 1 },
  "a2-verbos-confusos": { t: "Verbos que se confunden", p: 1 },
  "a2-pronombres-reflexivos": { t: "Myself, yourself…: reflexivos", p: 1 },
  "a2-one-ones": { t: "The red one / these ones", p: 1 },
  "a2-audio-aventura-ciudad": { t: "Historia: tarde en la ciudad", p: 1, s: true },
  "a2-so-such": { t: "So y such", p: 0 },
  "a2-determinantes": { t: "Each, every, all, both…", p: 0 },
  "a2-propuestas-permisos": { t: "Proponer y pedir permiso", p: 0 },
  "a2-practico-compras": { t: "De compras", p: 0 },
  "a2-practico-cocina": { t: "En la cocina", p: 0 },
  "a2-practico-viajes-turismo": { t: "De viaje turístico", p: 0 },
  "a2-practico-partes-cuerpo": { t: "Partes del cuerpo", p: 0 },

  "b1-articulos-superlativos-cero": { t: "Artículos con superlativos y cero", p: 1 },
  "b1-modificadores-comparativos": { t: "Much, far, a bit + comparativo", p: 1 },
  "b1-comparativos-planes-futuros": { t: "Comparar y planear el futuro", p: 1 },
  "b1-pronombres-clausulas-relativas": { t: "Pronombres y oraciones de relativo", p: 1 },
  "b1-preposiciones-dependientes": { t: "Preposiciones tras adjetivos y verbos", p: 1 },
  "b1-primer-condicional-pasado-continuo": { t: "Primer condicional y pasado continuo", p: 1 },
  "b1-futuro-continuo": { t: "Futuro continuo (will be + -ing)", p: 1 },
  "b1-gerundios-infinitivos": { t: "Gerundios e infinitivos", p: 1 },
  "b1-adjetivos-preguntas-indirectas": { t: "Adjetivos y preguntas indirectas", p: 1 },
  "b1-conectores-discurso": { t: "Conectores para organizar ideas", p: 1 },
  "b1-modales-deduccion": { t: "Modales de deducción", p: 1 },
  "b1-voz-pasiva-consejos": { t: "Voz pasiva y consejos", p: 1 },
  "b1-pasado-perfecto": { t: "Pasado perfecto", p: 1 },
  "b1-phrasal-verbs-tipos": { t: "Phrasal verbs: los tipos", p: 1 },
  "b1-presente-perfecto-continuo": { t: "Presente perfecto continuo", p: 1 },
  "b1-presente-perfecto-preposiciones": { t: "Presente perfecto y preposiciones", p: 1 },
  "b1-cuantificadores": { t: "All, most, none, each, every", p: 1 },
  "b1-confirmacion-posibilidades": { t: "Coletillas y posibilidad", p: 1 },
  "b1-estilo-indirecto": { t: "Estilo indirecto", p: 1 },
  "b1-segundo-condicional": { t: "Segundo condicional", p: 1 },
  "b1-condicional-cero": { t: "Condicional cero", p: 1 },
  "b1-both-either-neither": { t: "Both, either y neither", p: 1 },
  "b1-make-let-allow": { t: "Make, let y allow", p: 1 },
  "b1-habitos-pasados": { t: "Hábitos pasados: used to y would", p: 1 },
  "b1-wish-presente": { t: "Wish + pasado simple", p: 1 },
  "b1-audio-misterios-sin-resolver": { t: "Historia: misterios sin resolver", p: 1, s: true },
  "b1-expresiones-tiempo-cantidad": { t: "Tiempo, cantidad y frecuencia", p: 0 },
  "b1-emociones-estados-animo": { t: "Emociones y estados de ánimo", p: 0 },
  "b1-finanzas-personales": { t: "Finanzas personales", p: 0 },
  "b1-estrategias-escucha": { t: "Escuchar con estrategia", p: 0 },
  "b1-conectores-preferencias": { t: "Conectores y preferencias", p: 0 },
  "b1-solicitudes-pronombres-reflexivos": { t: "Peticiones y pronombres reflexivos", p: 0 },
  "b1-palabras-interrogativas-propositos": { t: "Para qué, por qué, cuándo…", p: 0 },
  "b1-preguntas-negativas-recomendaciones": { t: "Preguntas negativas y recomendaciones", p: 0 },
  "b1-practico-viajes-negocios": { t: "Viaje de negocios", p: 0 },
  "b1-practico-musica-arte": { t: "Música y arte", p: 0 },
  "b1-practico-consultas-medicas": { t: "En la consulta médica", p: 0 },
  "b1-practico-nutricion-fitness": { t: "Nutrición y fitness", p: 0 },

  "b2-ingles-practico-conversacional": { t: "Inglés conversacional en la práctica", p: 1 },
  "b2-phrasal-verbs-comunes": { t: "Phrasal verbs del día a día", p: 1 },
  "b2-conversaciones-trabajo": { t: "Conversaciones en el trabajo", p: 1 },
  "b2-pronunciacion-intermedia": { t: "Sonidos con más confianza", p: 1, s: true },
  "b2-pasado-perfecto-frases-adverbiales": { t: "Pasado perfecto y frases adverbiales", p: 1 },
  "b2-conectores-avanzados": { t: "Conectores avanzados", p: 1 },
  "b2-causativo": { t: "Have/get something done", p: 1 },
  "b2-oraciones-hendidas": { t: "Oraciones hendidas (cleft)", p: 1 },
  "b2-concesion": { t: "Even though, while y whereas", p: 1 },
  "b2-conectores-condicionales": { t: "Unless, provided y as long as", p: 1 },
  "b2-enfasis-auxiliares": { t: "Énfasis con do/does/did", p: 1 },
  "b2-futuro-perfecto-continuo": { t: "Futuro perfecto y continuo", p: 1 },
  "b2-gerundio-significado": { t: "Gerundio vs infinitivo: significado", p: 1 },
  "b2-inversion-enfasis": { t: "Inversión para dar énfasis", p: 1 },
  "b2-condicionales-mixtos": { t: "Condicionales mixtos", p: 1 },
  "b2-relativas-no-definitorias": { t: "Cláusulas relativas explicativas", p: 1 },
  "b2-clausulas-participio": { t: "Cláusulas de participio", p: 1 },
  "b2-pasiva-reportada": { t: "Reportaje pasivo", p: 1 },
  "b2-pasiva-completa": { t: "Pasiva en todos los tiempos", p: 1 },
  "b2-modales-pasado": { t: "Modales en el pasado", p: 1 },
  "b2-relativas-preposiciones": { t: "Relativas con preposiciones", p: 1 },
  "b2-discurso-indirecto-condicionales": { t: "Estilo indirecto y condicionales", p: 1 },
  "b2-oraciones-resultado": { t: "So/such … that", p: 1 },
  "b2-tercer-condicional": { t: "Tercer condicional", p: 1 },
  "b2-deseos-arrepentimientos": { t: "Deseos y arrepentimientos", p: 1 },
  "b2-verbo-objeto-gerundio": { t: "Verbo + objeto + -ing/to", p: 1 },
  "b2-despite-in-spite": { t: "Despite / in spite of", p: 1 },
  "b2-formacion-palabras-colocaciones": { t: "Formación de palabras y colocaciones", p: 1 },
  "b2-registro-formal-informal": { t: "Registro formal e informal", p: 1 },
  "b2-audio-atrapados-tecnologia": { t: "Historia: atrapados en la tecnología", p: 1, s: true },
  "b2-audio-origen-idioma": { t: "Historia: origen del idioma", p: 0, s: true },
  "b2-narracion-integrada": { t: "Tiempos mezclados al narrar", p: 0 },
  "b2-contar-anecdotas": { t: "Contar anécdotas", p: 0 },
  "b2-suposiciones-instrucciones": { t: "Suposiciones e instrucciones", p: 0 },
  "b2-comentarios-opiniones": { t: "Opinar y comentar", p: 0 },
  "b2-habitos-aproximaciones": { t: "Hábitos y aproximaciones", p: 0 },
  "b2-vocabulario-expresiones-intermedio": { t: "Vocabulario y expresiones útiles", p: 0 },
  "b2-escritura-intermedia": { t: "Escribir con más soltura", p: 0 },
  "b2-ortografia-puntuacion": { t: "Ortografía y puntuación", p: 0 },

  "c1-cohesion-discurso": { t: "Cohesión y referencia avanzada", p: 1 },
  "c1-comparativos-dobles": { t: "Comparativos dobles (the … the …)", p: 1 },
  "c1-cleft-estructura-informativa": { t: "Oraciones de escisión y pseudoescisión", p: 1 },
  "c1-relativas-complejas": { t: "Estructuras relativas complejas", p: 1 },
  "c1-verbos-delexicales": { t: "Verbos delexicales (make/do/take/have)", p: 1 },
  "c1-marcadores-discurso": { t: "Marcadores del discurso avanzados", p: 1 },
  "c1-elipsis-sustitucion-referencia": { t: "Elipsis y sustitución", p: 1 },
  "c1-anteposicion-enfasis": { t: "Anteposición para énfasis", p: 1 },
  "c1-futuro-en-pasado": { t: "Futuro en el pasado", p: 1 },
  "c1-hedging-matices": { t: "Lenguaje de cautela y atenuación", p: 1 },
  "c1-enfasis-inversion-avanzada": { t: "Inversión avanzada", p: 1 },
  "c1-matices-modales": { t: "Matices modales (will/would, may/might)", p: 1 },
  "c1-nominalizacion": { t: "Nominalización", p: 1 },
  "c1-clausulas-reducidas-participiales": { t: "Oraciones de participio perfecto y pasivo", p: 1 },
  "c1-phrasal-verbs-avanzados": { t: "Phrasal verbs avanzados", p: 1 },
  "c1-subjuntivo-formal": { t: "Subjuntivo formal (suggest/insist + base)", p: 1 },
  "c1-pasado-irreal-avanzado": { t: "Pasado irreal avanzado", p: 1 },
  "c1-conectores-contracciones-informales": { t: "Conectores y reducciones informales", p: 0, s: true },
  "c1-pronunciacion-avanzada": { t: "Sonidos avanzados", p: 0, s: true },
  "c1-lenguaje-coloquial-habitual": { t: "Inglés coloquial del día a día", p: 0 },
  "c1-recursos-conversacionales": { t: "Recursos para sonar natural", p: 0 },
  "c1-argumentos-discusiones": { t: "Argumentar y debatir", p: 0 },
  "c1-presentaciones-expresion-oral": { t: "Presentaciones y expresión oral", p: 0 },
  "c1-precision-lexica": { t: "Precisión léxica y colocaciones", p: 0 },
  "c1-escritura-academica-profesional": { t: "Escritura académica y profesional", p: 0 },
  "c1-pragmatica-tono": { t: "Pragmática: intención, tono y cortesía", p: 0 },
  "c1-tiempo-aspecto-punto-vista": { t: "Tiempo, aspecto y punto de vista", p: 0 },
  "c1-modalidad-evidencialidad": { t: "Modalidad y evidencialidad", p: 0 },
  "c1-significado-implicito-presuposiciones": { t: "Significado implícito y presuposiciones", p: 0 },
  "c1-sesgo-framing-lenguaje-evaluativo": { t: "Sesgo, framing y lenguaje evaluativo", p: 0 },
  "c1-sintesis-multiples-fuentes": { t: "Síntesis de múltiples fuentes", p: 0 },
  "c1-explicar-conceptos-complejos": { t: "Explicar conceptos complejos", p: 0 },
  "c1-desacuerdo-colaborativo": { t: "Desacuerdo colaborativo", p: 0 },
  "c1-prosodia-thought-groups-foco-nuclear": { t: "Prosodia: thought groups y foco nuclear", p: 0, s: true },
  "c1-entonacion-actitud-cortesia": { t: "Entonación para actitud y cortesía", p: 0, s: true },
  "c1-variacion-ingles-americano": { t: "Variación del inglés americano", p: 0, s: true },
  "c1-informes-propuestas-resumenes-ejecutivos": { t: "Informes, propuestas y resúmenes ejecutivos", p: 0 },
  "c1-humor-ironia": { t: "Humor e ironía", p: 0 },
  "c1-comunicacion-persuasiva-efectiva": { t: "Persuadir con sutileza", p: 0 },
  "c1-vocabulario-expresiones-avanzado": { t: "Vocabulario y expresiones avanzadas", p: 0 },
  "c1-escritura-avanzada": { t: "Escribir con precisión", p: 0 },
  "c1-expresiones-idiomaticas-negocios": { t: "Modismos de negocios", p: 0 },
  "c1-plus-connotacion-prosodia-semantica": { t: "Connotación y prosodia semántica", p: 0 },
  "c1-plus-metafora-alusion-lenguaje-figurado": { t: "Metáfora, alusión y lenguaje figurado", p: 0 },
  "c1-plus-ambiguedad-vaguedad-estrategica": { t: "Ambigüedad y vaguedad estratégica", p: 0 },
  "c1-plus-transformacion-registro": { t: "Transformación completa de registro", p: 0 },
  "c1-plus-voz-persona-estilo": { t: "Voz, persona y estilo propio", p: 0 },
  "c1-plus-ritmo-retorico-escritura": { t: "Ritmo retórico de la escritura", p: 0 },
  "c1-plus-edicion-precision-concision": { t: "Edición avanzada: precisión y concisión", p: 0 },
  "c1-plus-lectura-critica-evidencia": { t: "Lectura crítica de evidencia", p: 0 },
  "c1-plus-evaluacion-reconciliacion-fuentes": { t: "Evaluación y reconciliación de fuentes", p: 0 },
  "c1-plus-mediacion-conflictos": { t: "Mediación en conflictos complejos", p: 0 },
  "c1-plus-negociacion-alto-riesgo": { t: "Negociación de alto riesgo", p: 0 },
  "c1-plus-preguntas-hostiles-interrupciones": { t: "Preguntas hostiles e interrupciones", p: 0 },
  "c1-plus-produccion-espontanea-extensa": { t: "Producción espontánea extensa", p: 0 },
  "c1-plus-pragmatica-intercultural": { t: "Pragmática intercultural avanzada", p: 0 },

  "c2-elipsis-sustitucion-avanzada": { t: "Elipsis y sustitución avanzadas", p: 1 },
  "c2-sintagmas-nominales": { t: "Sintagmas nominales complejos", p: 1 },
  "c2-concesion-avanzada": { t: "Concesión y contraste avanzados", p: 1 },
  "c2-condicionales-idiomaticas": { t: "Condicionales idiomáticas y elípticas", p: 1 },
  "c2-inversion-literaria": { t: "Inversión literaria y enfática", p: 1 },
  "c2-topicalizacion": { t: "Topicalización y orden marcado", p: 1 },
  "c2-modalidad-matizada": { t: "Modalidad matizada", p: 1 },
  "c2-marcadores-pragmaticos": { t: "Marcadores pragmáticos", p: 1 },
  "c2-cambio-registro": { t: "Cambio de registro formal ↔ informal", p: 1 },
  "c2-pasiva-estilistica": { t: "Pasiva estilística e impersonales", p: 1 },
  "c2-subjuntivo-formulas": { t: "Subjuntivo: fórmulas fijas", p: 1 },
};

/** Onboarding before the pattern spine. */
const A1_PREFIX = ["a1-estrategias-aprender-ingles", "a1-ingles-principiantes"] as const;

/** Sentence scaffolding after possessives, before present simple. */
const A1_AFTER_POSESSIVES = ["a1-construccion-oraciones"] as const;

/** Pronunciation block after core grammar patterns. */
const A1_PRONUNCIATION = [
  "a1-pronunciacion-basica",
  "a1-sonido-r-americano",
  "a1-vocales-ae-ua",
] as const;

const A1_OPTIONAL = [
  "a1-alfabeto-deletreo",
  "a1-ingles-telefonico",
  "a1-fechas-horas-descripciones",
  "a1-vocabulario-expresiones-basicas",
  "a1-escritura-basica",
  "a1-practico-familia",
  "a1-practico-elementos-trabajo",
  "a1-audio-preposiciones",
  "a1-audio-ingles-viajes",
] as const;

/** Extra essentials interleaved after anchors (not in the pattern spine). */
const A2_INSERTIONS: ReadonlyArray<{ anchor: string; insert: readonly string[] }> = [
  { anchor: "a2-when-while-pasado", insert: ["a2-used-to"] },
  { anchor: "a2-will-going-to", insert: ["a2-sustantivos-intenciones-futuras"] },
  { anchor: "a2-modales-consejo-posibilidad", insert: ["a2-preguntas-respuestas", "a2-preguntas-indirectas"] },
  { anchor: "a2-infinitivos-presente-continuo", insert: ["a2-verbos-confusos"] },
];

const A2_SUFFIX = ["a2-audio-aventura-ciudad"] as const;

const A2_OPTIONAL = [
  "a2-so-such",
  "a2-determinantes",
  "a2-propuestas-permisos",
  "a2-practico-compras",
  "a2-practico-cocina",
  "a2-practico-viajes-turismo",
  "a2-practico-partes-cuerpo",
] as const;

const B1_SUFFIX = ["b1-audio-misterios-sin-resolver"] as const;

const B1_OPTIONAL = [
  "b1-expresiones-tiempo-cantidad",
  "b1-emociones-estados-animo",
  "b1-finanzas-personales",
  "b1-estrategias-escucha",
  "b1-conectores-preferencias",
  "b1-solicitudes-pronombres-reflexivos",
  "b1-palabras-interrogativas-propositos",
  "b1-preguntas-negativas-recomendaciones",
  "b1-practico-viajes-negocios",
  "b1-practico-musica-arte",
  "b1-practico-consultas-medicas",
  "b1-practico-nutricion-fitness",
] as const;

const B2_PREFIX = [
  "b2-ingles-practico-conversacional",
  "b2-phrasal-verbs-comunes",
  "b2-conversaciones-trabajo",
  "b2-pronunciacion-intermedia",
  "b2-pasado-perfecto-frases-adverbiales",
] as const;

const B2_SUFFIX = [
  "b2-formacion-palabras-colocaciones",
  "b2-registro-formal-informal",
  "b2-audio-atrapados-tecnologia",
] as const;

const B2_OPTIONAL = [
  "b2-audio-origen-idioma",
  "b2-narracion-integrada",
  "b2-contar-anecdotas",
  "b2-suposiciones-instrucciones",
  "b2-comentarios-opiniones",
  "b2-habitos-aproximaciones",
  "b2-vocabulario-expresiones-intermedio",
  "b2-escritura-intermedia",
  "b2-ortografia-puntuacion",
] as const;

const C1_OPTIONAL = [
  "c1-conectores-contracciones-informales",
  "c1-pronunciacion-avanzada",
  "c1-lenguaje-coloquial-habitual",
  "c1-recursos-conversacionales",
  "c1-argumentos-discusiones",
  "c1-presentaciones-expresion-oral",
  "c1-precision-lexica",
  "c1-escritura-academica-profesional",
  "c1-pragmatica-tono",
  "c1-tiempo-aspecto-punto-vista",
  "c1-modalidad-evidencialidad",
  "c1-significado-implicito-presuposiciones",
  "c1-sesgo-framing-lenguaje-evaluativo",
  "c1-sintesis-multiples-fuentes",
  "c1-explicar-conceptos-complejos",
  "c1-desacuerdo-colaborativo",
  "c1-prosodia-thought-groups-foco-nuclear",
  "c1-entonacion-actitud-cortesia",
  "c1-variacion-ingles-americano",
  "c1-informes-propuestas-resumenes-ejecutivos",
  "c1-humor-ironia",
  "c1-comunicacion-persuasiva-efectiva",
  "c1-vocabulario-expresiones-avanzado",
  "c1-escritura-avanzada",
  "c1-expresiones-idiomaticas-negocios",
  "c1-plus-connotacion-prosodia-semantica",
  "c1-plus-metafora-alusion-lenguaje-figurado",
  "c1-plus-ambiguedad-vaguedad-estrategica",
  "c1-plus-transformacion-registro",
  "c1-plus-voz-persona-estilo",
  "c1-plus-ritmo-retorico-escritura",
  "c1-plus-edicion-precision-concision",
  "c1-plus-lectura-critica-evidencia",
  "c1-plus-evaluacion-reconciliacion-fuentes",
  "c1-plus-mediacion-conflictos",
  "c1-plus-negociacion-alto-riesgo",
  "c1-plus-preguntas-hostiles-interrupciones",
  "c1-plus-produccion-espontanea-extensa",
  "c1-plus-pragmatica-intercultural",
] as const;

type GrammarLevel = "a1" | "a2" | "b1" | "b2" | "c1";

function lesson(slug: string, priority?: CourseInput["p"]): LessonDef {
  const meta = LESSON_BY_SLUG[slug];
  if (!meta) throw new Error(`Missing lesson metadata for slug: ${slug}`);
  return { ...meta, p: priority ?? meta.p, g: slug };
}

function uniquePatternSlugs(level: GrammarLevel): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const pattern of patternsForLevel(level)) {
    if (seen.has(pattern.deckSlug)) continue;
    seen.add(pattern.deckSlug);
    slugs.push(pattern.deckSlug);
  }
  return slugs;
}

function insertAfter(slugs: string[], anchor: string, insert: readonly string[]): string[] {
  const idx = slugs.indexOf(anchor);
  if (idx === -1) return [...slugs, ...insert];
  return [...slugs.slice(0, idx + 1), ...insert, ...slugs.slice(idx + 1)];
}

function mergePatternSpine(
  level: GrammarLevel,
  prefix: readonly string[],
  afterAnchor?: { anchor: string; insert: readonly string[] },
  suffix: readonly string[] = [],
  extrasAfter: readonly string[] = [],
): string[] {
  let spine = uniquePatternSlugs(level);
  if (afterAnchor) {
    spine = insertAfter(spine, afterAnchor.anchor, afterAnchor.insert);
  }
  const extras = extrasAfter.filter((slug) => !spine.includes(slug));
  return [...prefix, ...spine, ...extras, ...suffix];
}

/** Essential + optional lessons for A1 in pedagogical order. */
export function a1CourseInputs(): CourseInput[] {
  const essentialSlugs = mergePatternSpine(
    "a1",
    A1_PREFIX,
    { anchor: "a1-posesivos", insert: A1_AFTER_POSESSIVES },
    A1_PRONUNCIATION,
  );
  return [...essentialSlugs.map((slug) => lesson(slug, 1)), ...A1_OPTIONAL.map((slug) => lesson(slug))];
}

function a2EssentialSlugs(): string[] {
  let spine = uniquePatternSlugs("a2");
  for (const { anchor, insert } of A2_INSERTIONS) {
    spine = insertAfter(spine, anchor, insert);
  }
  return [...spine, ...A2_SUFFIX];
}

/** Essential + optional lessons for A2 in pedagogical order. */
export function a2CourseInputs(): CourseInput[] {
  return [
    ...a2EssentialSlugs().map((slug) => lesson(slug, 1)),
    ...A2_OPTIONAL.map((slug) => lesson(slug)),
  ];
}

/** Essential + optional lessons for B1 in pedagogical order. */
export function b1CourseInputs(): CourseInput[] {
  const essentialSlugs = mergePatternSpine("b1", [], undefined, B1_SUFFIX);
  return [...essentialSlugs.map((slug) => lesson(slug, 1)), ...B1_OPTIONAL.map((slug) => lesson(slug))];
}

/** Essential + optional lessons for B2 in pedagogical order. */
export function b2CourseInputs(): CourseInput[] {
  const essentialSlugs = mergePatternSpine("b2", B2_PREFIX, undefined, B2_SUFFIX);
  return [...essentialSlugs.map((slug) => lesson(slug, 1)), ...B2_OPTIONAL.map((slug) => lesson(slug))];
}

/** Essential + optional lessons for C1 in pedagogical order. */
export function c1CourseInputs(): CourseInput[] {
  const essentialSlugs = uniquePatternSlugs("c1");
  return [...essentialSlugs.map((slug) => lesson(slug, 1)), ...C1_OPTIONAL.map((slug) => lesson(slug))];
}

/** Deck slugs for essential lessons only — used by order tests. */
export function essentialDeckSlugs(level: GrammarLevel): string[] {
  if (level === "a1") {
    return mergePatternSpine(
      "a1",
      A1_PREFIX,
      { anchor: "a1-posesivos", insert: A1_AFTER_POSESSIVES },
      A1_PRONUNCIATION,
    );
  }
  if (level === "a2") {
    return a2EssentialSlugs();
  }
  if (level === "b1") {
    return mergePatternSpine("b1", [], undefined, B1_SUFFIX);
  }
  if (level === "b2") {
    return mergePatternSpine("b2", B2_PREFIX, undefined, B2_SUFFIX);
  }
  if (level === "c1") {
    return uniquePatternSlugs("c1");
  }
  // Exhaustive type: unreachable.
  return uniquePatternSlugs("c1");
}
