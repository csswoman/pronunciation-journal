const CHUNK_CATEGORY_LABELS: Record<string, string> = {
  "breaking the ice": "Romper el hielo",
  "small talk & weather": "Charla cotidiana",
  "talking about your routine": "Hablar de tu rutina",
  "opinions & reactions": "Opiniones y reacciones",
  "agreeing & disagreeing": "Acuerdo y desacuerdo",
  "giving reasons & explanations": "Razones y explicaciones",
  "asking for & offering help": "Pedir y ofrecer ayuda",
  "asking for clarification": "Pedir aclaraciones",
  "common present questions": "Preguntas en presente",
  "work & daily life": "Trabajo y vida diaria",
  "food & preferences": "Comida y preferencias",
  "useful connectors": "Conectores útiles",
  "useful connector": "Conector útil",
  "talking about experiences": "Hablar de experiencias",
  "narrating past events": "Narrar el pasado",
  "narrating past event": "Narrar el pasado",
  "common past questions": "Preguntas en pasado",
  "apologizing & explaining": "Disculpas y explicaciones",
  "plans & intentions": "Planes e intenciones",
  "predictions & hopes": "Predicciones y esperanzas",
  "making plans with others": "Planes con otros",
  "common future questions": "Preguntas en futuro",
  "closing a conversation": "Cerrar una conversación",
  "common idioms": "Modismos comunes",
  "common idiom": "Modismo común",
  "daily expressions": "Expresiones cotidianas",
  "daily expression": "Expresión cotidiana",
  "business": "Negocios",
  "conversation": "Conversación",
  "phrasal verbs": "Phrasal verbs",
  "phrasal verb": "Phrasal verb",
};

export function formatChunkCategory(cat?: string): string | null {
  if (!cat) return null;
  const key = cat.toLowerCase().trim();
  return CHUNK_CATEGORY_LABELS[key] ?? cat;
}
