import type { DeckSpec } from "./generate-grammar-pattern-decks";

export const A2_DECK_SPECS: DeckSpec[] = [
  {
    slug: "a2-pasado-to-be",
    eyebrow: "A2 · Pasado simple",
    title: "To be en",
    emphasis: "pasado (was / were)",
    goal: "Expresa estados, situaciones y ubicaciones pasadas utilizando was y were de forma precisa.",
    conceptRows: [
      { key: "was", value: "I / he / she / it was tired yesterday · Estaba / era", highlights: ["was"] },
      { key: "were", value: "you / we / they were at home last night · Estabas / éramos / estaban", highlights: ["were"] },
      { key: "Forma negativa", value: "wasn't (was not) / weren't (were not)", highlights: ["wasn't", "weren't"] },
      { key: "Uso principal", value: "Describe cómo eran o dónde estaban las personas o cosas en el pasado", highlights: ["Describe"] },
    ],
    structureRows: [
      { key: "Afirmativa", value: "Sujeto + was/were + Complemento · She was in London in 2022.", highlights: ["She was"] },
      { key: "Negativa", value: "Sujeto + wasn't/weren't + Complemento · They weren't hungry after lunch.", highlights: ["They weren't"] },
      { key: "Interrogativa", value: "Was/Were + Sujeto + Complemento? · Were you happy with the results?", highlights: ["Were you"] },
    ],
    contextExamples: [
      { key: "Clima y lugar", value: "It was very sunny during our weekend trip to the beach." },
      { key: "Estado emocional", value: "I was nervous before the interview, but my team was calm." },
      { key: "Ubicación pasada", value: "Where were you at 8 o'clock yesterday evening?" },
      { key: "Eventos pasados", value: "The concert wasn't expensive, so it was completely crowded." },
    ],
    contrastColumns: [
      {
        label: "was (Singular: I, he, she, it)",
        rule: "Acompaña a la primera y tercera persona del singular",
        examples: ["He was my English teacher last year.", "It was cold yesterday."],
      },
      {
        label: "were (Plural y You: you, we, they)",
        rule: "Acompaña a la segunda persona y a todos los sujetos plurales",
        examples: ["We were late for the train.", "They were very friendly."],
      },
    ],
    quickReferenceRows: [
      { key: "1. Identifica el sujeto", value: "I, he, she, it → was | you, we, they → were." },
      { key: "2. Negaciones", value: "Usa wasn't / weren't sin añadir didn't." },
      { key: "3. Preguntas", value: "Invierte el orden: Was/Were va antes del sujeto." },
      { key: "4. Sin verbo principal", value: "Was/were funciona como verbo principal (no necesita aux. did)." },
    ],
    mistake: { bad: "They was happy at the party.", good: "They were happy at the party.", note: "'they' es sujeto plural y exige 'were'" },
    quiz: [
      {
        q: "We ___ very busy at work all morning.",
        options: ["were", "was", "are"],
        answer: 0,
        explain: "El sujeto 'We' requiere 'were' para formar el pasado del verbo to be.",
      },
      {
        q: "___ she at the doctor's office this morning?",
        options: ["Was", "Were", "Did"],
        answer: 0,
        explain: "Para el sujeto 'she' en pasado con to be se utiliza 'Was' al inicio de la pregunta.",
      },
      {
        q: "¿Cuál oración expresa correctamente una negación en pasado?",
        options: [
          "They weren't aware of the new schedule.",
          "They didn't was aware of the new schedule.",
          "They wasn't aware of the new schedule.",
        ],
        answer: 0,
        explain: "'They' requiere 'weren't' (were not). El auxiliar 'did' nunca se usa con 'was/were'.",
      },
    ],
  },
  {
    slug: "a2-pasado-continuo",
    eyebrow: "A2 · Pasado",
    title: "Pasado continuo",
    emphasis: "(was / were + -ing)",
    goal: "Describe acciones que estaban en progreso en un momento determinado del pasado.",
    conceptRows: [
      { key: "Acción en progreso", value: "I was cooking dinner at 7 PM · Estaba cocinando", highlights: ["was cooking"] },
      { key: "Acciones paralelas", value: "She was reading while he was sleeping · Estaban ocurriendo a la vez", highlights: ["was reading", "was sleeping"] },
      { key: "Escenario de fondo", value: "The sun was shining when we woke up · Creación de contexto", highlights: ["was shining"] },
      { key: "Interrupción", value: "I was watching TV when the telephone rang", highlights: ["was watching"] },
    ],
    structureRows: [
      { key: "Afirmativa", value: "Sujeto + was/were + Verbo-ing · They were studying all night.", highlights: ["were studying"] },
      { key: "Negativa", value: "Sujeto + wasn't/weren't + Verbo-ing · I wasn't paying attention.", highlights: ["wasn't paying"] },
      { key: "Interrogativa", value: "Was/Were + Sujeto + Verbo-ing? · Were you sleeping when I arrived?", highlights: ["Were you sleeping"] },
    ],
    contextExamples: [
      { key: "Hora específica", value: "At 10 PM last night, I was writing a report for work." },
      { key: "Fondo de una historia", value: "It was raining heavily and the wind was blowing strongly." },
      { key: "Acción interrumpida", value: "She was walking in the park when she saw her old friend." },
      { key: "Simultaneidad", value: "While the children were playing outside, we were preparing food." },
    ],
    contrastColumns: [
      {
        label: "Pasado continuo (was/were + -ing)",
        rule: "Acción en progreso durante un periodo o interrumpida",
        examples: ["I was sleeping at midnight.", "She was driving when it rained."],
      },
      {
        label: "Pasado simple (verbo en pasado / -ed)",
        rule: "Acción puntual o completada en un momento específico",
        examples: ["I slept for 8 hours.", "She drove to work yesterday."],
      },
    ],
    quickReferenceRows: [
      { key: "1. Verbo auxiliar", value: "Usa was (I, he, she, it) o were (you, we, they)." },
      { key: "2. Verbo principal", value: "Añade la terminación -ing al verbo (running, eating, working)." },
      { key: "3. Conector while", value: "Usa 'while' para introducir una acción continua en pasado." },
      { key: "4. Conector when", value: "Usa 'when' para la acción corta en pasado simple que interrumpe." },
    ],
    mistake: { bad: "I was work at 8pm yesterday.", good: "I was working at 8pm yesterday.", note: "el pasado continuo exige el verbo principal en -ing (was working)" },
    quiz: [
      {
        q: "What ___ you doing when the lights went out?",
        options: ["were", "was", "did"],
        answer: 0,
        explain: "El sujeto 'you' requiere el auxiliar 'were' en pasado continuo.",
      },
      {
        q: "She fell asleep while she ___ a movie.",
        options: ["was watching", "watched", "were watching"],
        answer: 0,
        explain: "'while' introduce una acción continua en progreso en pasado ('was watching' para 'she').",
      },
      {
        q: "¿Cuál oración demuestra un uso correcto del pasado continuo?",
        options: [
          "They were having breakfast when the mail arrived.",
          "They was having breakfast when the mail arrived.",
          "They were have breakfast when the mail arrived.",
        ],
        answer: 0,
        explain: "'They' requiere 'were' + gerundio '-ing' ('were having').",
      },
    ],
  },
  {
    slug: "a2-presente-continuo-futuro",
    eyebrow: "A2 · Planes futuros",
    title: "Presente continuo",
    emphasis: "para planes acordados",
    goal: "Utiliza el presente continuo para hablar de citas, viajes y planes ya confirmados con fecha u hora.",
    conceptRows: [
      { key: "Cita confirmada", value: "I'm meeting the doctor at 4 PM tomorrow · Cita fijada", highlights: ["I'm meeting"] },
      { key: "Viaje / Evento", value: "We're flying to Paris next Monday · Boletos comprados", highlights: ["We're flying"] },
      { key: "Compromiso social", value: "She is having dinner with Marcus tonight", highlights: ["is having"] },
      { key: "Marcador temporal", value: "Requiere expresiones como tonight, tomorrow, next week", highlights: ["expresiones"] },
    ],
    structureRows: [
      { key: "Afirmativa", value: "Sujeto + am/is/are + Verbo-ing + Marcador · We are leaving at 9 AM.", highlights: ["are leaving"] },
      { key: "Negativa", value: "Sujeto + am/is/are not + Verbo-ing · He isn't working this weekend.", highlights: ["isn't working"] },
      { key: "Interrogativa", value: "Am/Is/Are + Sujeto + Verbo-ing + Marcador? · Are you coming to the party?", highlights: ["Are you coming"] },
    ],
    contextExamples: [
      { key: "Citas médicas", value: "I'm seeing the dentist tomorrow morning at ten." },
      { key: "Planes sociales", value: "We're meeting Sarah outside the cinema after work." },
      { key: "Viajes organizados", value: "They're taking the morning flight to Rome on Tuesday." },
      { key: "Eventos laborales", value: "Our manager is giving a presentation next Thursday." },
    ],
    contrastColumns: [
      {
        label: "Presente continuo (Planes confirmados)",
        rule: "Arreglos y acuerdos concretos con otras personas o agenda fijada",
        examples: ["I'm meeting Lucas at 6 PM. (Quedamos a esa hora)"],
      },
      {
        label: "Going to (Intención personal)",
        rule: "Intención o decisión previa de hacer algo, sin acuerdo cerrado aún",
        examples: ["I'm going to learn Italian next year. (Intención)"],
      },
    ],
    quickReferenceRows: [
      { key: "1. Acuerdo previo", value: "Úsalo solo si la actividad ya está en la agenda o concertada." },
      { key: "2. Expresión de tiempo", value: "Incluye siempre tiempo futuro (tomorrow, next Friday, tonight)." },
      { key: "3. Verbo to be", value: "No olvides am / is / are según el sujeto." },
      { key: "4. Diferencia con rutina", value: "Sin marcador futuro, significa que está ocurriendo ahora mismo." },
    ],
    mistake: { bad: "I meet my friend tomorrow at the café.", good: "I'm meeting my friend tomorrow at the café.", note: "para una cita confirmada en el futuro cercano se usa presente continuo" },
    quiz: [
      {
        q: "We ___ dinner with my grandparents tomorrow night.",
        options: ["are having", "have", "had"],
        answer: 0,
        explain: "Para una cita o compromiso agendado en el futuro se usa el presente continuo ('are having').",
      },
      {
        q: "___ she starting her new job next month?",
        options: ["Is", "Does", "Will be"],
        answer: 0,
        explain: "En preguntas de presente continuo para planes de futuro se inicia con la forma del verbo to be ('Is' para 'she').",
      },
      {
        q: "¿Qué frase expresa un acuerdo futuro totalmente agendado?",
        options: [
          "They are taking the 9:00 train tomorrow.",
          "They take the 9:00 train tomorrow.",
          "They took the 9:00 train tomorrow.",
        ],
        answer: 0,
        explain: "'They are taking...' utiliza presente continuo con referencia temporal futura para un viaje confirmado.",
      },
    ],
  },
  {
    slug: "a2-when-while-pasado",
    eyebrow: "A2 · Conectores de tiempo",
    title: "When y while",
    emphasis: "en historias pasadas",
    goal: "Conecta acciones simultáneas e interrupciones pasadas combinando when y while correctamente.",
    conceptRows: [
      { key: "While + Continuo", value: "While I was studying, my brother arrived · Durante una acción larga", highlights: ["While", "was studying"] },
      { key: "When + Pasado simple", value: "I was reading a book when she called · Acción puntual que interrumpe", highlights: ["when", "called"] },
      { key: "Acciones paralelas", value: "While she was cooking, I was cleaning · Dos procesos simultáneos", highlights: ["While"] },
      { key: "Secuencia rápida", value: "When I opened the door, the cat ran out", highlights: ["When"] },
    ],
    structureRows: [
      { key: "While (Duración)", value: "While + Sujeto + was/were + -ing, Sujeto + verbo en pasado · While we were driving, it snowed.", highlights: ["While we were driving"] },
      { key: "When (Interrupción)", value: "Sujeto + was/were + -ing + when + Sujeto + verbo en pasado · I was writing when he came in.", highlights: ["when he came in"] },
      { key: "Ubicación de cláusula", value: "Si la oración empieza con While/When, usa coma entre cláusulas.", highlights: ["coma"] },
    ],
    contextExamples: [
      { key: "Interrupción común", value: "The phone rang while I was taking a shower." },
      { key: "Accidentes/Sorpresas", value: "She burned her hand when she was taking the dish out." },
      { key: "Paralelismo", value: "While the students were doing the exam, the teacher was checking notes." },
      { key: "Momento exacto", value: "When we arrived at the station, the bus was already waiting." },
    ],
    contrastColumns: [
      {
        label: "while (mientras)",
        rule: "Acompaña a verbos de duración en pasado continuo (was/were + -ing)",
        examples: ["While I was cooking...", "While they were talking..."],
      },
      {
        label: "when (cuando)",
        rule: "Acompaña a acciones breves o interrupciones en pasado simple",
        examples: ["...when the alarm sounded.", "When he stepped outside..."],
      },
    ],
    quickReferenceRows: [
      { key: "1. Regla while", value: "While + Past Continuous (acción de fondo / larga)." },
      { key: "2. Regla when", value: "When + Past Simple (acción puntual / interrupción)." },
      { key: "3. Orden flexible", value: "Puedes cambiar el orden de las frases (ej. 'While I was cooking, he called' = 'He called while I was cooking')." },
      { key: "4. Uso de comas", value: "Usa coma solo cuando el conector va al principio de la oración." },
    ],
    mistake: { bad: "While I walked in the street, I was meeting John.", good: "While I was walking in the street, I met John.", note: "'while' acompaña a la acción continua y 'met' es el evento puntual" },
    quiz: [
      {
        q: "I lost my wallet ___ I was walking through the market.",
        options: ["while", "when", "during"],
        answer: 0,
        explain: "'while' se utiliza para introducir la cláusula en pasado continuo ('I was walking').",
      },
      {
        q: "The power went out while we ___ a movie.",
        options: ["were watching", "watched", "are watching"],
        answer: 0,
        explain: "Después de 'while' la acción en desarrollo requiere pasado continuo ('were watching').",
      },
      {
        q: "¿Cuál opción completa la frase correctamente? 'She was driving home ___ it started to rain.'",
        options: ["when", "while", "since"],
        answer: 0,
        explain: "'when' introduce el evento repentino e interrupción en pasado simple ('it started').",
      },
    ],
  },
  {
    slug: "a2-pronombres-reflexivos",
    eyebrow: "A2 · Pronombres",
    title: "Pronombres",
    emphasis: "reflexivos (myself, yourself…)",
    goal: "Emplea pronombres reflexivos cuando el sujeto realiza y recibe la misma acción.",
    conceptRows: [
      { key: "Singulares", value: "myself, yourself, himself, herself, itself · Sobre uno mismo", highlights: ["myself", "yourself", "himself", "herself", "itself"] },
      { key: "Plurales", value: "ourselves, yourselves, themselves · Sobre sí mismos", highlights: ["ourselves", "yourselves", "themselves"] },
      { key: "Uso reflexivo", value: "I cut myself while chopping onions", highlights: ["myself"] },
      { key: "Uso enfático / autogestión", value: "by myself = solo / por mi cuenta | She solved it herself", highlights: ["by myself", "herself"] },
    ],
    structureRows: [
      { key: "Sujeto → Reflexivo (Singular)", value: "I→myself | You→yourself | He→himself | She→herself | It→itself", highlights: ["myself", "yourself"] },
      { key: "Sujeto → Reflexivo (Plural)", value: "We→ourselves | You (pl)→yourselves | They→themselves", highlights: ["ourselves", "themselves"] },
      { key: "Estructura por cuenta propia", value: "Sujeto + Verbo + by + Pronombre reflexivo · He lives by himself.", highlights: ["by himself"] },
    ],
    contextExamples: [
      { key: "Accidentes cotidianos", value: "Be careful with that knife, don't cut yourself!" },
      { key: "Autoaprendizaje", value: "Maria taught herself to play the piano without a teacher." },
      { key: "Independencia", value: "My grandfather fixed the roof all by himself." },
      { key: "Cuidado personal", value: "They really enjoyed themselves at the summer festival." },
    ],
    contrastColumns: [
      {
        label: "Pronombres de objeto (me, him, them)",
        rule: "La acción recae en OTRA persona o cosa",
        examples: ["She looked at him. (Ella lo miró a él)", "I helped them."],
      },
      {
        label: "Pronombres reflexivos (myself, himself, themselves)",
        rule: "La acción recae sobre EL MISMO sujeto que la realiza",
        examples: ["She looked at herself in the mirror.", "I helped myself."],
      },
    ],
    quickReferenceRows: [
      { key: "1. Concordancia obligatoria", value: "El reflexivo debe coincidir exactamente con el sujeto." },
      { key: "2. Expresión by + reflexivo", value: "Significa 'solo' o 'sin ayuda de nadie'." },
      { key: "3. Verbos comunes", value: "Frecuente con hurt, cut, teach, enjoy, introduce, look at." },
      { key: "4. No usar en rutinas", value: "En inglés NO se usan reflexivos para lavarse/vestirse (no se dice 'I wash myself')." },
    ],
    mistake: { bad: "He cut him while shaving.", good: "He cut himself while shaving.", note: "se cortó a sí mismo, por lo que exige el reflexivo 'himself'" },
    quiz: [
      {
        q: "Did you prepare this wonderful meal all by ___?",
        options: ["yourself", "you", "yours"],
        answer: 0,
        explain: "'by yourself' significa sin ayuda de nadie para el sujeto 'you'.",
      },
      {
        q: "The children were old enough to dress ___ for school.",
        options: ["themselves", "them", "theirselves"],
        answer: 0,
        explain: "El reflexivo plural de 'they/the children' es 'themselves'. ('theirselves' no existe).",
      },
      {
        q: "¿Cuál frase expresa que ella hizo el trabajo sin ayuda?",
        options: [
          "She completed the whole project by herself.",
          "She completed the whole project by her.",
          "She completed the whole project by hers.",
        ],
        answer: 0,
        explain: "La estructura 'by + reflexivo' ('by herself') expresa que lo hizo sola o sin ayuda externa.",
      },
    ],
  },
  {
    slug: "a2-one-ones",
    eyebrow: "A2 · Sustitución nominal",
    title: "Uso de one",
    emphasis: "y ones",
    goal: "Evita la repetición innecesaria de sustantivos utilizando one (singular) y ones (plural).",
    conceptRows: [
      { key: "one (Singular)", value: "Reemplaza a un sustantivo contable singular · Which bag? The red one.", highlights: ["one"] },
      { key: "ones (Plural)", value: "Reemplaza a sustantivos contables plurales · I like the blue ones.", highlights: ["ones"] },
      { key: "Con adjetivos", value: "a new one / the small ones / this old one", highlights: ["a new one", "small ones"] },
      { key: "Con demostrativos", value: "this one / that one / these ones / those ones", highlights: ["this one", "those ones"] },
    ],
    structureRows: [
      { key: "Singular", value: "Determinado/Adjetivo + one · I need a bigger one.", highlights: ["one"] },
      { key: "Plural", value: "Determinado/Adjetivo + ones · I'll buy the leather ones.", highlights: ["ones"] },
      { key: "Preguntas de elección", value: "Which one do you prefer? / Which ones are yours?", highlights: ["Which one", "Which ones"] },
    ],
    contextExamples: [
      { key: "De compras", value: "These shoes are nice, but I prefer the black ones over there." },
      { key: "Elección entre objetos", value: "Don't take that broken chair; take this one." },
      { key: "Restaurante", value: "Would you like a large coffee or a small one?" },
      { key: "Prendas de vestir", value: "My old coat is ruined, so I am going to buy a new one." },
    ],
    contrastColumns: [
      {
        label: "one (Reemplazo singular)",
        rule: "Usado para sustituir un objeto contable en singular ya mencionado",
        examples: ["Which shirt do you want? - The white one."],
      },
      {
        label: "ones (Reemplazo plural)",
        rule: "Usado para sustituir varios objetos contables en plural",
        examples: ["Which boots do you want? - The brown ones."],
      },
    ],
    quickReferenceRows: [
      { key: "1. Evita la repetición", value: "Sirve para no repetir la misma palabra dos veces en una frase." },
      { key: "2. Solo para contables", value: "No se usa one/ones con sustantivos incontables (ej. agua, dinero, información)." },
      { key: "3. Con adjetivos", value: "Siempre coloca el adjetivo ANTES de one/ones (ej. green one, smart ones)." },
      { key: "4. Con artículos", value: "Se combina con a/an, the, this, that, etc. (a good one, this one)." },
    ],
    mistake: { bad: "I don't like this phone, I want a new.", good: "I don't like this phone, I want a new one.", note: "'one' es imprescindible tras un adjetivo para sustituir al sustantivo omitido" },
    quiz: [
      {
        q: "There are two umbrellas here. Which ___ is yours?",
        options: ["one", "ones", "it"],
        answer: 0,
        explain: "Se pregunta por un único objeto en singular ('umbrella') entre opciones, corresponde 'one'.",
      },
      {
        q: "I have many books, but these ___ are my favorites.",
        options: ["ones", "one", "them"],
        answer: 0,
        explain: "'books' es un sustantivo plural, por lo que el pronombre de sustitución adecuado es 'ones'.",
      },
      {
        q: "¿Cuál respuesta responde de forma fluida y gramaticalmente correcta a: 'Do you want the red shirt?'",
        options: [
          "No, I want the blue one.",
          "No, I want the blue.",
          "No, I want the blue ones.",
        ],
        answer: 0,
        explain: "'shirt' es singular, por lo que debemos decir 'the blue one'.",
      },
    ],
  },
  {
    slug: "a2-adverbios-grado",
    eyebrow: "A2 · Adverbios",
    title: "Adverbios de grado",
    emphasis: "(very, really, quite)",
    goal: "Modifica e intensifica el significado de adjetivos y adverbios con very, really, quite y extremely.",
    conceptRows: [
      { key: "quite (Moderado)", value: "bastante / razonablemente · The movie was quite good (7/10)", highlights: ["quite"] },
      { key: "very (Alto)", value: "muy · It is very cold outside today (8.5/10)", highlights: ["very"] },
      { key: "really (Intenso / Sincero)", value: "realmente / de verdad · I am really excited (9/10)", highlights: ["really"] },
      { key: "extremely (Máximo)", value: "extremadamente · This test was extremely difficult (10/10)", highlights: ["extremely"] },
    ],
    structureRows: [
      { key: "Ante adjetivo", value: "Sujeto + to be + Adverbio de grado + Adjetivo · She is really fast.", highlights: ["really fast"] },
      { key: "Ante adverbio", value: "Sujeto + Verbo + Adverbio de grado + Adverbio · He speaks quite clearly.", highlights: ["quite clearly"] },
      { key: "Posición del artículo a/an", value: "quite a + adj + sustantivo | a very + adj + sustantivo · quite a long day", highlights: ["quite a"] },
    ],
    contextExamples: [
      { key: "Opiniones cotidianas", value: "The new Italian restaurant in downtown is really good." },
      { key: "Descripción del clima", value: "Wear a heavy coat because it is extremely windy today." },
      { key: "Evaluación de dificultad", value: "The exam was quite easy, so most students passed." },
      { key: "Sensaciones físicas", value: "After working 10 hours, I feel very tired." },
    ],
    contrastColumns: [
      {
        label: "quite (Intensidad moderada)",
        rule: "Menos fuerte que very; indica un grado medio aceptable",
        examples: ["The apartment is quite nice. (Está bastante bien)"],
      },
      {
        label: "very / really (Intensidad alta)",
        rule: "Aumenta fuertemente el grado de la característica",
        examples: ["The apartment is very nice. (Es muy bonito)"],
      },
    ],
    quickReferenceRows: [
      { key: "1. Posición básica", value: "Se colocan directamente antes del adjetivo o adverbio que modifican." },
      { key: "2. Regla con much", value: "Usa 'very cold' o 'really cold', NUNCA 'very much cold'." },
      { key: "3. Posición con 'quite a'", value: "Se dice 'quite a good movie' (el artículo 'a' va después de 'quite')." },
      { key: "4. Really con verbos", value: "Really también puede modificar verbos ('I really like it'), muy poco común con very." },
    ],
    mistake: { bad: "The apartment is very much expensive.", good: "The apartment is very expensive.", note: "'very' modifica directamente al adjetivo sin necesidad de 'much'" },
    quiz: [
      {
        q: "The teacher explained the lesson ___ clearly, so everyone understood.",
        options: ["very", "much", "too much"],
        answer: 0,
        explain: "'very' se usa delante de adverbios ('clearly') para intensificar el grado sin añadir 'much'.",
      },
      {
        q: "It's ___ long story, so I will tell you later.",
        options: ["quite a", "a quite", "very a"],
        answer: 0,
        explain: "La estructura correcta con el artículo indefinido es 'quite a' + adjetivo + sustantivo.",
      },
      {
        q: "¿Cuál oración utiliza correctamente un adverbio de grado?",
        options: [
          "I am really happy with my exam score.",
          "I am very much happy with my exam score.",
          "I am real happy with my exam score.",
        ],
        answer: 0,
        explain: "'really' intensifica adecuadamente al adjetivo 'happy'. En inglés estándar 'very much happy' es incorrecto.",
      },
    ],
  },
];
