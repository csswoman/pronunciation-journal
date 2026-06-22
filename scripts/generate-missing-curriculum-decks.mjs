import fs from "node:fs";
import path from "node:path";

const outputDir = path.join(process.cwd(), "public", "grammar-decks");

const topics = [
  ["a1-articulos-basicos", "A1", "Artículos básicos", "a, an y the", [
    ["a", "antes de sonido consonántico: a book, a university"],
    ["an", "antes de sonido vocálico: an apple, an hour"],
    ["the", "para algo específico o ya conocido"],
    ["sin artículo", "para plurales y conceptos generales"],
  ], ["I have a dog.", "She is an engineer.", "The dog is in the garden."],
  ["I have an car.", "I have a car."], ["a university", "an university", 0]],
  ["a1-there-is-there-are", "A1", "Existencia y lugar", "there is y there are", [
    ["there is", "una cosa: There is a table."],
    ["there are", "varias cosas: There are two chairs."],
    ["is there...?", "pregunta singular"],
    ["are there...?", "pregunta plural"],
  ], ["There is some milk.", "There are three windows.", "There isn't a bank nearby."],
  ["There is two shops.", "There are two shops."], ["There ___ two parks.", "is", "are", 1]],
  ["a1-posesivos", "A1", "Posesión", "adjetivos y pronombres posesivos", [
    ["my / mine", "my book / The book is mine"],
    ["your / yours", "your coat / The coat is yours"],
    ["his / her / its", "posesión de él, ella o una cosa"],
    ["our / their", "posesión de nosotros o ellos"],
  ], ["This is my phone.", "That bag is hers.", "Their house is new."],
  ["This is the book of me.", "This is my book."], ["The keys are ___.", "my", "mine", 1]],
  ["a1-preguntas-do-does", "A1", "Preguntas en presente", "do y does", [
    ["Do + I/you/we/they", "Do you work here?"],
    ["Does + he/she/it", "Does she live nearby?"],
    ["verbo base", "después de does no lleva -s"],
    ["respuestas cortas", "Yes, I do. / No, she doesn't."],
  ], ["Do they speak English?", "Does he drive?", "Where do you live?"],
  ["Does she works here?", "Does she work here?"], ["___ he like coffee?", "Do", "Does", 1]],
  ["a1-can-capacidad-permiso", "A1", "Capacidad y permiso", "can y can't", [
    ["can + verbo base", "I can swim."],
    ["can't + verbo base", "She can't drive."],
    ["Can...?", "Can you help me?"],
    ["sin to ni -s", "He can play, no can plays"],
  ], ["I can cook.", "Can I sit here?", "We can't come today."],
  ["She can to dance.", "She can dance."], ["He can ___ English.", "speaks", "speak", 1]],
  ["a1-preposiciones-lugar-tiempo", "A1", "Lugar y tiempo", "preposiciones básicas", [
    ["in", "dentro; meses, años y partes del día"],
    ["on", "sobre una superficie; días y fechas"],
    ["at", "punto exacto; horas y lugares concretos"],
    ["next to / between", "posición relativa"],
  ], ["The keys are on the table.", "We meet at six.", "My birthday is in May."],
  ["See you in Monday.", "See you on Monday."], ["The class starts ___ 9.", "in", "at", 1]],
  ["a1-plurales", "A1", "Sustantivos", "plurales regulares e irregulares", [
    ["+ s", "book → books"],
    ["+ es", "bus → buses; box → boxes"],
    ["y → ies", "city → cities"],
    ["irregulares", "child → children; person → people"],
  ], ["two books", "three children", "five boxes"],
  ["two childs", "two children"], ["One person, two ___.", "persons", "people", 1]],

  ["a2-cuantificadores-esenciales", "A2", "Cantidad", "some, any, much y many", [
    ["some", "afirmaciones y ofrecimientos"],
    ["any", "preguntas y negativas"],
    ["many", "sustantivos contables"],
    ["much", "sustantivos incontables"],
  ], ["I have some questions.", "We don't have any milk.", "How many people came?"],
  ["How much apples?", "How many apples?"], ["There isn't ___ water.", "some", "any", 1]],
  ["a2-used-to", "A2", "Hábitos pasados", "used to", [
    ["used to + verbo", "hábito o estado que ya cambió"],
    ["didn't use to", "forma negativa"],
    ["Did... use to?", "forma interrogativa"],
    ["no acción única", "para eventos puntuales usa pasado simple"],
  ], ["I used to live in Lima.", "She didn't use to cook.", "Did you use to play tennis?"],
  ["I use to live there.", "I used to live there."], ["Did he ___ smoke?", "used to", "use to", 1]],
  ["a2-will-going-to", "A2", "Planes y predicciones", "will o going to", [
    ["going to", "plan previo o evidencia visible"],
    ["will", "decisión inmediata, promesa o predicción"],
    ["present continuous", "plan ya acordado"],
    ["probably / definitely", "matizan predicciones"],
  ], ["I'm going to study tonight.", "I'll answer the phone.", "Look! It's going to rain."],
  ["I will going to travel.", "I'm going to travel."], ["The phone is ringing. I ___ answer it.", "will", "am going to", 0]],
  ["a2-presente-perfecto-experiencias", "A2", "Experiencias", "presente perfecto", [
    ["have/has + participio", "I have visited Cusco."],
    ["ever / never", "experiencias hasta ahora"],
    ["just / already / yet", "acciones recientes"],
    ["sin tiempo terminado", "no con yesterday o last year"],
  ], ["Have you ever flown?", "She has never tried sushi.", "We haven't finished yet."],
  ["I have seen him yesterday.", "I saw him yesterday."], ["She has ___ arrived.", "just", "yesterday", 0]],
  ["a2-modales-consejo-posibilidad", "A2", "Consejo y obligación", "should, could y must", [
    ["should", "consejo o expectativa"],
    ["could", "posibilidad o sugerencia"],
    ["must", "obligación fuerte"],
    ["mustn't", "prohibición, no ausencia de obligación"],
  ], ["You should rest.", "We could take a taxi.", "You must wear a seat belt."],
  ["You mustn't come if you're busy.", "You don't have to come if you're busy."], ["For advice, use ___.", "should", "mustn't", 0]],
  ["a2-preguntas-indirectas", "A2", "Preguntar con cortesía", "preguntas indirectas", [
    ["inicio cortés", "Could you tell me...?"],
    ["orden afirmativo", "where the station is"],
    ["sin do/does", "Do you know what time it starts?"],
    ["yes/no con if", "Do you know if it is open?"],
  ], ["Could you tell me where she lives?", "Do you know what this means?", "Can you tell me if they are ready?"],
  ["Do you know where is the bank?", "Do you know where the bank is?"], ["Could you tell me where ___?", "is it", "it is", 1]],

  ["b1-presente-perfecto-continuo", "B1", "Duración hasta ahora", "presente perfecto continuo", [
    ["have/has been + -ing", "acción que continúa o acaba de terminar"],
    ["for", "duración: for two hours"],
    ["since", "punto inicial: since Monday"],
    ["resultado visible", "She's been running; she's tired."],
  ], ["I've been studying all morning.", "How long have you been waiting?", "It has been raining."],
  ["I am studying since Monday.", "I've been studying since Monday."], ["They have been ___ for hours.", "work", "working", 1]],
  ["b1-segundo-condicional", "B1", "Situaciones hipotéticas", "segundo condicional", [
    ["if + pasado", "condición imaginaria o improbable"],
    ["would + verbo", "resultado hipotético"],
    ["were", "forma recomendada con I/he/she"],
    ["could / might", "resultados alternativos"],
  ], ["If I had time, I'd travel.", "If I were you, I'd apologize.", "We could move if prices were lower."],
  ["If I would have time, I traveled.", "If I had time, I would travel."], ["If she knew, she ___ help.", "will", "would", 1]],
  ["b1-estilo-indirecto", "B1", "Contar lo que alguien dijo", "estilo indirecto", [
    ["say / tell", "say something; tell someone"],
    ["backshift", "present → past; will → would"],
    ["pronombres", "cambian según quién cuenta"],
    ["tiempo y lugar", "today → that day; here → there"],
  ], ["She said she was tired.", "He told me he would call.", "They said they had finished."],
  ["She told that she was busy.", "She said that she was busy."], ["He said, 'I am ready.' → He said he ___ ready.", "is", "was", 1]],
  ["b1-gerundios-infinitivos", "B1", "Patrones verbales", "gerundios e infinitivos", [
    ["enjoy/avoid + -ing", "I enjoy reading."],
    ["want/need + to", "We need to leave."],
    ["preposición + -ing", "I'm interested in learning."],
    ["cambio de sentido", "stop smoking ≠ stop to smoke"],
  ], ["She decided to stay.", "He avoids driving.", "Thank you for helping."],
  ["I enjoy to read.", "I enjoy reading."], ["They promised ___ early.", "coming", "to come", 1]],
  ["b1-habitos-pasados", "B1", "Rutinas del pasado", "used to y would", [
    ["used to", "hábitos y estados pasados"],
    ["would", "acciones repetidas, no estados"],
    ["past simple", "eventos concretos o secuencia"],
    ["marco temporal", "When I was a child..."],
  ], ["I used to be shy.", "Every summer, we'd visit my aunt.", "I moved here in 2020."],
  ["I would be shy as a child.", "I used to be shy as a child."], ["For a past state, choose ___.", "would", "used to", 1]],
  ["b1-modales-deduccion", "B1", "Conclusiones y probabilidad", "modales de deducción", [
    ["must", "conclusión muy probable"],
    ["might / may / could", "posibilidad"],
    ["can't", "conclusión imposible"],
    ["be + -ing", "deducción sobre una acción actual"],
  ], ["She must be tired.", "They might be at home.", "That can't be true."],
  ["He mustn't be home; the lights are off.", "He can't be home; the lights are off."], ["I'm not sure. It ___ be correct.", "must", "might", 1]],
  ["b1-conectores-discurso", "B1", "Organizar ideas", "conectores del discurso", [
    ["adición", "also, in addition, moreover"],
    ["contraste", "however, although, whereas"],
    ["causa y resultado", "because, therefore, as a result"],
    ["ejemplificación", "for example, for instance"],
  ], ["It was expensive; however, I bought it.", "Although it rained, we went out.", "Therefore, we changed the plan."],
  ["Although it was late, but we stayed.", "Although it was late, we stayed."], ["Choose a contrast connector.", "therefore", "however", 1]],

  ["b2-tercer-condicional", "B2", "Pasado hipotético", "tercer condicional", [
    ["if + past perfect", "condición pasada imposible de cambiar"],
    ["would have + participio", "resultado alternativo"],
    ["could/might have", "posibilidad o capacidad alternativa"],
    ["inversión formal", "Had I known, I would have..."],
  ], ["If I'd known, I'd have called.", "She might have passed if she'd studied.", "Had we left earlier, we'd have arrived on time."],
  ["If I would have known, I called.", "If I had known, I would have called."], ["If they had left, they ___ arrived.", "would have", "will have", 0]],
  ["b2-inversion-enfasis", "B2", "Énfasis formal", "inversión", [
    ["never / rarely", "Never have I seen..."],
    ["not only", "Not only did she win..."],
    ["only then", "Only then did I understand."],
    ["no sooner / scarcely", "No sooner had... than..."],
  ], ["Rarely do we see this.", "Not only did he apologize, but he also paid.", "Only later did I realize the truth."],
  ["Never I have seen that.", "Never have I seen that."], ["Rarely ___ such care.", "we see", "do we see", 1]],
  ["b2-clausulas-participio", "B2", "Condensar información", "cláusulas de participio", [
    ["-ing", "acciones simultáneas o causa activa"],
    ["past participle", "sentido pasivo"],
    ["having + participle", "acción anterior"],
    ["mismo sujeto", "el sujeto implícito debe coincidir"],
  ], ["Walking home, I called Ana.", "Built in 1920, the house needs repairs.", "Having finished, she left."],
  ["Driving to work, the rain started.", "Driving to work, I saw the rain start."], ["___ the report, he sent it.", "Having finished", "Finished", 0]],
  ["b2-formacion-palabras-colocaciones", "B2", "Precisión léxica", "formación de palabras y colocaciones", [
    ["prefijos", "un-, dis-, mis-, over-"],
    ["sufijos", "-tion, -ment, -able, -ly"],
    ["familias", "decide → decision → decisive"],
    ["colocaciones", "make a decision; heavy rain"],
  ], ["The decision was unexpected.", "She gave a convincing explanation.", "We made significant progress."],
  ["We did a decision.", "We made a decision."], ["Choose the natural collocation.", "strong rain", "heavy rain", 1]],
  ["b2-registro-formal-informal", "B2", "Adaptar el tono", "registro formal e informal", [
    ["formal", "request, inform, assist, purchase"],
    ["neutral", "ask, tell, help, buy"],
    ["contracciones", "comunes al hablar; limitadas en textos formales"],
    ["mitigación", "Could you possibly...? / I was wondering if..."],
  ], ["I am writing to request information.", "Can you give me a hand?", "We regret to inform you that..."],
  ["Send me the details ASAP. (correo formal)", "Could you please send me the details?"], ["For a formal email, choose ___.", "I want info.", "I am writing to enquire.", 1]],

  ["c1-hedging-matices", "C1", "Matizar afirmaciones", "hedging", [
    ["verbos", "seem, appear, tend to, suggest"],
    ["adverbios", "arguably, apparently, relatively"],
    ["cuantificadores", "to some extent, in many cases"],
    ["distancia", "It could be argued that..."],
  ], ["This appears to be effective.", "The policy may have contributed.", "This is arguably the main factor."],
  ["This proves the policy always works.", "This suggests the policy may work."], ["Which is more cautious?", "This causes X.", "This may contribute to X.", 1]],
  ["c1-precision-lexica", "C1", "Elegir la palabra exacta", "precisión léxica", [
    ["intensidad", "annoyed, frustrated, furious"],
    ["alcance", "issue, challenge, obstacle, crisis"],
    ["verbos específicos", "say → claim, concede, imply"],
    ["colocación", "pose a threat; draw a distinction"],
  ], ["The evidence strongly suggests...", "This poses a substantial risk.", "She drew a useful distinction."],
  ["The policy makes a risk.", "The policy poses a risk."], ["Choose the precise collocation.", "do a distinction", "draw a distinction", 1]],
  ["c1-cohesion-discurso", "C1", "Guiar al lector", "cohesión del discurso", [
    ["referencia", "this trend, such measures, the former"],
    ["progresión", "tema conocido → información nueva"],
    ["conectores", "nevertheless, consequently, by contrast"],
    ["sustitución", "do so, one, those"],
  ], ["This approach is costly. Nevertheless, it is effective.", "The former is cheaper; the latter is safer.", "Many chose to leave, and others did so later."],
  ["The idea is good. The idea is expensive. The idea may fail.", "The idea is promising; nevertheless, its cost may limit it."], ["'The former' refers to ___.", "the first of two", "the last of many", 0]],
  ["c1-escritura-academica-profesional", "C1", "Escritura de alto nivel", "registro académico y profesional", [
    ["tesis clara", "delimita la postura y el alcance"],
    ["párrafo", "idea, evidencia, análisis y vínculo"],
    ["cautela", "evita generalizaciones absolutas"],
    ["síntesis", "integra fuentes, no solo las enumera"],
  ], ["This report evaluates three alternatives.", "The findings indicate a gradual improvement.", "Taken together, these results suggest..." ],
  ["A lot of people think this is bad.", "A substantial proportion of respondents viewed it negatively."], ["A strong paragraph needs ___.", "one clear controlling idea", "several unrelated ideas", 0]],
  ["c1-pragmatica-tono", "C1", "Intención y relación", "pragmática, tono y cortesía", [
    ["indirectness", "Could we revisit that point?"],
    ["face-saving", "I may not have explained that clearly."],
    ["implicature", "That's one way of looking at it."],
    ["entonación y contexto", "la misma frase puede apoyar o criticar"],
  ], ["You might want to check that figure.", "I'm not entirely convinced.", "Perhaps we could consider another option."],
  ["You're wrong.", "I see it somewhat differently."], ["Which sounds diplomatically uncertain?", "That is false.", "I'm not entirely convinced.", 1]],
  ["c1-enfasis-inversion-avanzada", "C1", "Control retórico", "énfasis e inversión avanzada", [
    ["cleft sentences", "What matters is... / It was X that..."],
    ["fronting", "This point, we cannot ignore."],
    ["inversión negativa", "Under no circumstances should..."],
    ["condicional sin if", "Were it not for... / Had they known..."],
  ], ["What I need is more time.", "Under no circumstances should you respond.", "Were it not for her help, we'd have failed."],
  ["Under no circumstances you should leave.", "Under no circumstances should you leave."], ["___ it not for the delay, we'd be finished.", "Was", "Were", 1]],
];

