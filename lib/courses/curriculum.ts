import { buildLevel } from "./buildCurriculum";
import { a1CourseInputs, a2CourseInputs, b1CourseInputs, b2CourseInputs, c1CourseInputs } from "./level-curriculum-order";
import type { CefrLevelId, CoursePathCurriculum } from "./types";
import {
  targetId,
} from "@/lib/pronunciation/targets/registry";

export const COURSE_PATH_CURRICULUM: CoursePathCurriculum = {
  levels: [
    {
      ...buildLevel(
        "a1",
        "A1",
        "Empezar",
        "Fundamentos A1",
        "20 h",
        a1CourseInputs()
      ),
      realLife: [
        {
          id: "a1-restaurant",
          title: "En el restaurante",
          icon: "utensils",
          phrases: [
            "A table for two, please.",
            "Can I see the menu?",
            "I'd like the chicken, please.",
            "Can we get the bill?",
          ],
          vocab: [
            { word: "menu", meaning: "lista de comidas y precios" },
            { word: "bill", meaning: "la cuenta" },
            { word: "tip", meaning: "propina" },
            { word: "waiter", meaning: "mesero" },
          ],
        },
        {
          id: "a1-introduction",
          title: "Presentarte por primera vez",
          icon: "user",
          phrases: [
            "Nice to meet you, I'm [name].",
            "What do you do?",
            "I'm a [job]. And you?",
            "Where are you from?",
          ],
          vocab: [
            { word: "nice to meet you", meaning: "mucho gusto" },
            { word: "work", meaning: "trabajo / trabajar" },
            { word: "hobby", meaning: "pasatiempo" },
            { word: "from", meaning: "de (origen)" },
          ],
        },
        {
          id: "a1-daily-routine",
          title: "Contar cómo va tu día",
          icon: "sun",
          phrases: [
            "I usually wake up at seven.",
            "I have breakfast at home.",
            "I go to work by bus.",
            "I go to bed early.",
          ],
          vocab: [
            { word: "usually", meaning: "normalmente" },
            { word: "wake up", meaning: "despertar" },
            { word: "routine", meaning: "rutina" },
            { word: "tired", meaning: "cansado/a" },
          ],
        },
      ],
    },
    {
      ...buildLevel(
        "a2",
        "A2",
        "Cotidiano",
        "Base sólida A2",
        "19 h",
        a2CourseInputs()
      ),
      realLife: [
        {
          id: "a2-shopping",
          title: "De compras",
          icon: "shopping",
          phrases: [
            "How much does this cost?",
            "Do you have this in another size?",
            "I'll take it.",
            "Can I pay by card?",
          ],
          vocab: [
            { word: "price", meaning: "precio" },
            { word: "receipt", meaning: "recibo / ticket" },
            { word: "size", meaning: "talla / tamaño" },
            { word: "cash", meaning: "efectivo" },
          ],
        },
        {
          id: "a2-making-plans",
          title: "Quedar con alguien",
          icon: "calendar",
          phrases: [
            "Are you free on Saturday?",
            "What do you want to do?",
            "Let's meet at six.",
            "Sorry, I can't. Maybe next time.",
          ],
          vocab: [
            { word: "free", meaning: "libre / disponible" },
            { word: "plans", meaning: "planes" },
            { word: "meet up", meaning: "quedar / encontrarse" },
            { word: "next time", meaning: "la próxima vez" },
          ],
        },
        {
          id: "a2-directions",
          title: "Pedir indicaciones",
          icon: "map",
          phrases: [
            "Excuse me, where is the bank?",
            "Turn left at the traffic light.",
            "It's next to the supermarket.",
            "How far is it?",
          ],
          vocab: [
            { word: "turn left / right", meaning: "girar a la izquierda / derecha" },
            { word: "straight ahead", meaning: "todo recto" },
            { word: "corner", meaning: "esquina" },
            { word: "far", meaning: "lejos" },
          ],
        },
      ],
    },
    {
      ...buildLevel(
        "b1",
        "B1",
        "Conversación",
        "Inglés en acción B1",
        "28 h",
        b1CourseInputs()
      ),
      realLife: [
        {
          id: "b1-doctor",
          title: "En el médico",
          icon: "stethoscope",
          phrases: [
            "I've had a headache for two days.",
            "It hurts when I move it.",
            "I've been feeling really tired lately.",
            "Should I take anything for it?",
          ],
          vocab: [
            { word: "symptoms", meaning: "síntomas" },
            { word: "prescription", meaning: "receta médica" },
            { word: "follow up", meaning: "cita de seguimiento" },
            { word: "dizzy", meaning: "mareado/a" },
          ],
        },
        {
          id: "b1-storytelling",
          title: "Contar una historia",
          icon: "book",
          phrases: [
            "So what happened was…",
            "I couldn't believe it.",
            "Eventually, everything worked out.",
            "You're not going to believe this, but…",
          ],
          vocab: [
            { word: "suddenly", meaning: "de repente" },
            { word: "eventually", meaning: "finalmente / con el tiempo" },
            { word: "meanwhile", meaning: "mientras tanto" },
            { word: "turn out", meaning: "resultar (que)" },
          ],
        },
        {
          id: "b1-work-email",
          title: "Un correo de trabajo",
          icon: "mail",
          phrases: [
            "I'm writing to follow up on…",
            "Please let me know if you need anything else.",
            "I'd appreciate a response by Friday.",
            "Looking forward to hearing from you.",
          ],
          vocab: [
            { word: "follow up", meaning: "dar seguimiento" },
            { word: "regarding", meaning: "con respecto a" },
            { word: "attached", meaning: "adjunto" },
            { word: "appreciate", meaning: "agradecer / valorar" },
          ],
        },
      ],
    },
    {
      ...buildLevel(
        "b2",
        "B2",
        "Fluidez",
        "Más natural B2",
        "21 h",
        b2CourseInputs()
      ),
      realLife: [
        {
          id: "b2-opinions",
          title: "Dar tu opinión",
          icon: "message",
          phrases: [
            "I'd argue that…",
            "To be honest, I think…",
            "It's a valid point, but…",
            "From my perspective…",
          ],
          vocab: [
            { word: "perspective", meaning: "perspectiva" },
            { word: "valid point", meaning: "punto válido" },
            { word: "nuance", meaning: "matiz" },
            { word: "argue", meaning: "argumentar / sostener" },
          ],
        },
        {
          id: "b2-anecdote",
          title: "Contar una anécdota",
          icon: "smile",
          phrases: [
            "I was just about to leave when…",
            "The thing is, I had no idea that…",
            "Looking back on it now, I realize…",
            "It was one of those moments where…",
          ],
          vocab: [
            { word: "just about to", meaning: "estar a punto de" },
            { word: "looking back", meaning: "mirando atrás" },
            { word: "realize", meaning: "darse cuenta" },
            { word: "end up", meaning: "terminar / acabar haciendo algo" },
          ],
        },
        {
          id: "b2-negotiation",
          title: "Negociar en el trabajo",
          icon: "handshake",
          phrases: [
            "I understand your position, however…",
            "Could we find a middle ground?",
            "I'd be willing to if you could…",
            "Let's revisit this next week.",
          ],
          vocab: [
            { word: "middle ground", meaning: "punto intermedio" },
            { word: "willing", meaning: "dispuesto/a" },
            { word: "revisit", meaning: "retomar / volver a ver" },
            { word: "trade-off", meaning: "concesión mutua" },
          ],
        },
      ],
    },
    {
      ...buildLevel(
        "c1",
        "C1",
        "Matices",
        "Inglés con soltura C1",
        "38 h",
        c1CourseInputs(),
        { optionalLabel: "C1+", optionalTitle: "Dominio avanzado" }
      ),
      realLife: [
        {
          id: "c1-ambiguity",
          title: "Cuando no está claro",
          icon: "fog",
          phrases: [
            "I see where you're coming from, but…",
            "That depends on how you look at it.",
            "There's more to it than meets the eye.",
            "It's a bit of a grey area.",
          ],
          vocab: [
            { word: "implication", meaning: "implicación / consecuencia sobreentendida" },
            { word: "subtext", meaning: "subtexto / lo que no se dice" },
            { word: "grey area", meaning: "zona gris / no claro" },
            { word: "nuanced", meaning: "matizado / con muchos ángulos" },
          ],
        },
        {
          id: "c1-humor",
          title: "Humor e ironía en contexto",
          icon: "theater",
          phrases: [
            "Oh, obviously that went exactly as planned.",
            "Well, that was fun. Said no one ever.",
            "Right, because that makes total sense.",
            "I'm sure that'll go brilliantly.",
          ],
          vocab: [
            { word: "understatement", meaning: "decir menos de lo que se siente (ironía suave)" },
            { word: "sarcasm", meaning: "sarcasmo" },
            { word: "deadpan", meaning: "humor seco / sin expresión" },
            { word: "tongue-in-cheek", meaning: "irónico / no completamente en serio" },
          ],
        },
        {
          id: "c1-persuasion",
          title: "Convencer sin imponer",
          icon: "target",
          phrases: [
            "You might want to consider…",
            "It's worth bearing in mind that…",
            "One could make the case that…",
            "I'd be remiss not to mention…",
          ],
          vocab: [
            { word: "hedging", meaning: "suavizar afirmaciones para sonar menos directo" },
            { word: "softener", meaning: "expresión que mitiga el impacto" },
            { word: "conviction", meaning: "convicción / certeza firme" },
            { word: "remiss", meaning: "negligente / que falla en su deber" },
          ],
        },
      ],
    },
    // No existe un nivel dedicado "c2" en esta app: el contenido se fusiona en C1.
  ],
  electiveTracks: [
    buildLevel(
      "purposes",
      "Tech",
      "Tu sector",
      "Inglés para tu área",
      "14 h",
      [
        { t: "Inglés para programadores", p: 2, g: "tech-ingles-programadores" },
        { t: "Inglés para inteligencia artificial", p: 1, g: "tech-ingles-inteligencia-artificial" },
        { t: "Practicar con ChatGPT", p: 1, g: "tech-ingles-chatgpt" },
        { t: "Inglés para ciberseguridad", p: 0, g: "tech-ingles-ciberseguridad" },
        { t: "Inglés para servicio al cliente", p: 0, g: "tech-ingles-servicio-cliente" },
        { t: "Inglés para marketing", p: 0, g: "tech-ingles-marketing" },
        { t: "Inglés para ventas", p: 0, g: "tech-ingles-ventas" },
        { t: "Inglés para startups", p: 0, g: "tech-ingles-startups" },
        { t: "Preparación TOEFL", p: 0, g: "tech-preparacion-toefl" },
        { t: "Preparación IELTS", p: 0, g: "tech-preparacion-ielts" },
      ],
      { isElective: true, spineIcon: "laptop" }
    ),
    buildLevel(
      "business",
      "Biz",
      "Trabajo",
      "Inglés profesional",
      "10 h",
      [
        { t: "Entrevistas de trabajo", p: 2, g: "biz-entrevistas-trabajo" },
        { t: "Conversaciones en la oficina", p: 1, g: "biz-conversaciones-trabajo" },
        { t: "Inglés para code review", p: 0, g: "biz-code-review" },
        { t: "Crecer en tu carrera", p: 1, g: "biz-desarrollo-profesional" },
        { t: "Vocabulario del día a día laboral", p: 0, g: "biz-vocabulario-trabajo" },
        { t: "Herramientas y tareas del trabajo", p: 0, g: "biz-elementos-trabajo" },
        { t: "Viajes de negocios", p: 0, g: "biz-viajes-negocios" },
        { t: "Inglés para managers", p: 0, g: "biz-negocios-managers" },
        { t: "Modismos de negocios", p: 0, g: "biz-expresiones-idiomaticas-negocios" },
      ],
      { isElective: true, spineIcon: "briefcase" }
    ),
    buildLevel(
      "connected-speech",
      "CS",
      "Puente",
      "Hacia Sound Lab",
      "4 h",
      [
        { t: "Reducciones: gonna, wanna, 'll", p: 2, s: true, g: "cs-reductions", pt: [targetId("connected.reduction.gonna")] },
        { t: "Enlazar sonidos", p: 2, s: true, g: "cs-linking", pt: [targetId("connected.linking")] },
        { t: "Elisión: sonidos que caen", p: 1, s: true, g: "cs-elision", pt: [targetId("connected.elision")] },
        { t: "Asimilación: doncha, didja", p: 1, s: true, g: "cs-assimilation", pt: [targetId("connected.assimilation")] },
      ],
      { isElective: true, spineIcon: "mic" }
    ),
    buildLevel(
      "chunks",
      "Chunks",
      "Conversación",
      "Frases hechas y fluidez",
      "26 h",
      [
        { t: "Chunks para la vida cotidiana", p: 2, g: "chunk-vida-cotidiana" },
        { t: "Hablar de mí con soltura", p: 2, g: "chunk-hablar-de-mi" },
        { t: "Palabras con doble significado", p: 2, g: "chunk-palabras-doble-significado" },
        { t: "Verbos con usos figurados", p: 1, g: "chunk-expresiones-multiuso" },
        { t: "Expresiones clave del día a día (1)", p: 2, g: "chunk-expresiones-clave-1" },
        { t: "Expresiones clave del día a día (2)", p: 2, g: "chunk-expresiones-clave-2" },
        { t: "Básico vs natural: Ánimo y Opiniones", p: 2, g: "chunk-basico-vs-natural-1" },
        { t: "Básico vs natural: Decisiones y Contacto", p: 2, g: "chunk-basico-vs-natural-2" },
        { t: "Básico vs natural: Trabajo y Tiempo", p: 2, g: "chunk-basico-vs-natural-3" },
        { t: "Básico vs natural: Dinero y Retos", p: 2, g: "chunk-basico-vs-natural-4" },
        { t: "Básico vs natural: Reacciones y Cierres", p: 2, g: "chunk-basico-vs-natural-5" },
        { t: "Colocaciones naturales (Collocations)", p: 2, g: "chunk-collocations" },
        { t: "Phrasal Verbs de uso diario", p: 2, g: "chunk-phrasal-verbs" },
        { t: "Modismos y expresiones idiomáticas (Idioms)", p: 2, g: "chunk-idioms" },
        { t: "Social & Small Talk", p: 2, g: "chunk-social-small-talk" },
        { t: "Funciones comunicativas con tacto", p: 2, g: "chunk-language-functions" },
        { t: "Plantillas de oraciones (Sentence Frames)", p: 2, g: "chunk-sentence-frames" },
        { t: "Marcadores del discurso y conectores", p: 2, g: "chunk-discourse-markers" },
        { t: "The Add-On Strategy: Fluidez sin bloqueos", p: 2, g: "the-add-on-strategy" },
        { t: "Chunks de programación", p: 2, g: "chunk-programacion" },
        { t: "Daily standup en inglés", p: 2, g: "chunk-daily-standup" },
        { t: "Chunks de diseño UX y UI", p: 1, g: "chunk-ux-ui" },
      ],
      { isElective: true, spineIcon: "message" }
    ),
    buildLevel(
      "false-friends",
      "FF",
      "Falsos amigos",
      "No te confundas",
      "8 h",
      [
        { t: "Falsos amigos esenciales (A1-A2)", p: 2, g: "ff-esenciales-a1-a2" },
        { t: "Falsos amigos en la vida cotidiana", p: 2, g: "ff-vida-cotidiana" },
        { t: "Falsos amigos en el trabajo y negocios", p: 1, g: "ff-trabajo-negocios" },
        { t: "Comunicación y argumentación", p: 1, g: "ff-comunicacion-argumentacion" },
      ],
      { isElective: true, spineIcon: "book" }
    ),
  ],
  legend: [
    { icon: "sound-lab", description: "Practica también en Sound Lab" },
    { icon: "optional", description: "Contenido opcional" },
  ],
  why: {
    title: "Pronunciación en paralelo",
    paragraphs: [
      "La ruta trabaja la gramática y Sound Lab trabaja la pronunciación. Las lecciones con micrófono te llevan a prácticas del mismo nivel.",
      "Las lecciones opcionales amplían el tema: útiles, pero mejor después de lo esencial.",
    ],
  },
};

