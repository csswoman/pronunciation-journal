import fs from "fs";
import path from "path";

const decksDir = path.join(process.cwd(), "public", "grammar-decks");

const quizzes: Record<string, Array<{ q: string; options: string[]; answer: number; explain: string }>> = {
  "a1-audio-ingles-viajes": [
    { q: "¿Cómo pides la cuenta amablemente en un restaurante?", options: ["Can I have the bill, please?", "Give me the bill now."], answer: 0, explain: "'Can I have the bill, please?' es la forma cortés y habitual en inglés." },
    { q: "¿Qué frase usas si te has perdido en una ciudad?", options: ["Excuse me, I'm lost.", "Excuse me, I'm found."], answer: 0, explain: "'I'm lost' significa 'estoy perdido/a'." },
    { q: "Where is the airport shuttle?", options: ["It's outside door 3.", "It's inside the plane."], answer: 0, explain: "Los autobuses de enlace al aeropuerto (shuttles) suelen esperar fuera en las terminales." },
  ],
  "a1-audio-preposiciones": [
    { q: "The cat is sleeping ___ the sofa.", options: ["on", "in"], answer: 0, explain: "El gato duerme sobre la superficie del sofá ('on')." },
    { q: "The keys are ___ my pocket.", options: ["in", "on"], answer: 0, explain: "Las llaves están dentro del bolsillo ('in')." },
    { q: "The bus stop is right ___ to the pharmacy.", options: ["next", "near to"], answer: 0, explain: "La expresión fija de posición relativa al lado de algo es 'next to'." },
  ],
  "a1-construccion-oraciones": [
    { q: "¿Cuál es el orden básico de una oración afirmativa en inglés?", options: ["Sujeto + Verbo + Objeto", "Verbo + Sujeto + Objeto"], answer: 0, explain: "El orden estándar en inglés es Sujeto + Verbo + Objeto (ej. I like coffee)." },
    { q: "In the sentence 'She speaks English', what is 'English'?", options: ["The object", "The subject"], answer: 0, explain: "'English' es el objeto directo que recibe la acción del verbo." },
    { q: "¿Qué elemento no puede faltar en una oración en inglés?", options: ["El sujeto expreso", "La coma"], answer: 0, explain: "A diferencia del español, el inglés exige siempre un sujeto explícito." },
  ],
  "a1-escritura-basica": [
    { q: "¿Cuál de estos elementos debe empezar SIEMPRE con mayúscula en inglés?", options: ["Los días de la semana y el pronombre 'I'", "Todos los adjetivos"], answer: 0, explain: "En inglés, los días de la semana, los meses y el pronombre 'I' llevan siempre mayúscula inicial." },
    { q: "Selecciona la oración con la puntuación y mayúsculas correctas:", options: ["On Monday, I meet Alex.", "On monday i meet alex."], answer: 0, explain: "'On', 'Monday', 'I' y 'Alex' requieren mayúscula inicial." },
    { q: "¿Cómo se une correctamente una lista de tres elementos?", options: ["apples, bananas, and oranges", "apples, bananas, or oranges and"], answer: 0, explain: "Se enumeran los elementos separados por comas y se usa 'and' antes del último." },
  ],
  "a1-estrategias-aprender-ingles": [
    { q: "¿Cuál es la mejor práctica para consolidar vocabulario nuevo?", options: ["Usar las palabras en oraciones personales y repasarlas a diario.", "Memorizar listas aisladas una sola vez."], answer: 0, explain: "Crear frases propias y repasar de forma espaciada consolida la memoria a largo plazo." },
    { q: "¿Qué hacer si cometes un error al hablar?", options: ["Corregir si es posible y seguir comunicándote sin miedo.", "Dejar de hablar inglés."], answer: 0, explain: "Los errores son parte natural del aprendizaje; mantener la fluidez y aprender del error es clave." },
    { q: "¿Cuál de estas actividades ayuda más a mejorar la comprensión auditiva?", options: ["Escuchar audios cortos repetidamente y seguir la transcripción.", "Escuchar podcasts avanzados sin entender nada."], answer: 0, explain: "Escuchar audios adecuados a tu nivel con transcripción ayuda a asociar sonido y grafía." },
  ],
  "a1-fechas-horas-descripciones": [
    { q: "What time is it if the clock shows 7:30?", options: ["It's half past seven.", "It's half to seven."], answer: 0, explain: "7:30 se expresa habitualmente como 'half past seven'." },
    { q: "How do you write the date '15 de marzo' in English?", options: ["March 15th", "15 Marchs"], answer: 0, explain: "Las fechas en inglés usan números ordinales (15th - fifteenth)." },
    { q: "She has ___ eyes and black hair.", options: ["blue", "a blue"], answer: 0, explain: "Los adjetivos en plural no llevan artículo ('blue eyes')." },
  ],
  "a1-ingles-principiantes": [
    { q: "¿Cómo respondes educadamente a 'Thank you'?", options: ["You're welcome.", "Please."], answer: 0, explain: "'You're welcome' es la respuesta estándar para 'De nada'." },
    { q: "¿Qué dices para llamar la atención de alguien de forma cortés?", options: ["Excuse me.", "Hey you."], answer: 0, explain: "'Excuse me' es la fórmula educada para iniciar un contacto." },
    { q: "How are you doing?", options: ["I'm doing well, thanks!", "I am 25 years old."], answer: 0, explain: "'How are you doing?' pregunta cómo estás, no tu edad." },
  ],
  "a1-practico-elementos-trabajo": [
    { q: "Where do you write notes during a business meeting?", options: ["In a notebook.", "In a fridge."], answer: 0, explain: "'Notebook' es cuaderno o libreta de notas." },
    { q: "I need to print this document. Is the ___ working?", options: ["printer", "stapler"], answer: 0, explain: "Para imprimir un documento se necesita una impresora ('printer')." },
    { q: "She receives many ___ on her company account every day.", options: ["emails", "desks"], answer: 0, explain: "'Emails' es la palabra adecuada para correos electrónicos recibidos." },
  ],
  "a1-practico-familia": [
    { q: "My mother's sister is my ___.", options: ["aunt", "cousin"], answer: 0, explain: "La hermana de tu madre es tu tía ('aunt')." },
    { q: "My uncle's son is my ___.", options: ["cousin", "brother"], answer: 0, explain: "El hijo de tu tío es tu primo ('cousin')." },
    { q: "Your father and mother are your ___.", options: ["parents", "relatives"], answer: 0, explain: "'Parents' se refiere específicamente a padre y madre." },
  ],
  "a1-preferencias-habilidades": [
    { q: "I love ___ to music in my free time.", options: ["listening", "listen"], answer: 0, explain: "Verbos de preferencia como 'love' se siguen habitualmente de verbo con '-ing' ('listening')." },
    { q: "She is good at ___ chess.", options: ["playing", "play"], answer: 0, explain: "Tras la preposición 'at' en 'good at', el verbo va obligatoriamente en -ing." },
    { q: "He doesn't like ___ early on Sunday morning.", options: ["waking up", "wake up"], answer: 0, explain: "'like' exige gerundio (-ing) tras la negación: 'waking up'." },
  ],
  "a1-presente-simple": [
    { q: "He ___ breakfast at 7:30 every morning.", options: ["eats", "eat"], answer: 0, explain: "En tercera persona del singular (he), el verbo en presente simple añade '-s'." },
    { q: "They ___ not live in Chicago.", options: ["do", "does"], answer: 0, explain: "Con el sujeto 'They' se usa el auxiliar negativo 'do not' (don't)." },
    { q: "My parents ___ TV in the evening.", options: ["watch", "watches"], answer: 0, explain: "'My parents' es plural (they), por lo que el verbo no lleva '-s'." },
  ],
  "a1-verbo-to-be": [
    { q: "I ___ a software developer.", options: ["am", "is"], answer: 0, explain: "La primera persona del singular 'I' se combina con 'am'." },
    { q: "They ___ at home yesterday evening.", options: ["were", "was"], answer: 0, explain: "'They' en pasado de to be requiere 'were'." },
    { q: "___ she your new classmate?", options: ["Is", "Are"], answer: 0, explain: "La tercera persona del singular 'she' utiliza el verbo 'Is'." },
  ],
  "a1-verbos-comunes": [
    { q: "I want ___ English fluently.", options: ["to speak", "speaking"], answer: 0, explain: "El verbo 'want' se combina con el infinitivo completo con 'to' ('want to speak')." },
    { q: "She has got two cats.", options: ["Tiene dos gatos.", "Es dos gatos."], answer: 0, explain: "'have got' o 'has got' se utiliza para indicar posesión." },
    { q: "Can you ___ me the time, please?", options: ["tell", "say"], answer: 0, explain: "Se dice 'tell me the time' cuando indicas información a una persona." },
  ],
  "a1-vocabulario-expresiones-basicas": [
    { q: "What do you say when someone gives you a present?", options: ["Thank you very much!", "Nice to meet you."], answer: 0, explain: "'Thank you very much!' expresa agradecimiento al recibir un regalo." },
    { q: "What does 'Good night' mean?", options: ["Despedida al ir a dormir o salir de noche.", "Saludo de la mañana."], answer: 0, explain: "'Good night' se utiliza al despedirse por la noche o al ir a dormir." },
    { q: "If you need help in a store, you can say:", options: ["Can you help me, please?", "Good evening."], answer: 0, explain: "'Can you help me, please?' es la forma natural de solicitar asistencia." },
  ],
};

let updatedCount = 0;
for (const [slug, quizData] of Object.entries(quizzes)) {
  const filePath = path.join(decksDir, `${slug}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    data.quiz = quizData;
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    console.log("Updated quiz for:", slug);
    updatedCount++;
  } else {
    console.error("File not found:", slug);
  }
}

console.log(`Successfully updated ${updatedCount} handcrafted A1 decks with quizzes.`);