function cardsFor(slug, title, emphasis, rules, examples, mistake) {
  const [bad, good] = mistake;
  return [
    {
      id: `${slug}-concept`,
      tag: "Idea central",
      title: `${title}: qué expresa`,
      lede: `Esta lección te ayuda a usar ${emphasis} con precisión y sin traducir palabra por palabra.`,
      blocks: [{ type: "rules", rows: rules.map(([key, value]) => ({ key, value, highlights: [key] })) }],
      tip: { label: "Objetivo:", body: `reconocer la intención y elegir correctamente ${emphasis} en situaciones reales.` },
    },
    {
      id: `${slug}-form`,
      tag: "Forma",
      title: "La estructura que debes recordar",
      lede: "Observa la forma completa antes de producir tus propios ejemplos.",
      blocks: [{ type: "rules", rows: rules.slice(0, 3).map(([key, value]) => ({ key, value })) }],
    },
    {
      id: `${slug}-examples`,
      tag: "En contexto",
      title: "Ejemplos naturales",
      lede: "Lee cada ejemplo como una unidad completa y fíjate en la posición de las palabras.",
      blocks: [{ type: "rules", rows: examples.map((value, index) => ({ key: `Ejemplo ${index + 1}`, value })) }],
    },
    {
      id: `${slug}-contrast`,
      tag: "Contraste",
      title: "Cómo cambia el significado",
      lede: "La elección depende de la intención, la cantidad, el tiempo o el registro.",
      blocks: [{
        type: "contrast",
        columns: [
          { label: rules[0][0], rule: rules[0][1], examples: [examples[0]] },
          { label: rules[1][0], rule: rules[1][1], examples: [examples[1]] },
        ],
      }],
    },
    {
      id: `${slug}-mistakes`,
      tag: "Error frecuente",
      title: "Evita este calco",
      lede: "Compara la versión incorrecta con una forma natural y gramatical.",
      blocks: [{ type: "pairs", lines: [
        { variant: "bad", text: bad },
        { variant: "good", text: good, note: "forma recomendada" },
      ] }],
    },
    {
      id: `${slug}-reference`,
      tag: "Referencia rápida",
      title: "Decisión en cuatro pasos",
      lede: "Usa esta lista para comprobar tu frase antes de continuar.",
      blocks: [{ type: "rules", rows: [
        { key: "1. Intención", value: "¿Qué quieres expresar exactamente?" },
        { key: "2. Estructura", value: `Elige la forma adecuada de ${emphasis}.` },
        { key: "3. Concordancia", value: "Revisa sujeto, verbo, número y tiempo." },
        { key: "4. Naturalidad", value: "Lee la frase completa y evita traducir literalmente." },
      ] }],
      tip: { label: "Práctica:", body: "crea una frase personal con cada patrón y léela en voz alta." },
    },
  ];
}