export type AssessmentMode = "placement" | "checkpoint";
export type AssessmentQuestionType = "grammar" | "vocabulary" | "reading";

export interface LevelAssessmentContract {
  level: CefrLevelId;
  questionTypes: AssessmentQuestionType[];
  minimumCorrect: number;
  questionCount: number;
  requiredLessonSlugs: string[];
  failureFallback: CefrLevelId;
}

const REQUIRED_ASSESSMENT_SLUGS: Record<CefrLevelId, string[]> = {
  a1: [
    "a1-verbo-to-be",
    "a1-presente-simple",
    "a1-articulos-basicos",
    "a1-there-is-there-are",
    "a1-preguntas-do-does",
    "a1-can-capacidad-permiso",
  ],
  a2: [
    "a2-experiencias-pasadas-planes",
    "a2-cuantificadores-esenciales",
    "a2-used-to",
    "a2-will-going-to",
    "a2-presente-perfecto-experiencias",
    "a2-preguntas-indirectas",
  ],
  b1: [
    "b1-presente-perfecto-continuo",
    "b1-segundo-condicional",
    "b1-estilo-indirecto",
    "b1-gerundios-infinitivos",
    "b1-modales-deduccion",
    "b1-conectores-discurso",
  ],
  b2: [
    "b2-tercer-condicional",
    "b2-inversion-enfasis",
    "b2-modales-pasado",
    "b2-clausulas-participio",
    "b2-formacion-palabras-colocaciones",
    "b2-registro-formal-informal",
  ],
  c1: [
    "c1-hedging-matices",
    "c1-cohesion-discurso",
    "c1-enfasis-inversion-avanzada",
    "c1-nominalizacion",
    "c1-clausulas-reducidas-participiales",
    "c1-elipsis-sustitucion-referencia",
  ],
};

