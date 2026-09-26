export interface PhraseMeta {
  spanish: string;
  phoneticTipTitle?: string;
  phoneticTipBody?: string;
  focusWords?: string[];
}

export const PHRASE_METADATA: Record<string, PhraseMeta> = {
  "Nothing worthwhile ever comes without effort": {
    spanish: "Nada que valga la pena llega sin esfuerzo",
    phoneticTipTitle: "Ojo con la th",
    phoneticTipBody: "Suena /θ/ en worthwhile y /ð/ en without: la punta de la lengua va entre los dientes.",
    focusWords: ["worthwhile", "without"],
  },
  "I would appreciate the opportunity": {
    spanish: "Agradecería mucho la oportunidad",
    phoneticTipTitle: "Sonido /ʃ/ y acentuación",
    phoneticTipBody: "En appreciate suena /əˈpriːʃieɪt/: labios suaves hacia adelante sin sonido 's' duro.",
    focusWords: ["appreciate", "opportunity"],
  },
  "Could you please repeat that?": {
    spanish: "¿Podrías repetir eso, por favor?",
    phoneticTipTitle: "Vocal larga /iː/ y /ð/",
    phoneticTipBody: "En repeat alarga la /iː/ y en that haz vibrar la lengua entre los dientes.",
    focusWords: ["repeat", "that"],
  },
  "I'm looking forward to working with you": {
    spanish: "Tengo muchas ganas de trabajar contigo",
    phoneticTipTitle: "Sonido de la /w/",
    phoneticTipBody: "Redondea los labios antes de empezar en working y forward.",
    focusWords: ["forward", "working"],
  },
  "That sounds like a great idea": {
    spanish: "Esa suena como una gran idea",
    phoneticTipTitle: "Diptongo en idea",
    phoneticTipBody: "En idea pronuncia /aɪˈdiːə/ con dos vocales claras y acento en la segunda sílaba.",
    focusWords: ["sounds", "idea"],
  },
  "I completely understand your point": {
    spanish: "Entiendo completamente tu punto",
    phoneticTipTitle: "Ritmo y reducción",
    phoneticTipBody: "En understand el acento principal cae en la última sílaba /ˌʌndərˈstænd/.",
    focusWords: ["completely", "understand"],
  },
  "Would you mind helping me with this?": {
    spanish: "¿Te importaría ayudarme con esto?",
    phoneticTipTitle: "Unión de sonidos",
    phoneticTipBody: "Would you se suele enlazar de forma fluida como /wʊdʒuː/.",
    focusWords: ["mind", "helping"],
  },
  "Let me think about that for a moment": {
    spanish: "Déjame pensar en eso por un momento",
    phoneticTipTitle: "Contraste /θ/ vs /ð/",
    phoneticTipBody: "think empieza sorda /θ/ (solo aire) y that empieza sonora /ð/ (con vibración).",
    focusWords: ["think", "moment"],
  },
  "I really enjoyed our conversation today": {
    spanish: "Realmente disfruté nuestra conversación hoy",
    phoneticTipTitle: "Sonido /dʒ/ y /r/",
    phoneticTipBody: "En enjoyed la 'j' suena como /dʒ/ con la lengua en el paladar.",
    focusWords: ["really", "enjoyed"],
  },
  "The weather has been wonderful lately": {
    spanish: "El clima ha estado maravilloso últimamente",
    phoneticTipTitle: "Sonido /ð/ en weather",
    phoneticTipBody: "La th de weather es suave y vibra entre los dientes.",
    focusWords: ["weather", "wonderful"],
  },
  "She works really hard every single day": {
    spanish: "Ella trabaja muy duro todos los días",
    phoneticTipTitle: "Sonido /ʃ/ y vocal /ɜːr/",
    phoneticTipBody: "En works la vocal /ɜːr/ requiere doblar levemente la lengua hacia atrás.",
    focusWords: ["works", "really"],
  },
  "They were thrilled with the results": {
    spanish: "Estaban encantados con los resultados",
    phoneticTipTitle: "Combinación /θr/ en thrilled",
    phoneticTipBody: "Pasa de la punta de la lengua entre los dientes directamente a la /r/.",
    focusWords: ["thrilled", "results"],
  },
  "We should probably leave a little earlier": {
    spanish: "Probablemente deberíamos salir un poco antes",
    phoneticTipTitle: "La 'l' oscura en little",
    phoneticTipBody: "La segunda 'l' de little se apoya en la parte posterior del paladar.",
    focusWords: ["probably", "earlier"],
  },
  "I thought the presentation went really well": {
    spanish: "Pensé que la presentación salió muy bien",
    phoneticTipTitle: "Vocal /ɔː/ en thought",
    phoneticTipBody: "thought se pronuncia /θɔːt/, sin pronunciar las letras 'gh'.",
    focusWords: ["thought", "presentation"],
  },
  "He finally finished the project last Thursday": {
    spanish: "Finalmente terminó el proyecto el jueves pasado",
    phoneticTipTitle: "Terminación -ed en finished",
    phoneticTipBody: "En finished la terminación suena como /t/: /ˈfɪnɪʃt/.",
    focusWords: ["finished", "Thursday"],
  },
  "This is exactly what I was looking for": {
    spanish: "Esto es exactamente lo que estaba buscando",
    phoneticTipTitle: "Sonido /gz/ en exactly",
    phoneticTipBody: "En exactly la 'x' suena /ɡz/: /ɪɡˈzæktli/.",
    focusWords: ["exactly", "looking"],
  },
  "I appreciate you taking the time to explain": {
    spanish: "Agradezco que te tomes el tiempo de explicar",
    phoneticTipTitle: "Diptongo /eɪ/ en explain",
    phoneticTipBody: "En explain alarga la vocal /eɪ/ con claridad al final.",
    focusWords: ["appreciate", "explain"],
  },
  "Would you rather meet in the morning?": {
    spanish: "¿Preferirías reunirte por la mañana?",
    phoneticTipTitle: "Sonido /ð/ en rather",
    phoneticTipBody: "rather lleva /ð/ sonora en el medio: /ˈræðər/.",
    focusWords: ["rather", "morning"],
  },
  "The third Thursday of the month works for me": {
    spanish: "El tercer jueves del mes me viene bien",
    phoneticTipTitle: "Práctica intensiva de /θ/",
    phoneticTipBody: "third, Thursday y month llevan todas la /θ/ sorda entre los dientes.",
    focusWords: ["third", "Thursday"],
  },
  "I've been practicing every day this week": {
    spanish: "He estado practicando todos los días esta semana",
    phoneticTipTitle: "Contracción I've",
    phoneticTipBody: "Une I con la /v/ suave apoyando dientes superiores en el labio inferior.",
    focusWords: ["practicing", "week"],
  },
};

export function getPhraseMetadata(phrase: string): PhraseMeta {
  const match = PHRASE_METADATA[phrase.trim()];
  if (match) return match;

  return {
    spanish: "Practica tu pronunciación en inglés",
    phoneticTipTitle: "Consejo fonético",
    phoneticTipBody: "Escucha el ritmo natural de la frase y enfatiza las palabras clave con claridad.",
    focusWords: [],
  };
}