for (const [slug, level, title, emphasis, rules, examples, mistake, quiz] of topics) {
  const [question, optionA, optionB, answer] = quiz.length === 3
    ? [`Elige la opción correcta para ${emphasis}.`, quiz[0], quiz[1], quiz[2]]
    : quiz;
  const deck = {
    meta: {
      eyebrow: `${level} · ${title}`,
      title,
      titleEmphasis: emphasis,
      goal: `Ya puedes usar ${emphasis} en ejemplos claros y adecuados al contexto.`,
    },
    cards: cardsFor(slug, title, emphasis, rules, examples, mistake),
    quiz: [
      {
        q: question,
        options: [optionA, optionB],
        answer,
        explain: `La respuesta correcta aplica la regla central de ${emphasis}.`,
      },
      {
        q: `¿Cuál de estas frases es correcta?`,
        options: [mistake[0], mistake[1]],
        answer: 1,
        explain: "La segunda opción usa la estructura y el orden correctos.",
      },
      {
        q: `¿Qué conviene revisar al usar ${emphasis}?`,
        options: ["La intención, la estructura y el contexto.", "Solo la traducción literal al español."],
        answer: 0,
        explain: "Una frase natural depende del significado, la forma y el contexto, no de traducir palabra por palabra.",
      },
    ],
  };
  fs.writeFileSync(path.join(outputDir, `${slug}.json`), `${JSON.stringify(deck, null, 2)}\n`);
}

console.log(`Generated ${topics.length} curriculum decks.`);