export const LEVEL_ASSESSMENT_CONTRACTS: Record<CefrLevelId, LevelAssessmentContract> = {
  a1: { level: "a1", questionTypes: ["grammar", "vocabulary"], minimumCorrect: 4, questionCount: 6, requiredLessonSlugs: REQUIRED_ASSESSMENT_SLUGS.a1, failureFallback: "a1" },
  a2: { level: "a2", questionTypes: ["grammar", "vocabulary", "reading"], minimumCorrect: 5, questionCount: 6, requiredLessonSlugs: REQUIRED_ASSESSMENT_SLUGS.a2, failureFallback: "a1" },
  b1: { level: "b1", questionTypes: ["grammar", "vocabulary", "reading"], minimumCorrect: 5, questionCount: 6, requiredLessonSlugs: REQUIRED_ASSESSMENT_SLUGS.b1, failureFallback: "a2" },
  b2: { level: "b2", questionTypes: ["grammar", "vocabulary", "reading"], minimumCorrect: 5, questionCount: 6, requiredLessonSlugs: REQUIRED_ASSESSMENT_SLUGS.b2, failureFallback: "b1" },
  c1: { level: "c1", questionTypes: ["grammar", "vocabulary", "reading"], minimumCorrect: 5, questionCount: 6, requiredLessonSlugs: REQUIRED_ASSESSMENT_SLUGS.c1, failureFallback: "b2" },
};

export interface AssessmentSection {
  level: CefrLevelId;
  passThreshold: number;
  fallbackLevel: CefrLevelId;
  items: Array<{ lessonSlug: string; questionType: AssessmentQuestionType }>;
}

const CEFR_ORDER: CefrLevelId[] = ["a1", "a2", "b1", "b2", "c1"];

export function buildAssessment(
  mode: AssessmentMode,
  checkpointLevel?: CefrLevelId,
): AssessmentSection[] {
  const levels = mode === "placement"
    ? CEFR_ORDER
    : [checkpointLevel ?? "a1"];

  return levels.map((level) => {
    const contract = LEVEL_ASSESSMENT_CONTRACTS[level];
    return {
      level,
      passThreshold: contract.minimumCorrect,
      fallbackLevel: contract.failureFallback,
      items: contract.requiredLessonSlugs.map((lessonSlug, index) => ({
        lessonSlug,
        questionType: contract.questionTypes[index % contract.questionTypes.length],
      })),
    };
  });
}
