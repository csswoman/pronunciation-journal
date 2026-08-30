import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Raw 300 chunks dataset from "300 Chunks to Speak English From Day 1"
const rawChunks = [
  // ── PRESENT ────────────────────────────────────────────────────────────
  // 1. Breaking the Ice
  {
    chunk: "Hey, how's it going?",
    ipa: "/heɪ haʊz ɪt ˈɡoʊɪŋ/",
    meaning: "Hey, ¿cómo te va? / ¡Hola! ¿Cómo estás?",
    example: "Hey, how's it going? Haven't seen you in a while!",
    example_translation: "Hey, ¿cómo te va? ¡No te he visto en un buen tiempo!",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "What's up?",
    ipa: "/wʌts ʌp/",
    meaning: "¿Qué tal? / ¿Qué hay?",
    example: "What's up? You look happy today.",
    example_translation: "¿Qué tal? Te ves feliz hoy.",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "Long time no see!",
    ipa: "/lɔːŋ taɪm noʊ siː/",
    meaning: "¡Cuánto tiempo sin verte!",
    example: "Long time no see! How have you been?",
    example_translation: "¡Cuánto tiempo sin verte! ¿Cómo has estado?",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "How have you been?",
    ipa: "/haʊ həv juː biːn/",
    meaning: "¿Cómo has estado?",
    example: "How have you been since the wedding?",
    example_translation: "¿Cómo has estado desde la boda?",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "Nice to meet you.",
    ipa: "/naɪs tuː miːt juː/",
    meaning: "Gusto en conocerte.",
    example: "Nice to meet you, I've heard so much about you.",
    example_translation: "Gusto en conocerte, he oído hablar mucho de ti.",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "It's nice to finally meet you.",
    ipa: "/ɪts naɪs tuː ˈfaɪnəli miːt juː/",
    meaning: "Es un gusto finalmente conocerte en persona.",
    example: "It's nice to finally meet you in person.",
    example_translation: "Es un gusto conocerte finalmente en persona.",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "I don't think we've met.",
    ipa: "/aɪ doʊnt θɪŋk wiːv mɛt/",
    meaning: "Creo que no nos conocemos / No creo que nos hayamos presentado.",
    example: "I don't think we've met — I'm Sarah.",
    example_translation: "Creo que no nos conocemos — soy Sarah.",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "Mind if I sit here?",
    ipa: "/maɪnd ɪf aɪ sɪt hɪər/",
    meaning: "¿Te importa si me siento aquí?",
    example: "Mind if I sit here? All the other seats are taken.",
    example_translation: "¿Te importa si me siento aquí? Todos los demás asientos están ocupados.",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "Is this seat taken?",
    ipa: "/ɪz ðɪs siːt ˈteɪkən/",
    meaning: "¿Está ocupado este asiento?",
    example: "Excuse me, is this seat taken?",
    example_translation: "Disculpa, ¿está ocupado este asiento?",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "What brings you here?",
    ipa: "/wʌt brɪŋz juː hɪər/",
    meaning: "¿Qué te trae por aquí?",
    example: "What brings you here? I didn't expect to see you.",
    example_translation: "¿Qué te trae por aquí? No esperaba verte.",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "So, tell me about yourself.",
    ipa: "/soʊ tɛl miː əˈbaʊt jɔːrˈsɛlf/",
    meaning: "Bueno, cuéntame de ti.",
    example: "So, tell me about yourself — where are you working now?",
    example_translation: "Bueno, cuéntame de ti — ¿dónde estás trabajando ahora?",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "What do you do for a living?",
    ipa: "/wʌt duː juː duː fər ə ˈlɪvɪŋ/",
    meaning: "¿A qué te dedicas?",
    example: "What do you do for a living these days?",
    example_translation: "¿A qué te dedicas en estos días?",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "Where are you from?",
    ipa: "/wɛər ɑːr juː frɒm/",
    meaning: "¿De dónde eres?",
    example: "Where are you from originally?",
    example_translation: "¿De dónde eres originalmente?",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "How do you two know each other?",
    ipa: "/haʊ duː juː tuː noʊ iːtʃ ˈʌðər/",
    meaning: "¿De dónde se conocen ustedes dos?",
    example: "How do you two know each other, anyway?",
    example_translation: "Por cierto, ¿de dónde se conocen ustedes dos?",
    category: "Breaking the Ice",
    tag: "Present"
  },
  {
    chunk: "I love your jacket.",
    ipa: "/aɪ lʌv jɔːr ˈdʒækɪt/",
    meaning: "Me encanta tu chaqueta / chamarra.",
    example: "I love your jacket, where did you get it?",
    example_translation: "Me encanta tu chaqueta, ¿dónde la conseguiste?",
    category: "Breaking the Ice",
    tag: "Present"
  },

  // 2. Small Talk & Weather
  {
    chunk: "Nice weather we're having, isn't it?",
    ipa: "/naɪs ˈwɛðər wɪər ˈhævɪŋ ˈɪzənt ɪt/",
    meaning: "Buen clima estamos teniendo, ¿verdad?",
    example: "Nice weather we're having, isn't it? Perfect for a walk.",
    example_translation: "Buen clima estamos teniendo, ¿verdad? Perfecto para salir a caminar.",
    category: "Small Talk & Weather",
    tag: "Present"
  },
  {
    chunk: "It's freezing today.",
    ipa: "/ɪts ˈfriːzɪŋ təˈdeɪ/",
    meaning: "Está helando hoy / Hace un frío tremendo.",
    example: "It's freezing today, I should've worn a coat.",
    example_translation: "Está helando hoy, debí haber traído un abrigo.",
    category: "Small Talk & Weather",
    tag: "Present"
  },
  {
    chunk: "It's boiling out there.",
    ipa: "/ɪts ˈbɔɪlɪŋ aʊt ðɛər/",
    meaning: "Hace un calor abrasador allá afuera.",
    example: "It's boiling out there, don't forget your water.",
    example_translation: "Hace un calor abrasador allá afuera, no olvides tu agua.",
    category: "Small Talk & Weather",
    tag: "Present"
  },
  {
    chunk: "Can you believe this weather?",
    ipa: "/kən juː bɪˈliːv ðɪs ˈwɛðər/",
    meaning: "¿Puedes creer este clima?",
    example: "Can you believe this weather? It was sunny an hour ago.",
    example_translation: "¿Puedes creer este clima? Estaba soleado hace una hora.",
    category: "Small Talk & Weather",
    tag: "Present"
  },
  {
    chunk: "I hope it doesn't rain.",
    ipa: "/aɪ hoʊp ɪt ˈdʌzənt reɪn/",
    meaning: "Espero que no llueva.",
    example: "I hope it doesn't rain, we have a picnic planned.",
    example_translation: "Espero que no llueva, tenemos un picnic planeado.",
    category: "Small Talk & Weather",
    tag: "Present"
  },
  {
    chunk: "How's your day going?",
    ipa: "/haʊz jɔːr deɪ ˈɡoʊɪŋ/",
    meaning: "¿Cómo va tu día?",
    example: "How's your day going so far?",
    example_translation: "¿Cómo va tu día hasta ahora?",
    category: "Small Talk & Weather",
    tag: "Present"
  },
  {
    chunk: "Busy day, huh?",
    ipa: "/ˈbɪzi deɪ hʌ/",
    meaning: "Día ajetreado, ¿eh?",
    example: "Busy day, huh? You look exhausted.",
    example_translation: "Día ajetreado, ¿eh? Te ves exhausto.",
    category: "Small Talk & Weather",
    tag: "Present"
  },
  {
    chunk: "Same old, same old.",
    ipa: "/seɪm oʊld seɪm oʊld/",
    meaning: "Lo mismo de siempre.",
    example: "Same old, same old — nothing new to report.",
    example_translation: "Lo mismo de siempre — nada nuevo que reportar.",
    category: "Small Talk & Weather",
    tag: "Present"
  },
  {
    chunk: "Can't complain.",
    ipa: "/kænt kəmˈpleɪn/",
    meaning: "No me puedo quejar.",
    example: "Can't complain, things are going fine.",
    example_translation: "No me puedo quejar, las cosas van bien.",
    category: "Small Talk & Weather",
    tag: "Present"
  },
  {
    chunk: "Things could be worse.",
    ipa: "/θɪŋz kʊd biː wɜːrs/",
    meaning: "Las cosas podrían ser peores.",
    example: "Things could be worse, at least we're both healthy.",
    example_translation: "Las cosas podrían ser peores, al menos ambos tenemos salud.",
    category: "Small Talk & Weather",
    tag: "Present"
  },

  // 3. Talking About Your Routine
  {
    chunk: "I usually wake up around seven.",
    ipa: "/aɪ ˈjuːʒuəli weɪk ʌp əˈraʊnd ˈsɛvən/",
    meaning: "Suelo despertarme alrededor de las siete.",
    example: "I usually wake up around seven, even on weekends.",
    example_translation: "Suelo despertarme alrededor de las siete, incluso los fines de semana.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "I work from home.",
    ipa: "/aɪ wɜːrk frɒm hoʊm/",
    meaning: "Trabajo desde casa.",
    example: "I work from home three days a week.",
    example_translation: "Trabajo desde casa tres días a la semana.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "On weekdays, I...",
    ipa: "/ɒn ˈwiːkdeɪz aɪ/",
    meaning: "Entre semana, yo...",
    example: "On weekdays, I get up early and go for a run.",
    example_translation: "Entre semana, me levanto temprano y salgo a correr.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "I'm not a morning person.",
    ipa: "/aɪm nɒt ə ˈmɔːrnɪŋ ˈpɜːrsən/",
    meaning: "No soy una persona madrugadora.",
    example: "I'm not a morning person, so don't talk to me before coffee.",
    example_translation: "No soy una persona madrugadora, así que no me hables antes del café.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "I try to exercise every day.",
    ipa: "/aɪ traɪ tuː ˈɛksərsaɪz ˈɛvri deɪ/",
    meaning: "Intento hacer ejercicio todos los días.",
    example: "I try to exercise every day, even if it's just a short walk.",
    example_translation: "Intento hacer ejercicio todos los días, aunque sea una caminata corta.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "In my free time, I like to...",
    ipa: "/ɪn maɪ friː taɪm aɪ laɪk tuː/",
    meaning: "En mi tiempo libre, me gusta...",
    example: "In my free time, I like to read or watch documentaries.",
    example_translation: "En mi tiempo libre, me gusta leer o ver documentales.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "I spend most of my time...",
    ipa: "/aɪ spɛnd moʊst əv maɪ taɪm/",
    meaning: "Paso la mayor parte de mi tiempo...",
    example: "I spend most of my time working on my laptop.",
    example_translation: "Paso la mayor parte de mi tiempo trabajando en mi laptop.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "I'm really into cooking.",
    ipa: "/aɪm ˈrɪəli ˈɪntuː ˈkʊkɪŋ/",
    meaning: "Me apasiona cocinar / Estoy muy metido en la cocina.",
    example: "I'm really into cooking lately, I try a new recipe every week.",
    example_translation: "Me apasiona cocinar últimamente, pruebo una receta nueva cada semana.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "I've been really busy lately.",
    ipa: "/aɪv biːn ˈrɪəli ˈbɪzi ˈleɪtli/",
    meaning: "He estado muy ocupado últimamente.",
    example: "I've been really busy lately with a new project at work.",
    example_translation: "He estado muy ocupado últimamente con un nuevo proyecto en el trabajo.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "Life's been pretty hectic.",
    ipa: "/laɪfs biːn ˈprɪti ˈhɛktɪk/",
    meaning: "La vida ha estado bastante ajetreada.",
    example: "Life's been pretty hectic since the baby arrived.",
    example_translation: "La vida ha estado bastante ajetreada desde que llegó el bebé.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "I'm used to...",
    ipa: "/aɪm juːzd tuː/",
    meaning: "Estoy acostumbrado a...",
    example: "I'm used to working late, it doesn't bother me.",
    example_translation: "Estoy acostumbrado a trabajar hasta tarde, no me molesta.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "It depends on the day.",
    ipa: "/ɪt dɪˈpɛndz ɒn ðə deɪ/",
    meaning: "Depende del día.",
    example: "It depends on the day — some days are calmer than others.",
    example_translation: "Depende del día — algunos días son más tranquilos que otros.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "Most days, I...",
    ipa: "/moʊst deɪz aɪ/",
    meaning: "La mayoría de los días, yo...",
    example: "Most days, I have lunch at my desk.",
    example_translation: "La mayoría de los días, almuerzo en mi escritorio.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "I never really...",
    ipa: "/aɪ ˈnɛvər ˈrɪəli/",
    meaning: "Nunca fui muy de... / Nunca me apasionó...",
    example: "I never really got into video games.",
    example_translation: "Nunca fui muy de videojuegos.",
    category: "Talking About Your Routine",
    tag: "Present"
  },
  {
    chunk: "To be honest, I...",
    ipa: "/tuː biː ˈɒnɪst aɪ/",
    meaning: "Para ser honesto, yo...",
    example: "To be honest, I haven't had time to think about it.",
    example_translation: "Para ser honesto, no he tenido tiempo de pensar en eso.",
    category: "Talking About Your Routine",
    tag: "Present"
  },

  // 4. Opinions & Reactions
  {
    chunk: "If you ask me,...",
    ipa: "/ɪf juː æsk miː/",
    meaning: "Si me preguntas a mí,...",
    example: "If you ask me, the second option is much better.",
    example_translation: "Si me preguntas a mí, la segunda opción es mucho mejor.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "In my opinion,...",
    ipa: "/ɪn maɪ əˈpɪnjən/",
    meaning: "En mi opinión,...",
    example: "In my opinion, the movie was too long.",
    example_translation: "En mi opinión, la película fue demasiado larga.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "From my point of view,...",
    ipa: "/frɒm maɪ pɔɪnt əv vjuː/",
    meaning: "Desde mi punto de vista,...",
    example: "From my point of view, we should wait a bit longer.",
    example_translation: "Desde mi punto de vista, deberíamos esperar un poco más.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "As far as I know,...",
    ipa: "/æz fɑːr æz aɪ noʊ/",
    meaning: "Hasta donde yo sé,...",
    example: "As far as I know, the meeting hasn't been rescheduled.",
    example_translation: "Hasta donde yo sé, la reunión no ha sido reprogramada.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "I guess so.",
    ipa: "/aɪ ɡɛs soʊ/",
    meaning: "Supongo que sí.",
    example: "I guess so, but I'm not 100% sure.",
    example_translation: "Supongo que sí, pero no estoy 100% seguro.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "I'm not so sure about that.",
    ipa: "/aɪm nɒt soʊ ʃʊər əˈbaʊt ðæt/",
    meaning: "No estoy tan seguro de eso.",
    example: "I'm not so sure about that, let me check first.",
    example_translation: "No estoy tan seguro de eso, déjame verificar primero.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "That makes sense.",
    ipa: "/ðæt meɪks sɛns/",
    meaning: "Tiene sentido.",
    example: "That makes sense, thanks for explaining.",
    example_translation: "Tiene sentido, gracias por explicarlo.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "That's a good point.",
    ipa: "/ðæts ə ɡʊd pɔɪnt/",
    meaning: "Es un buen punto.",
    example: "That's a good point, I hadn't thought of it that way.",
    example_translation: "Es un buen punto, no lo había pensado de esa manera.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "I see what you mean.",
    ipa: "/aɪ siː wʌt juː miːn/",
    meaning: "Entiendo a qué te refieres.",
    example: "I see what you mean, that changes things.",
    example_translation: "Entiendo a qué te refieres, eso cambia las cosas.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "I never thought about it that way.",
    ipa: "/aɪ ˈnɛvər θɔːt əˈbaʊt ɪt ðæt weɪ/",
    meaning: "Nunca lo había pensado de esa manera.",
    example: "I never thought about it that way before.",
    example_translation: "Nunca lo había pensado de esa manera antes.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "No way!",
    ipa: "/noʊ weɪ/",
    meaning: "¡De ninguna manera! / ¡No me digas!",
    example: "No way! I don't believe it.",
    example_translation: "¡No me digas! No lo puedo creer.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "Seriously?",
    ipa: "/ˈsɪəriəsli/",
    meaning: "¿En serio?",
    example: "Seriously? That's incredible news.",
    example_translation: "¿En serio? Es una noticia increíble.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "That's crazy!",
    ipa: "/ðæts ˈkreɪzi/",
    meaning: "¡Eso es una locura!",
    example: "That's crazy! I can't believe it happened.",
    example_translation: "¡Eso es una locura! No puedo creer que haya pasado.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "I can't believe it.",
    ipa: "/aɪ kænt bɪˈliːv ɪt/",
    meaning: "No puedo creerlo.",
    example: "I can't believe it, tell me everything.",
    example_translation: "No puedo creerlo, cuéntamelo todo.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "That's amazing.",
    ipa: "/ðæts əˈmeɪzɪŋ/",
    meaning: "Eso es increíble / fantástico.",
    example: "That's amazing, congratulations!",
    example_translation: "¡Eso es increíble, felicitaciones!",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "That sounds great.",
    ipa: "/ðæt saʊndz ɡreɪt/",
    meaning: "Eso suena genial.",
    example: "That sounds great, count me in.",
    example_translation: "Eso suena genial, cuenta conmigo.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "That sounds awful.",
    ipa: "/ðæt saʊndz ˈɔːfʊl/",
    meaning: "Eso suena terrible / horrible.",
    example: "That sounds awful, are you okay?",
    example_translation: "Eso suena terrible, ¿estás bien?",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "I'm so glad to hear that.",
    ipa: "/aɪm soʊ ɡlæd tuː hɪər ðæt/",
    meaning: "Me alegra mucho oír eso.",
    example: "I'm so glad to hear that, it's great news.",
    example_translation: "Me alegra mucho oír eso, es una excelente noticia.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "I'm sorry to hear that.",
    ipa: "/aɪm ˈsɒri tuː hɪər ðæt/",
    meaning: "Lamento oír eso.",
    example: "I'm sorry to hear that, let me know if I can help.",
    example_translation: "Lamento oír eso, avísame si puedo ayudar.",
    category: "Opinions & Reactions",
    tag: "Present"
  },
  {
    chunk: "What a shame.",
    ipa: "/wʌt ə ʃeɪm/",
    meaning: "Qué lástima / Qué pena.",
    example: "What a shame, I really wanted to go.",
    example_translation: "Qué lástima, de verdad quería ir.",
    category: "Opinions & Reactions",
    tag: "Present"
  },

  // 5. Agreeing & Disagreeing
  {
    chunk: "I totally agree.",
    ipa: "/aɪ ˈtoʊtəli əˈɡriː/",
    meaning: "Estoy totalmente de acuerdo.",
    example: "I totally agree, that's exactly what I think.",
    example_translation: "Estoy totalmente de acuerdo, eso es exactamente lo que pienso.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "I couldn't agree more.",
    ipa: "/aɪ ˈkʊdənt əˈɡriː mɔːr/",
    meaning: "No podría estar más de acuerdo.",
    example: "I couldn't agree more, well said.",
    example_translation: "No podría estar más de acuerdo, bien dicho.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "Exactly!",
    ipa: "/ɪɡˈzæktli/",
    meaning: "¡Exactamente!",
    example: "Exactly! That's what I've been saying.",
    example_translation: "¡Exactamente! Eso es lo que he estado diciendo.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "That's true.",
    ipa: "/ðæts truː/",
    meaning: "Eso es verdad.",
    example: "That's true, I hadn't considered that.",
    example_translation: "Eso es verdad, no había considerado eso.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "Fair enough.",
    ipa: "/fɛər ɪˈnʌf/",
    meaning: "Me parece justo / Me parece razonable.",
    example: "Fair enough, that's a reasonable point.",
    example_translation: "Me parece justo, es un punto razonable.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "I see your point, but...",
    ipa: "/aɪ siː jɔːr pɔɪnt bʌt/",
    meaning: "Entiendo tu punto, pero...",
    example: "I see your point, but I still think we should wait.",
    example_translation: "Entiendo tu punto, pero sigo pensando que deberíamos esperar.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "I'm not sure I agree.",
    ipa: "/aɪm nɒt ʃʊər aɪ əˈɡriː/",
    meaning: "No estoy seguro de estar de acuerdo.",
    example: "I'm not sure I agree, can you explain more?",
    example_translation: "No estoy seguro de estar de acuerdo, ¿puedes explicar más?",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "I don't think so.",
    ipa: "/aɪ doʊnt θɪŋk soʊ/",
    meaning: "No lo creo.",
    example: "I don't think so, it doesn't seem right.",
    example_translation: "No lo creo, no parece correcto.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "Not necessarily.",
    ipa: "/nɒt ˌnɛsəˈsɛrəli/",
    meaning: "No necesariamente.",
    example: "Not necessarily, it depends on the situation.",
    example_translation: "No necesariamente, depende de la situación.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "It's not that simple.",
    ipa: "/ɪts nɒt ðæt ˈsɪmpəl/",
    meaning: "No es tan sencillo.",
    example: "It's not that simple, there are a lot of factors.",
    example_translation: "No es tan sencillo, hay muchos factores.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "On the other hand,...",
    ipa: "/ɒn ði ˈʌðər hænd/",
    meaning: "Por otro lado / Por otra parte,...",
    example: "On the other hand, it could save us a lot of time.",
    example_translation: "Por otro lado, podría ahorrarnos mucho tiempo.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "Then again,...",
    ipa: "/ðɛn əˈɡɛn/",
    meaning: "Pensándolo bien / Aun así,...",
    example: "Then again, we might regret not trying.",
    example_translation: "Pensándolo bien, podríamos arrepentirnos de no intentarlo.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "That depends.",
    ipa: "/ðæt dɪˈpɛndz/",
    meaning: "Eso depende.",
    example: "That depends on how much time we have.",
    example_translation: "Eso depende de cuánto tiempo tengamos.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "Actually, I think...",
    ipa: "/ˈæktʃuəli aɪ θɪŋk/",
    meaning: "En realidad, creo que...",
    example: "Actually, I think we should start over.",
    example_translation: "En realidad, creo que deberíamos empezar de nuevo.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },
  {
    chunk: "To some extent, yes.",
    ipa: "/tuː sʌm ɪkˈstɛnt jɛs/",
    meaning: "Hasta cierto punto, sí.",
    example: "To some extent, yes, but not completely.",
    example_translation: "Hasta cierto punto, sí, pero no completamente.",
    category: "Agreeing & Disagreeing",
    tag: "Present"
  },

  // 6. Giving Reasons & Explanations
  {
    chunk: "The thing is,...",
    ipa: "/ðə θɪŋ ɪz/",
    meaning: "El asunto es que... / Lo que pasa es que...",
    example: "The thing is, I already promised to help someone else.",
    example_translation: "El asunto es que ya prometí ayudar a alguien más.",
    category: "Giving Reasons & Explanations",
    tag: "Present"
  },
  {
    chunk: "That's because...",
    ipa: "/ðæts bɪˈkɒz/",
    meaning: "Eso es porque...",
    example: "That's because the flight got delayed.",
    example_translation: "Eso es porque el vuelo se retrasó.",
    category: "Giving Reasons & Explanations",
    tag: "Present"
  },
  {
    chunk: "The reason is...",
    ipa: "/ðə ˈriːzən ɪz/",
    meaning: "La razón es...",
    example: "The reason is we ran out of budget.",
    example_translation: "La razón es que nos quedamos sin presupuesto.",
    category: "Giving Reasons & Explanations",
    tag: "Present"
  },
  {
    chunk: "What I mean is...",
    ipa: "/wʌt aɪ miːn ɪz/",
    meaning: "Lo que quiero decir es...",
    example: "What I mean is we need more time, not more people.",
    example_translation: "Lo que quiero decir es que necesitamos más tiempo, no más gente.",
    category: "Giving Reasons & Explanations",
    tag: "Present"
  },
  {
    chunk: "Basically,...",
    ipa: "/ˈbeɪsɪkəli/",
    meaning: "Básicamente,...",
    example: "Basically, the whole plan changed last minute.",
    example_translation: "Básicamente, todo el plan cambió a último momento.",
    category: "Giving Reasons & Explanations",
    tag: "Present"
  },
  {
    chunk: "In other words,...",
    ipa: "/ɪn ˈʌðər wɜːrdz/",
    meaning: "En otras palabras,...",
    example: "In other words, we're starting from scratch.",
    example_translation: "En otras palabras, estamos empezando desde cero.",
    category: "Giving Reasons & Explanations",
    tag: "Present"
  },
  {
    chunk: "Let me put it this way.",
    ipa: "/lɛt miː pʊt ɪt ðɪs weɪ/",
    meaning: "Déjame ponerlo de esta manera.",
    example: "Let me put it this way: it's complicated.",
    example_translation: "Déjame ponerlo de esta manera: es complicado.",
    category: "Giving Reasons & Explanations",
    tag: "Present"
  },
  {
    chunk: "It's just that...",
    ipa: "/ɪts dʒʌst ðæt/",
    meaning: "Es solo que...",
    example: "It's just that I'm not comfortable with the idea.",
    example_translation: "Es solo que no me siento cómodo con la idea.",
    category: "Giving Reasons & Explanations",
    tag: "Present"
  },
  {
    chunk: "As a matter of fact,...",
    ipa: "/æz ə ˈmætər əv fækt/",
    meaning: "De hecho / En realidad,...",
    example: "As a matter of fact, I was about to call you.",
    example_translation: "De hecho, estaba a punto de llamarte.",
    category: "Giving Reasons & Explanations",
    tag: "Present"
  },
  {
    chunk: "Come to think of it,...",
    ipa: "/kʌm tuː θɪŋk əv ɪt/",
    meaning: "Pensándolo bien,...",
    example: "Come to think of it, that does sound familiar.",
    example_translation: "Pensándolo bien, eso me suena familiar.",
    category: "Giving Reasons & Explanations",
    tag: "Present"
  },

  // 7. Asking For & Offering Help
  {
    chunk: "Could you do me a favor?",
    ipa: "/kʊd juː duː miː ə ˈfeɪvər/",
    meaning: "¿Me harías un favor?",
    example: "Could you do me a favor and grab my bag?",
    example_translation: "¿Me harías un favor y tomarías mi bolso?",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "Would you mind...?",
    ipa: "/wʊd juː maɪnd/",
    meaning: "¿Te importaría...?",
    example: "Would you mind closing the window?",
    example_translation: "¿Te importaría cerrar la ventana?",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "Do you mind if I...?",
    ipa: "/duː juː maɪnd ɪf aɪ/",
    meaning: "¿Te molesta si yo...?",
    example: "Do you mind if I join you?",
    example_translation: "¿Te molesta si me uno a ustedes?",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "Can I ask you something?",
    ipa: "/kæn aɪ æsk juː ˈsʌmθɪŋ/",
    meaning: "¿Puedo preguntarte algo?",
    example: "Can I ask you something personal?",
    example_translation: "¿Puedo preguntarte algo personal?",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "Can you help me with this?",
    ipa: "/kæn juː hɛlp miː wɪð ðɪs/",
    meaning: "¿Puedes ayudarme con esto?",
    example: "Can you help me with this spreadsheet?",
    example_translation: "¿Puedes ayudarme con esta hoja de cálculo?",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "Let me know if you need anything.",
    ipa: "/lɛt miː noʊ ɪf juː niːd ˈɛnɪθɪŋ/",
    meaning: "Avísame si necesitas cualquier cosa.",
    example: "Let me know if you need anything before the trip.",
    example_translation: "Avísame si necesitas cualquier cosa antes del viaje.",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "I'll take care of it.",
    ipa: "/aɪl teɪk kɛər əv ɪt/",
    meaning: "Yo me encargo de ello.",
    example: "Don't worry, I'll take care of it.",
    example_translation: "No te preocupes, yo me encargo de ello.",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "I've got it.",
    ipa: "/aɪv ɡɒt ɪt/",
    meaning: "Yo me encargo / Ya lo tengo controlado.",
    example: "I've got it, you don't need to help.",
    example_translation: "Yo lo tengo controlado, no necesitas ayudar.",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "No problem at all.",
    ipa: "/noʊ ˈprɒbləm æt ɔːl/",
    meaning: "Sin problema alguno.",
    example: "No problem at all, happy to help.",
    example_translation: "Sin problema alguno, feliz de ayudar.",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "It's on me.",
    ipa: "/ɪts ɒn miː/",
    meaning: "Invito yo / Va por mi cuenta.",
    example: "Dinner is on me tonight.",
    example_translation: "La cena va por mi cuenta esta noche.",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "Let me get this.",
    ipa: "/lɛt miː ɡɛt ðɪs/",
    meaning: "Déjame pagar esto a mí.",
    example: "Let me get this, you paid last time.",
    example_translation: "Déjame pagar esto, tú pagaste la última vez.",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "Would you like some help?",
    ipa: "/wʊd juː laɪk sʌm hɛlp/",
    meaning: "¿Te gustaría algo de ayuda?",
    example: "Would you like some help carrying those boxes?",
    example_translation: "¿Te gustaría ayuda cargando esas cajas?",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "Feel free to...",
    ipa: "/fiːl friː tuː/",
    meaning: "Siéntete libre de...",
    example: "Feel free to reach out if you have questions.",
    example_translation: "Siéntete libre de contactarme si tienes preguntas.",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "Go ahead.",
    ipa: "/ɡoʊ əˈhɛd/",
    meaning: "Adelante / Pasa tú primero.",
    example: "Go ahead, I'll wait right here.",
    example_translation: "Adelante, yo esperaré justo aquí.",
    category: "Asking For & Offering Help",
    tag: "Present"
  },
  {
    chunk: "After you.",
    ipa: "/ˈæftər juː/",
    meaning: "Después de ti / Pase usted.",
    example: "After you, I'm in no rush.",
    example_translation: "Después de ti, no tengo prisa.",
    category: "Asking For & Offering Help",
    tag: "Present"
  },

  // 8. Asking For Clarification
  {
    chunk: "Sorry, what was that?",
    ipa: "/ˈsɒri wʌt wəz ðæt/",
    meaning: "Perdón, ¿qué dijiste?",
    example: "Sorry, what was that? I missed the last part.",
    example_translation: "Perdón, ¿qué dijiste? Me perdí la última parte.",
    category: "Asking For Clarification",
    tag: "Present"
  },
  {
    chunk: "Could you repeat that?",
    ipa: "/kʊd juː rɪˈpiːt ðæt/",
    meaning: "¿Podrías repetir eso?",
    example: "Could you repeat that a bit slower?",
    example_translation: "¿Podrías repetir eso un poco más despacio?",
    category: "Asking For Clarification",
    tag: "Present"
  },
  {
    chunk: "What do you mean by that?",
    ipa: "/wʌt duː juː miːn baɪ ðæt/",
    meaning: "¿Qué quieres decir exactamente con eso?",
    example: "What do you mean by that exactly?",
    example_translation: "¿Qué quieres decir exactamente con eso?",
    category: "Asking For Clarification",
    tag: "Present"
  },
  {
    chunk: "I'm not following.",
    ipa: "/aɪm nɒt ˈfɒloʊɪŋ/",
    meaning: "No te estoy siguiendo / No entiendo.",
    example: "I'm not following, can you explain again?",
    example_translation: "No te estoy siguiendo, ¿puedes explicarme de nuevo?",
    category: "Asking For Clarification",
    tag: "Present"
  },
  {
    chunk: "Can you say that again?",
    ipa: "/kæn juː seɪ ðæt əˈɡɛn/",
    meaning: "¿Puedes decir eso de nuevo?",
    example: "Can you say that again? I want to write it down.",
    example_translation: "¿Puedes decir eso de nuevo? Quiero anotarlo.",
    category: "Asking For Clarification",
    tag: "Present"
  },
  {
    chunk: "Sorry, I didn't catch that.",
    ipa: "/ˈsɒri aɪ ˈdɪdənt kætʃ ðæt/",
    meaning: "Disculpa, no capté eso.",
    example: "Sorry, I didn't catch that, could you repeat it?",
    example_translation: "Disculpa, no capté eso, ¿podrías repetirlo?",
    category: "Asking For Clarification",
    tag: "Present"
  },
  {
    chunk: "Could you speak a bit slower?",
    ipa: "/kʊd juː spiːk ə bɪt ˈsloʊər/",
    meaning: "¿Podrías hablar un poco más despacio?",
    example: "Could you speak a bit slower, please?",
    example_translation: "¿Podrías hablar un poco más despacio, por favor?",
    category: "Asking For Clarification",
    tag: "Present"
  },
  {
    chunk: "What's that called in English?",
    ipa: "/wʌts ðæt kɔːld ɪn ˈɪŋɡlɪʃ/",
    meaning: "¿Cómo se llama eso en inglés?",
    example: "What's that called in English?",
    example_translation: "¿Cómo se llama eso en inglés?",
    category: "Asking For Clarification",
    tag: "Present"
  },
  {
    chunk: "How do you spell that?",
    ipa: "/haʊ duː juː spɛl ðæt/",
    meaning: "¿Cómo se deletrea eso?",
    example: "How do you spell that? I want to search it later.",
    example_translation: "¿Cómo se deletrea eso? Quiero buscarlo más tarde.",
    category: "Asking For Clarification",
    tag: "Present"
  },
  {
    chunk: "Just to clarify,...",
    ipa: "/dʒʌst tuː ˈklærɪfaɪ/",
    meaning: "Solo para aclarar,...",
    example: "Just to clarify, are we meeting today or tomorrow?",
    example_translation: "Solo para aclarar, ¿nos reunimos hoy o mañana?",
    category: "Asking For Clarification",
    tag: "Present"
  },

  // 9. Common Present Questions
  {
    chunk: "What do you think about...?",
    ipa: "/wʌt duː juː θɪŋk əˈbaʊt/",
    meaning: "¿Qué opinas de...?",
    example: "What do you think about the new schedule?",
    example_translation: "¿Qué opinas del nuevo horario?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "What's your take on...?",
    ipa: "/wʌts jɔːr teɪk ɒn/",
    meaning: "¿Cuál es tu postura sobre...?",
    example: "What's your take on remote work?",
    example_translation: "¿Cuál es tu postura sobre el trabajo remoto?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "How's everything going?",
    ipa: "/haʊz ˈɛvriθɪŋ ˈɡoʊɪŋ/",
    meaning: "¿Cómo va todo?",
    example: "How's everything going with the new job?",
    example_translation: "¿Cómo va todo con el nuevo trabajo?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "What's new with you?",
    ipa: "/wʌts njuː wɪð juː/",
    meaning: "¿Qué hay de nuevo contigo?",
    example: "What's new with you these days?",
    example_translation: "¿Qué hay de nuevo contigo en estos días?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "What are you up to?",
    ipa: "/wʌt ɑːr juː ʌp tuː/",
    meaning: "¿En qué andas? / ¿Qué estás haciendo?",
    example: "What are you up to this afternoon?",
    example_translation: "¿En qué andas esta tarde?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "What do you usually do on weekends?",
    ipa: "/wʌt duː juː ˈjuːʒuəli duː ɒn ˈwiːkɛndz/",
    meaning: "¿Qué sueles hacer los fines de semana?",
    example: "What do you usually do on weekends?",
    example_translation: "¿Qué sueles hacer los fines de semana?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "How often do you...?",
    ipa: "/haʊ ˈɒfən duː juː/",
    meaning: "¿Con qué frecuencia tú...?",
    example: "How often do you go to the gym?",
    example_translation: "¿Con qué frecuencia vas al gimnasio?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "Do you have any plans for today?",
    ipa: "/duː juː hæv ˈɛni plænz fər təˈdeɪ/",
    meaning: "¿Tienes planes para hoy?",
    example: "Do you have any plans for today?",
    example_translation: "¿Tienes planes para hoy?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "What's it like living in...?",
    ipa: "/wʌts ɪt laɪk ˈlɪvɪŋ ɪn/",
    meaning: "¿Cómo es vivir en...?",
    example: "What's it like living in a big city?",
    example_translation: "¿Cómo es vivir en una ciudad grande?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "Why do you say that?",
    ipa: "/waɪ duː juː seɪ ðæt/",
    meaning: "¿Por qué dices eso?",
    example: "Why do you say that? What happened?",
    example_translation: "¿Por qué dices eso? ¿Qué pasó?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "How does that work?",
    ipa: "/haʊ dʌz ðæt wɜːrk/",
    meaning: "¿Cómo funciona eso?",
    example: "How does that work exactly?",
    example_translation: "¿Cómo funciona eso exactamente?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "What's the difference between...?",
    ipa: "/wʌts ðə ˈdɪfərəns bɪˈtwiːn/",
    meaning: "¿Cuál es la diferencia entre...?",
    example: "What's the difference between these two options?",
    example_translation: "¿Cuál es la diferencia entre estas dos opciones?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "Is everything okay?",
    ipa: "/ɪz ˈɛvriθɪŋ oʊˈkeɪ/",
    meaning: "¿Está todo bien?",
    example: "Is everything okay? You seem quiet.",
    example_translation: "¿Está todo bien? Te ves muy callado.",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "What's going on?",
    ipa: "/wʌts ˈɡoʊɪŋ ɒn/",
    meaning: "¿Qué está pasando?",
    example: "What's going on with the project?",
    example_translation: "¿Qué está pasando con el proyecto?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "What do you recommend?",
    ipa: "/wʌt duː juː ˌrɛkəˈmɛnd/",
    meaning: "¿Qué recomiendas?",
    example: "What do you recommend on the menu?",
    example_translation: "¿Qué recomiendas del menú?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "How's work treating you?",
    ipa: "/haʊz wɜːrk ˈtriːtɪŋ juː/",
    meaning: "¿Cómo te va en el trabajo?",
    example: "How's work treating you lately?",
    example_translation: "¿Cómo te va en el trabajo últimamente?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "What's your favorite...?",
    ipa: "/wʌts jɔːr ˈfeɪvərɪt/",
    meaning: "¿Cuál es tu... favorito/a?",
    example: "What's your favorite thing about this city?",
    example_translation: "¿Cuál es tu aspecto favorito de esta ciudad?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "Do you happen to know...?",
    ipa: "/duː juː ˈhæpən tuː noʊ/",
    meaning: "¿De casualidad sabes...?",
    example: "Do you happen to know what time it starts?",
    example_translation: "¿De casualidad sabes a qué hora empieza?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "Have you got a minute?",
    ipa: "/hæv juː ɡɒt ə ˈmɪnɪt/",
    meaning: "¿Tienes un minuto?",
    example: "Have you got a minute to talk?",
    example_translation: "¿Tienes un minuto para hablar?",
    category: "Common Present Questions",
    tag: "Present"
  },
  {
    chunk: "Are you free right now?",
    ipa: "/ɑːr juː friː raɪt naʊ/",
    meaning: "¿Estás libre ahora mismo?",
    example: "Are you free right now, or should I call later?",
    example_translation: "¿Estás libre ahora mismo o debería llamar más tarde?",
    category: "Common Present Questions",
    tag: "Present"
  },

  // 10. Work & Daily Life
  {
    chunk: "I've got a lot on my plate.",
    ipa: "/aɪv ɡɒt ə lɒt ɒn maɪ pleɪt/",
    meaning: "Tengo mucho trabajo / asuntos pendientes.",
    example: "I've got a lot on my plate this week.",
    example_translation: "Tengo mucho trabajo sobre la mesa esta semana.",
    category: "Work & Daily Life",
    tag: "Present"
  },
  {
    chunk: "I'm swamped this week.",
    ipa: "/aɪm swɒmpt ðɪs wiːk/",
    meaning: "Estoy a tope / desbordado esta semana.",
    example: "I'm swamped this week, can we talk on Friday?",
    example_translation: "Estoy a tope esta semana, ¿podemos hablar el viernes?",
    category: "Work & Daily Life",
    tag: "Present"
  },
  {
    chunk: "Things are picking up at work.",
    ipa: "/θɪŋz ɑːr ˈpɪkɪŋ ʌp æt wɜːrk/",
    meaning: "Las cosas están cobrando ritmo en el trabajo.",
    example: "Things are picking up at work after a slow month.",
    example_translation: "Las cosas están cobrando ritmo en el trabajo después de un mes lento.",
    category: "Work & Daily Life",
    tag: "Present"
  },
  {
    chunk: "I work best under pressure.",
    ipa: "/aɪ wɜːrk bɛst ˈʌndər ˈprɛʃər/",
    meaning: "Trabajo mejor bajo presión.",
    example: "I work best under pressure, honestly.",
    example_translation: "Trabajo mejor bajo presión, honestamente.",
    category: "Work & Daily Life",
    tag: "Present"
  },
  {
    chunk: "It's not my strong suit.",
    ipa: "/ɪts nɒt maɪ strɒŋ suːt/",
    meaning: "No es mi fuerte.",
    example: "Public speaking is not my strong suit.",
    example_translation: "Hablar en público no es mi fuerte.",
    category: "Work & Daily Life",
    tag: "Present"
  },
  {
    chunk: "I'm still getting the hang of it.",
    ipa: "/aɪm stɪl ˈɡɛtɪŋ ðə hæŋ əv ɪt/",
    meaning: "Todavía le estoy agarrando el truco.",
    example: "I'm still getting the hang of the new software.",
    example_translation: "Todavía le estoy agarrando el truco al nuevo software.",
    category: "Work & Daily Life",
    tag: "Present"
  },
  {
    chunk: "It comes with the territory.",
    ipa: "/ɪt kʌmz wɪð ðə ˈtɛrɪtəri/",
    meaning: "Es parte del oficio / Es normal en esta situación.",
    example: "It's stressful, but it comes with the territory.",
    example_translation: "Es estresante, pero es parte del oficio.",
    category: "Work & Daily Life",
    tag: "Present"
  },
  {
    chunk: "I wear a lot of hats at work.",
    ipa: "/aɪ wɛər ə lɒt əv hæts æt wɜːrk/",
    meaning: "Tengo muchos roles / funciones en el trabajo.",
    example: "I wear a lot of hats at work, from sales to support.",
    example_translation: "Tengo muchos roles en el trabajo, desde ventas hasta soporte.",
    category: "Work & Daily Life",
    tag: "Present"
  },
  {
    chunk: "That's above my pay grade.",
    ipa: "/ðæts əˈbʌv maɪ peɪ ɡreɪd/",
    meaning: "Eso escapa a mis responsabilidades / no me corresponde a mí.",
    example: "That's above my pay grade, ask my manager.",
    example_translation: "Eso escapa a mi nivel, pregúntale a mi gerente.",
    category: "Work & Daily Life",
    tag: "Present"
  },
  {
    chunk: "Let's touch base later.",
    ipa: "/lɛts tʌtʃ beɪs ˈleɪtər/",
    meaning: "Sincronicemos / hablemos más tarde.",
    example: "Let's touch base later this afternoon.",
    example_translation: "Sincronicemos más tarde esta tarde.",
    category: "Work & Daily Life",
    tag: "Present"
  },

  // 11. Food & Preferences
  {
    chunk: "I'm starving.",
    ipa: "/aɪm ˈstɑːrvɪŋ/",
    meaning: "Me muero de hambre.",
    example: "I'm starving, let's order something now.",
    example_translation: "Me muero de hambre, ordenemos algo ahora.",
    category: "Food & Preferences",
    tag: "Present"
  },
  {
    chunk: "I could eat.",
    ipa: "/aɪ kʊd iːt/",
    meaning: "Comería algo / Tengo algo de apetito.",
    example: "I could eat, are you hungry too?",
    example_translation: "Comería algo, ¿tú también tienes hambre?",
    category: "Food & Preferences",
    tag: "Present"
  },
  {
    chunk: "What are you in the mood for?",
    ipa: "/wʌt ɑːr juː ɪn ðə muːd fɔːr/",
    meaning: "¿De qué tienes ganas (de comer/hacer)?",
    example: "What are you in the mood for tonight?",
    example_translation: "¿De qué tienes ganas esta noche?",
    category: "Food & Preferences",
    tag: "Present"
  },
  {
    chunk: "I'm not really a fan of...",
    ipa: "/aɪm nɒt ˈrɪəli ə fæn əv/",
    meaning: "No soy muy fan de... / No me apasiona...",
    example: "I'm not really a fan of spicy food.",
    example_translation: "No soy muy fan de la comida picante.",
    category: "Food & Preferences",
    tag: "Present"
  },
  {
    chunk: "I'm craving something sweet.",
    ipa: "/aɪm ˈkreɪvɪŋ ˈsʌmθɪŋ swiːt/",
    meaning: "Tengo antojo de algo dulce.",
    example: "I'm craving something sweet after dinner.",
    example_translation: "Tengo antojo de algo dulce después de cenar.",
    category: "Food & Preferences",
    tag: "Present"
  },
  {
    chunk: "It's to die for.",
    ipa: "/ɪts tuː daɪ fɔːr/",
    meaning: "Está para chuparse los dedos / Es una maravilla.",
    example: "Try the cheesecake, it's to die for.",
    example_translation: "Prueba el pastel de queso, está para chuparse los dedos.",
    category: "Food & Preferences",
    tag: "Present"
  },
  {
    chunk: "I'll have the same.",
    ipa: "/aɪl hæv ðə seɪm/",
    meaning: "Pediré lo mismo.",
    example: "I'll have the same, that looks great.",
    example_translation: "Pediré lo mismo, eso se ve genial.",
    category: "Food & Preferences",
    tag: "Present"
  },
  {
    chunk: "Check, please.",
    ipa: "/tʃɛk pliːz/",
    meaning: "La cuenta, por favor.",
    example: "Check, please, whenever you get a chance.",
    example_translation: "La cuenta, por favor, cuando tenga un oportunidad.",
    category: "Food & Preferences",
    tag: "Present"
  },
  {
    chunk: "Let's split the bill.",
    ipa: "/lɛts splɪt ðə bɪl/",
    meaning: "Dividamos la cuenta a partes iguales.",
    example: "Let's split the bill, it's easier.",
    example_translation: "Dividamos la cuenta, es más fácil.",
    category: "Food & Preferences",
    tag: "Present"
  },
  {
    chunk: "I'm watching what I eat.",
    ipa: "/aɪm ˈwɒtʃɪŋ wʌt aɪ iːt/",
    meaning: "Estoy cuidando lo que como.",
    example: "I'm watching what I eat this month.",
    example_translation: "Estoy cuidando lo que como este mes.",
    category: "Food & Preferences",
    tag: "Present"
  },

  // 12. Useful Connectors (Any Tense)
  {
    chunk: "Anyway,...",
    ipa: "/ˈɛniweɪ/",
    meaning: "En fin / Como sea,...",
    example: "Anyway, let's get back to the main topic.",
    example_translation: "En fin, volvamos al tema principal.",
    category: "Useful Connectors",
    tag: "Present"
  },
  {
    chunk: "By the way,...",
    ipa: "/baɪ ðə weɪ/",
    meaning: "Por cierto,...",
    example: "By the way, did you get my message?",
    example_translation: "Por cierto, ¿recibiste mi mensaje?",
    category: "Useful Connectors",
    tag: "Present"
  },
  {
    chunk: "Speaking of which,...",
    ipa: "/ˈspiːkɪŋ əv wɪtʃ/",
    meaning: "Hablando de lo cual,...",
    example: "Speaking of which, have you talked to her yet?",
    example_translation: "Hablando de lo cual, ¿ya hablaste con ella?",
    category: "Useful Connectors",
    tag: "Present"
  },
  {
    chunk: "That said,...",
    ipa: "/ðæt sɛd/",
    meaning: "Dicho esto / Aun así,...",
    example: "That said, I think it's worth trying.",
    example_translation: "Dicho esto, creo que vale la pena intentarlo.",
    category: "Useful Connectors",
    tag: "Present"
  },
  {
    chunk: "Other than that,...",
    ipa: "/ˈʌðər ðən ðæt/",
    meaning: "Aparte de eso,...",
    example: "Other than that, everything went smoothly.",
    example_translation: "Aparte de eso, todo salió sin problemas.",
    category: "Useful Connectors",
    tag: "Present"
  },
  {
    chunk: "As I was saying,...",
    ipa: "/æz aɪ wəz ˈseɪɪŋ/",
    meaning: "Como iba diciendo,...",
    example: "As I was saying, we need a new plan.",
    example_translation: "Como iba diciendo, necesitamos un nuevo plan.",
    category: "Useful Connectors",
    tag: "Present"
  },
  {
    chunk: "Where was I?",
    ipa: "/wɛər wəz aɪ/",
    meaning: "¿En qué me quedé? / ¿Por dónde iba?",
    example: "Sorry, where was I? I lost my train of thought.",
    example_translation: "Perdón, ¿en qué me quedé? Perdí el hilo de mi pensamiento.",
    category: "Useful Connectors",
    tag: "Present"
  },
  {
    chunk: "Moving on,...",
    ipa: "/ˈmuːvɪŋ ɒn/",
    meaning: "Pasando a otro tema,...",
    example: "Moving on, let's talk about the budget.",
    example_translation: "Pasando a otro tema, hablemos del presupuesto.",
    category: "Useful Connectors",
    tag: "Present"
  },
  {
    chunk: "Not to change the subject, but...",
    ipa: "/nɒt tuː tʃeɪndʒ ðə ˈsʌbdʒɪkt bʌt/",
    meaning: "No es por cambiar de tema, pero...",
    example: "Not to change the subject, but did you eat yet?",
    example_translation: "No es por cambiar de tema, ¿pero ya comiste?",
    category: "Useful Connectors",
    tag: "Present"
  },
  {
    chunk: "Just out of curiosity,...",
    ipa: "/dʒʌst aʊt əv ˌkjʊəriˈɒsɪti/",
    meaning: "Solo por curiosidad,...",
    example: "Just out of curiosity, how much did that cost?",
    example_translation: "Solo por curiosidad, ¿cuánto costó eso?",
    category: "Useful Connectors",
    tag: "Present"
  },

  // ── PAST ───────────────────────────────────────────────────────────────
  // 13. Talking About Experiences
  {
    chunk: "Have you ever been to...?",
    ipa: "/hæv juː ˈɛvər biːn tuː/",
    meaning: "¿Alguna vez has estado en...?",
    example: "Have you ever been to Japan?",
    example_translation: "¿Alguna vez has estado en Japón?",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "I've never done that before.",
    ipa: "/aɪv ˈnɛvər dʌn ðæt bɪˈfɔːr/",
    meaning: "Nunca he hecho eso antes.",
    example: "I've never done that before, I'm a bit nervous.",
    example_translation: "Nunca he hecho eso antes, estoy un poco nervioso.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "I used to...",
    ipa: "/aɪ juːst tuː/",
    meaning: "Yo solía...",
    example: "I used to play the guitar in high school.",
    example_translation: "Yo solía tocar la guitarra en la secundaria.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "Back in the day,...",
    ipa: "/bæk ɪn ðə deɪ/",
    meaning: "En mis tiempos / Antaño,...",
    example: "Back in the day, we didn't even have cell phones.",
    example_translation: "En mis tiempos, ni siquiera teníamos celulares.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "When I was younger,...",
    ipa: "/wɛn aɪ wəz ˈjʌŋɡər/",
    meaning: "Cuando era más joven,...",
    example: "When I was younger, I wanted to be a pilot.",
    example_translation: "Cuando era más joven, quería ser piloto.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "I remember when...",
    ipa: "/aɪ rɪˈmɛmbər wɛn/",
    meaning: "Recuerdo cuando...",
    example: "I remember when we first met at that conference.",
    example_translation: "Recuerdo cuando nos conocimos en esa conferencia.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "That reminds me of the time...",
    ipa: "/ðæt rɪˈmaɪndz miː əv ðə taɪm/",
    meaning: "Eso me recuerda la vez en que...",
    example: "That reminds me of the time we got lost in Rome.",
    example_translation: "Eso me recuerda la vez que nos perdimos en Roma.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "I'll never forget when...",
    ipa: "/aɪl ˈnɛvər fərˈɡɛt wɛn/",
    meaning: "Nunca olvidaré cuando...",
    example: "I'll never forget when we won the championship.",
    example_translation: "Nunca olvidaré cuando ganamos el campeonato.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "It was the first time I...",
    ipa: "/ɪt wəz ðə fɜːrst taɪm aɪ/",
    meaning: "Fue la primera vez que yo...",
    example: "It was the first time I tried sushi.",
    example_translation: "Fue la primera vez que probé sushi.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "I've always wanted to...",
    ipa: "/aɪv ˈɔːlweɪz ˈwɒntɪd tuː/",
    meaning: "Siempre he querido...",
    example: "I've always wanted to visit New Zealand.",
    example_translation: "Siempre he querido visitar Nueva Zelanda.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "I've been meaning to...",
    ipa: "/aɪv biːn ˈmiːnɪŋ tuː/",
    meaning: "He estado queriendo / teniendo la intención de...",
    example: "I've been meaning to call you back.",
    example_translation: "He estado queriendo devolverte la llamada.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "I finally got around to...",
    ipa: "/aɪ ˈfaɪnəli ɡɒt əˈraʊnd tuː/",
    meaning: "Por fin me di el tiempo de / pude...",
    example: "I finally got around to fixing the sink.",
    example_translation: "Por fin me di el tiempo de arreglar el lavabo.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "Once, I...",
    ipa: "/wʌns aɪ/",
    meaning: "Una vez, yo...",
    example: "Once, I forgot my passport at the airport.",
    example_translation: "Una vez, olvidé mi pasaporte en el aeropuerto.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "There was this one time...",
    ipa: "/ðɛər wəz ðɪs wʌn taɪm/",
    meaning: "Hubo una ocasión en que...",
    example: "There was this one time we missed our flight.",
    example_translation: "Hubo una ocasión en que perdimos nuestro vuelo.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "Looking back,...",
    ipa: "/ˈlʊkɪŋ bæk/",
    meaning: "Mirando hacia atrás / En retrospectiva,...",
    example: "Looking back, it was the best decision I made.",
    example_translation: "En retrospectiva, fue la mejor decisión que tomé.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "It turned out to be...",
    ipa: "/ɪt tɜːrnd aʊt tuː biː/",
    meaning: "Resultó ser...",
    example: "It turned out to be a great trip after all.",
    example_translation: "Resultó ser un gran viaje después de todo.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "As it turned out,...",
    ipa: "/æz ɪt tɜːrnd aʊt/",
    meaning: "Como resultó al final,...",
    example: "As it turned out, the meeting was cancelled.",
    example_translation: "Como resultó al final, la reunión fue cancelada.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "That's how I ended up...",
    ipa: "/ðæts haʊ aɪ ˈɛndɪd ʌp/",
    meaning: "Así fue como terminé...",
    example: "That's how I ended up working in marketing.",
    example_translation: "Así fue como terminé trabajando en marketing.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "I learned that the hard way.",
    ipa: "/aɪ lɜːrnd ðæt ðə hɑːrd weɪ/",
    meaning: "Lo aprendí a la mala.",
    example: "I learned that the hard way after losing my files.",
    example_translation: "Lo aprendí a la mala tras perder mis archivos.",
    category: "Talking About Experiences",
    tag: "Past"
  },
  {
    chunk: "It was worth it.",
    ipa: "/ɪt wəz wɜːrθ ɪt/",
    meaning: "Valió la pena.",
    example: "It was a long trip, but it was worth it.",
    example_translation: "Fue un viaje largo, pero valió la pena.",
    category: "Talking About Experiences",
    tag: "Past"
  },

  // 14. Narrating Past Events
  {
    chunk: "So, what happened?",
    ipa: "/soʊ wʌt ˈhæpənd/",
    meaning: "Bueno, ¿qué pasó?",
    example: "So, what happened after I left?",
    example_translation: "Bueno, ¿qué pasó después de que me fui?",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "Guess what happened.",
    ipa: "/ɡɛs wʌt ˈhæpənd/",
    meaning: "Adivina qué pasó.",
    example: "Guess what happened at work today.",
    example_translation: "Adivina qué pasó en el trabajo hoy.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "You won't believe what happened.",
    ipa: "/juː woʊnt bɪˈliːv wʌt ˈhæpənd/",
    meaning: "No vas a creer lo que pasó.",
    example: "You won't believe what happened this morning.",
    example_translation: "No vas a creer lo que pasó esta mañana.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "Long story short,...",
    ipa: "/lɔːŋ ˈstɔːri ʃɔːrt/",
    meaning: "En resumen / Para no hacer el cuento largo,...",
    example: "Long story short, we missed the train.",
    example_translation: "En resumen, perdimos el tren.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "To make a long story short,...",
    ipa: "/tuː meɪk ə lɔːŋ ˈstɔːri ʃɔːrt/",
    meaning: "Para resumir la historia,...",
    example: "To make a long story short, we got it fixed.",
    example_translation: "Para resumir la historia, logramos arreglarlo.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "Everything was going fine until...",
    ipa: "/ˈɛvriθɪŋ wəz ˈɡoʊɪŋ faɪn ənˈtɪl/",
    meaning: "Todo iba bien hasta que...",
    example: "Everything was going fine until the power went out.",
    example_translation: "Todo iba bien hasta que se cortó la luz.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "Out of nowhere,...",
    ipa: "/aʊt əv ˈnoʊwɛər/",
    meaning: "De la nada,...",
    example: "Out of nowhere, it started pouring rain.",
    example_translation: "De la nada, empezó a llover a cántaros.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "All of a sudden,...",
    ipa: "/ɔːl əv ə ˈsʌdən/",
    meaning: "De repente / De un momento a otro,...",
    example: "All of a sudden, the lights turned off.",
    example_translation: "De repente, las luces se apagaron.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "Right in the middle of it,...",
    ipa: "/raɪt ɪn ðə ˈmɪdəl əv ɪt/",
    meaning: "Justo en medio de ello,...",
    example: "Right in the middle of it, my phone died.",
    example_translation: "Justo en medio de ello, se me apagó el teléfono.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "It all started when...",
    ipa: "/ɪt ɔːl ˈstɑːrtɪd wɛn/",
    meaning: "Todo empezó cuando...",
    example: "It all started when we decided to renovate the kitchen.",
    example_translation: "Todo empezó cuando decidimos remodelar la cocina.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "One thing led to another.",
    ipa: "/wʌn θɪŋ lɛd tuː əˈnʌðər/",
    meaning: "Una cosa llevó a la otra.",
    example: "One thing led to another, and we ended up traveling together.",
    example_translation: "Una cosa llevó a la otra y terminamos viajando juntos.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "In the end,...",
    ipa: "/ɪn ði ɛnd/",
    meaning: "Al final,...",
    example: "In the end, everything worked out fine.",
    example_translation: "Al final, todo salió bien.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "It ended up...",
    ipa: "/ɪt ˈɛndɪd ʌp/",
    meaning: "Terminó...",
    example: "It ended up costing more than we expected.",
    example_translation: "Terminó costando más de lo que esperábamos.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "It didn't go as planned.",
    ipa: "/ɪt ˈdɪdənt ɡoʊ æz plænd/",
    meaning: "No salió como estaba planeado.",
    example: "The trip didn't go as planned, but it was fun.",
    example_translation: "El viaje no salió como estaba planeado, pero fue divertido.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "It was a complete disaster.",
    ipa: "/ɪt wəz ə kəmˈpliːt dɪˈzæstər/",
    meaning: "Fue un desastre total.",
    example: "The presentation was a complete disaster.",
    example_translation: "La presentación fue un desastre total.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "It went better than expected.",
    ipa: "/ɪt wɛnt ˈbɛtər ðən ɪkˈspɛktɪd/",
    meaning: "Salió mejor de lo esperado.",
    example: "It went better than expected, honestly.",
    example_translation: "Salió mejor de lo esperado, honestamente.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "I couldn't believe my eyes.",
    ipa: "/aɪ ˈkʊdənt bɪˈliːv maɪ aɪz/",
    meaning: "No podía creer lo que veían mis ojos.",
    example: "I couldn't believe my eyes when I saw the results.",
    example_translation: "No podía creer lo que veían mis ojos al ver los resultados.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "I was in the middle of...",
    ipa: "/aɪ wəz ɪn ðə ˈmɪdəl əv/",
    meaning: "Estaba en medio de...",
    example: "I was in the middle of cooking when you called.",
    example_translation: "Estaba a mitad de cocinar cuando llamaste.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "Just as I was about to...",
    ipa: "/dʒʌst æz aɪ wəz əˈbaʊt tuː/",
    meaning: "Justo cuando estaba a punto de...",
    example: "Just as I was about to leave, the phone rang.",
    example_translation: "Justo cuando estaba a punto de salir, sonó el teléfono.",
    category: "Narrating Past Events",
    tag: "Past"
  },
  {
    chunk: "Before I knew it,...",
    ipa: "/bɪˈfɔːr aɪ njuː ɪt/",
    meaning: "Antes de darme cuenta / En un abrir y cerrar de ojos,...",
    example: "Before I knew it, two hours had passed.",
    example_translation: "Antes de darme cuenta, habían pasado dos horas.",
    category: "Narrating Past Events",
    tag: "Past"
  },

  // 15. Common Past Questions
  {
    chunk: "What did you do last weekend?",
    ipa: "/wʌt dɪd juː duː læst ˈwiːkɛnd/",
    meaning: "¿Qué hiciste el fin de semana pasado?",
    example: "What did you do last weekend?",
    example_translation: "¿Qué hiciste el fin de semana pasado?",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "How was your trip?",
    ipa: "/haʊ wəz jɔːr trɪp/",
    meaning: "¿Qué tal tu viaje?",
    example: "How was your trip? Tell me everything.",
    example_translation: "¿Qué tal tu viaje? Cuéntamelo todo.",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "How did it go?",
    ipa: "/haʊ dɪd ɪt ɡoʊ/",
    meaning: "¿Cómo te fue / cómo salió?",
    example: "How did it go with the client?",
    example_translation: "¿Cómo te fue con el cliente?",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "What happened to you?",
    ipa: "/wʌt ˈhæpənd tuː juː/",
    meaning: "¿Qué te pasó?",
    example: "What happened to you? You look tired.",
    example_translation: "¿Qué te pasó? Te ves cansado.",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "Where were you?",
    ipa: "/wɛər wɚ juː/",
    meaning: "¿Dónde estabas?",
    example: "Where were you last night? I called twice.",
    example_translation: "¿Dónde estabas anoche? Llamé dos veces.",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "Did you have a good time?",
    ipa: "/dɪd juː hæv ə ɡʊd taɪm/",
    meaning: "¿La pasaste bien?",
    example: "Did you have a good time at the party?",
    example_translation: "¿La pasaste bien en la fiesta?",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "What was it like?",
    ipa: "/wʌt wəz ɪt laɪk/",
    meaning: "¿Cómo fue? / ¿Qué tal la experiencia?",
    example: "What was it like living abroad?",
    example_translation: "¿Cómo fue vivir en el extranjero?",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "When did you find out?",
    ipa: "/wɛn dɪd juː faɪnd aʊt/",
    meaning: "¿Cuándo te enteraste?",
    example: "When did you find out about the news?",
    example_translation: "¿Cuándo te enteraste de la noticia?",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "How long did it take?",
    ipa: "/haʊ lɔːŋ dɪd ɪt teɪk/",
    meaning: "¿Cuánto tiempo tomó?",
    example: "How long did it take to finish the project?",
    example_translation: "¿Cuánto tiempo tomó terminar el proyecto?",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "Why didn't you tell me?",
    ipa: "/waɪ ˈdɪdənt juː tɛl miː/",
    meaning: "¿Por qué no me dijiste?",
    example: "Why didn't you tell me sooner?",
    example_translation: "¿Por qué no me dijiste antes?",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "Who told you that?",
    ipa: "/huː toʊld juː ðæt/",
    meaning: "¿Quién te dijo eso?",
    example: "Who told you that? It's not true.",
    example_translation: "¿Quién te dijo eso? No es verdad.",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "What made you decide that?",
    ipa: "/wʌt meɪd juː dɪˈsaɪd ðæt/",
    meaning: "¿Qué te hizo decidir eso?",
    example: "What made you decide that in the end?",
    example_translation: "¿Qué te hizo decidir eso al final?",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "Did you manage to...?",
    ipa: "/dɪd juː ˈmænɪdʒ tuː/",
    meaning: "¿Lograste...?",
    example: "Did you manage to finish on time?",
    example_translation: "¿Lograste terminar a tiempo?",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "Did everything go okay?",
    ipa: "/dɪd ˈɛvriθɪŋ ɡoʊ oʊˈkeɪ/",
    meaning: "¿Salió todo bien?",
    example: "Did everything go okay at the doctor?",
    example_translation: "¿Salió todo bien con el médico?",
    category: "Common Past Questions",
    tag: "Past"
  },
  {
    chunk: "How did you find out about it?",
    ipa: "/haʊ dɪd juː faɪnd aʊt əˈbaʊt ɪt/",
    meaning: "¿Cómo te enteraste de eso?",
    example: "How did you find out about it so fast?",
    example_translation: "¿Cómo te enteraste de eso tan rápido?",
    category: "Common Past Questions",
    tag: "Past"
  },

  // 16. Apologizing & Explaining What Happened
  {
    chunk: "I'm sorry about that.",
    ipa: "/aɪm ˈsɒri əˈbaʊt ðæt/",
    meaning: "Lamento eso.",
    example: "I'm sorry about that, it won't happen again.",
    example_translation: "Lamento eso, no volverá a suceder.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "I didn't mean to.",
    ipa: "/aɪ ˈdɪdənt miːn tuː/",
    meaning: "No fue mi intención.",
    example: "I didn't mean to interrupt you.",
    example_translation: "No fue mi intención interrumpiros.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "It won't happen again.",
    ipa: "/ɪt woʊnt ˈhæpən əˈɡɛn/",
    meaning: "No volverá a pasar.",
    example: "I promise it won't happen again.",
    example_translation: "Prometo que no volverá a pasar.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "I feel really bad about it.",
    ipa: "/aɪ fiːl ˈrɪəli bæd əˈbaʊt ɪt/",
    meaning: "Me siento muy mal por ello.",
    example: "I feel really bad about it, I should've called.",
    example_translation: "Me siento muy mal por ello, debí haber llamado.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "I should have told you sooner.",
    ipa: "/aɪ ʃʊd hæv toʊld juː ˈsuːnər/",
    meaning: "Debí habértelo dicho antes.",
    example: "I should have told you sooner, I'm sorry.",
    example_translation: "Debí habértelo dicho antes, lo siento.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "I completely forgot.",
    ipa: "/aɪ kəmˈpliːtli fərˈɡɒt/",
    meaning: "Se me olvidó por completo.",
    example: "I completely forgot about the meeting.",
    example_translation: "Se me olvidó por completo la reunión.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "It slipped my mind.",
    ipa: "/ɪt slɪpt maɪ maɪnd/",
    meaning: "Se me pasó de la mente.",
    example: "Sorry, it completely slipped my mind.",
    example_translation: "Lo siento, se me pasó por completo de la mente.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "Something came up.",
    ipa: "/ˈsʌmθɪŋ keɪm ʌp/",
    meaning: "Surgió algo de imprevisto.",
    example: "Something came up and I couldn't make it.",
    example_translation: "Surgió algo y no pude llegar.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "I got caught up with...",
    ipa: "/aɪ ɡɒt kɔːt ʌp wɪð/",
    meaning: "Me entretuve / me quedé atrapado con...",
    example: "I got caught up with work and lost track of time.",
    example_translation: "Me entretuve con el trabajo y perdí la noción del tiempo.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "I lost track of time.",
    ipa: "/aɪ lɒst træk əv taɪm/",
    meaning: "Perdí la noción del tiempo.",
    example: "Sorry I'm late, I lost track of time.",
    example_translation: "Disculpa la demora, perdí la noción del tiempo.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "There's no excuse for it.",
    ipa: "/ðɛərz noʊ ɪkˈskjuːs fər ɪt/",
    meaning: "No hay excusa para ello.",
    example: "There's no excuse for it, I should've been on time.",
    example_translation: "No hay excusa para ello, debí haber llegado a tiempo.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "I take full responsibility.",
    ipa: "/aɪ teɪk fʊl rɪˌspɒnsəˈbɪlɪti/",
    meaning: "Asumo toda la responsabilidad.",
    example: "I take full responsibility for the mistake.",
    example_translation: "Asumo toda la responsabilidad por el error.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "Let me make it up to you.",
    ipa: "/lɛt miː meɪk ɪt ʌp tuː juː/",
    meaning: "Déjame compensártelo.",
    example: "Let me make it up to you, dinner's on me.",
    example_translation: "Déjame compensártelo, la cena invita la casa.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "Thanks for understanding.",
    ipa: "/θæŋks fər ˌʌndərˈstændɪŋ/",
    meaning: "Gracias por entender.",
    example: "Thanks for understanding, I appreciate it.",
    example_translation: "Gracias por entender, lo aprecio mucho.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },
  {
    chunk: "No hard feelings.",
    ipa: "/noʊ hɑːrd ˈfiːlɪŋz/",
    meaning: "Sin resentimientos / No hay problema.",
    example: "No hard feelings, these things happen.",
    example_translation: "Sin resentimientos, estas cosas pasan.",
    category: "Apologizing & Explaining",
    tag: "Past"
  },

  // ── FUTURE ──────────────────────────────────────────────────────────────
  // 17. Plans & Intentions
  {
    chunk: "I'm planning to...",
    ipa: "/aɪm ˈplænɪŋ tuː/",
    meaning: "Tengo planeado...",
    example: "I'm planning to move next month.",
    example_translation: "Tengo planeado mudarme el próximo mes.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I'm thinking about...",
    ipa: "/aɪm ˈθɪŋkɪŋ əˈbaʊt/",
    meaning: "Estoy pensando en...",
    example: "I'm thinking about changing careers.",
    example_translation: "Estoy pensando en cambiar de carrera.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I'm going to...",
    ipa: "/aɪm ˈɡoʊɪŋ tuː/",
    meaning: "Voy a...",
    example: "I'm going to call her tomorrow.",
    example_translation: "Voy a llamarla mañana.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I'm about to...",
    ipa: "/aɪm əˈbaʊt tuː/",
    meaning: "Estoy a punto de...",
    example: "I'm about to leave the house.",
    example_translation: "Estoy a punto de salir de casa.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I can't wait to...",
    ipa: "/aɪ kænt weɪt tuː/",
    meaning: "No puedo esperar para...",
    example: "I can't wait to see you again.",
    example_translation: "No puedo esperar para verte de nuevo.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I'm looking forward to...",
    ipa: "/aɪm ˈlʊkɪŋ ˈfɔːrwərd tuː/",
    meaning: "Tengo muchas ganas de / Espero con ansias...",
    example: "I'm looking forward to the weekend.",
    example_translation: "Tengo muchas ganas de que llegue el fin de semana.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "Sooner or later, I'll...",
    ipa: "/ˈsuːnər ɔːr ˈleɪtər aɪl/",
    meaning: "Tarde o temprano, yo...",
    example: "Sooner or later, I'll have to make a decision.",
    example_translation: "Tarde o temprano, tendré que tomar una decisión.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "One of these days,...",
    ipa: "/wʌn əv ðiːz deɪz/",
    meaning: "Uno de estos días,...",
    example: "One of these days, I'll finally learn to swim.",
    example_translation: "Uno de estos días, finalmente aprenderé a nadar.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I might...",
    ipa: "/aɪ maɪt/",
    meaning: "Puede que yo...",
    example: "I might stay home this weekend.",
    example_translation: "Puede que me quede en casa este fin de semana.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I'll probably...",
    ipa: "/aɪl ˈprɒbəbli/",
    meaning: "Probablemente yo...",
    example: "I'll probably finish it by Friday.",
    example_translation: "Probablemente lo termine para el viernes.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "There's a chance I'll...",
    ipa: "/ðɛərz ə tʃæns aɪl/",
    meaning: "Hay posibilidad de que yo...",
    example: "There's a chance I'll be traveling next week.",
    example_translation: "Hay posibilidad de que esté viajando la próxima semana.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I have every intention of...",
    ipa: "/aɪ hæv ˈɛvri ɪnˈtɛnʃən əv/",
    meaning: "Tengo toda la intención de...",
    example: "I have every intention of finishing on time.",
    example_translation: "Tengo toda la intención de terminar a tiempo.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I'm determined to...",
    ipa: "/aɪm dɪˈtɜːrmɪnd tuː/",
    meaning: "Estoy decidido a...",
    example: "I'm determined to learn English this year.",
    example_translation: "Estoy decidido a aprender inglés este año.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "My plan is to...",
    ipa: "/maɪ plæn ɪz tuː/",
    meaning: "Mi plan es...",
    example: "My plan is to save up and travel next summer.",
    example_translation: "Mi plan es ahorrar y viajar el próximo verano.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "Eventually, I'll...",
    ipa: "/ɪˈvɛntʃuəli aɪl/",
    meaning: "Eventualmente, yo...",
    example: "Eventually, I'll get around to organizing my files.",
    example_translation: "Eventualmente, me daré tiempo de organizar mis archivos.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "First things first, I'll...",
    ipa: "/fɜːrst θɪŋz fɜːrst aɪl/",
    meaning: "Lo primero es lo primero, yo...",
    example: "First things first, I'll answer these emails.",
    example_translation: "Lo primero es lo primero, responderé estos correos.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "Once I..., I'll...",
    ipa: "/wʌns aɪ aɪl/",
    meaning: "Una vez que yo..., yo...",
    example: "Once I finish this project, I'll take a break.",
    example_translation: "Una vez que termine este proyecto, me tomaré un descanso.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "As soon as I can, I'll...",
    ipa: "/æz suːn æz aɪ kæn aɪl/",
    meaning: "Tan pronto como pueda, yo...",
    example: "As soon as I can, I'll send you the details.",
    example_translation: "Tan pronto como pueda, te enviaré los detalles.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I'll get around to it.",
    ipa: "/aɪl ɡɛt əˈraʊnd tuː ɪt/",
    meaning: "Ya me daré tiempo para ello.",
    example: "I haven't cleaned the garage, but I'll get around to it.",
    example_translation: "No he limpiado la cochera, pero ya me daré el tiempo.",
    category: "Plans & Intentions",
    tag: "Future"
  },
  {
    chunk: "I'll cross that bridge when I get to it.",
    ipa: "/aɪl krɒs ðæt brɪdʒ wɛn aɪ ɡɛt tuː ɪt/",
    meaning: "Resolveré ese problema cuando llegue el momento.",
    example: "I'm not worried about that yet — I'll cross that bridge when I get to it.",
    example_translation: "No me preocupa eso aún — resolveré ese problema cuando llegue el momento.",
    category: "Plans & Intentions",
    tag: "Future"
  },

  // 18. Predictions & Hopes
  {
    chunk: "I bet...",
    ipa: "/aɪ bɛt/",
    meaning: "Apuesto a que...",
    example: "I bet it's going to rain later.",
    example_translation: "Apuesto a que va a llover más tarde.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "I have a feeling that...",
    ipa: "/aɪ hæv ə ˈfiːlɪŋ ðæt/",
    meaning: "Tengo el presentimiento de que...",
    example: "I have a feeling that this will work out.",
    example_translation: "Tengo el presentimiento de que esto saldrá bien.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "Chances are,...",
    ipa: "/ˈtʃænsɪz ɑːr/",
    meaning: "Lo más probable es que...",
    example: "Chances are, the meeting will be rescheduled.",
    example_translation: "Lo más probable es que la reunión sea reprogramada.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "It's likely that...",
    ipa: "/ɪts ˈlaɪkli ðæt/",
    meaning: "Es probable que...",
    example: "It's likely that prices will go up next year.",
    example_translation: "Es probable que los precios suban el próximo año.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "I doubt it.",
    ipa: "/aɪ daʊt ɪt/",
    meaning: "Lo dudo.",
    example: "Will they come? I doubt it.",
    example_translation: "¿Vendrán? Lo dudo.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "I hope so.",
    ipa: "/aɪ hoʊp soʊ/",
    meaning: "Espero que sí.",
    example: "Will it be sunny tomorrow? I hope so.",
    example_translation: "¿Estará soleado mañana? Espero que sí.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "Hopefully,...",
    ipa: "/ˈhoʊpfəli/",
    meaning: "Ojalá / Con suerte,...",
    example: "Hopefully, the flight won't be delayed.",
    example_translation: "Con suerte, el vuelo no se retrasará.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "Fingers crossed.",
    ipa: "/ˈfɪŋɡərz krɒst/",
    meaning: "Dedos cruzados / Que haya suerte.",
    example: "Fingers crossed the interview goes well.",
    example_translation: "Dedos cruzados para que la entrevista salga bien.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "Who knows what'll happen.",
    ipa: "/huː noʊz wʌtəl ˈhæpən/",
    meaning: "Quién sabe qué pasará.",
    example: "Who knows what'll happen after the announcement.",
    example_translation: "Quién sabe qué pasará tras el anuncio.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "Only time will tell.",
    ipa: "/ˈoʊnli taɪm wɪl tɛl/",
    meaning: "Solo el tiempo lo dirá.",
    example: "Only time will tell if this was the right choice.",
    example_translation: "Solo el tiempo dirá si esta fue la elección correcta.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "I wouldn't be surprised if...",
    ipa: "/aɪ ˈwʊdənt biː sərˈpraɪzd ɪf/",
    meaning: "No me sorprendería si...",
    example: "I wouldn't be surprised if they cancel the event.",
    example_translation: "No me sorprendería si cancelan el evento.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "It's bound to happen.",
    ipa: "/ɪts baʊnd tuː ˈhæpən/",
    meaning: "Es seguro / inevitable que suceda.",
    example: "It's bound to happen sooner or later.",
    example_translation: "Es inevitable que suceda tarde o temprano.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "Mark my words.",
    ipa: "/mɑːrk maɪ wɜːrdz/",
    meaning: "Recuerda mis palabras.",
    example: "Mark my words, this idea will take off.",
    example_translation: "Recuerda mis palabras, esta idea despegará.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "Things are looking up.",
    ipa: "/θɪŋz ɑːr ˈlʊkɪŋ ʌp/",
    meaning: "Las cosas están mejorando.",
    example: "Things are looking up after a rough start.",
    example_translation: "Las cosas están mejorando tras un inicio difícil.",
    category: "Predictions & Hopes",
    tag: "Future"
  },
  {
    chunk: "I've got a good feeling about this.",
    ipa: "/aɪv ɡɒt ə ɡʊd ˈfiːlɪŋ əˈbaʊt ðɪs/",
    meaning: "Tengo una buena corazonada sobre esto.",
    example: "I've got a good feeling about this project.",
    example_translation: "Tengo una buena corazonada sobre este proyecto.",
    category: "Predictions & Hopes",
    tag: "Future"
  },

  // 19. Making Plans With Others
  {
    chunk: "Are you free this weekend?",
    ipa: "/ɑːr juː friː ðɪs ˈwiːkɛnd/",
    meaning: "¿Estás libre este fin de semana?",
    example: "Are you free this weekend? Let's catch up.",
    example_translation: "¿Estás libre este fin de semana? Pongámonos al día.",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "Do you want to grab a coffee sometime?",
    ipa: "/duː juː wɒnt tuː ɡræb ə ˈkɒfi ˈsʌmtaɪm/",
    meaning: "¿Quieres tomar un café en algún momento?",
    example: "Do you want to grab a coffee sometime this week?",
    example_translation: "¿Quieres tomar un café en algún momento esta semana?",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "We should hang out soon.",
    ipa: "/wiː ʃʊd hæŋ aʊt suːn/",
    meaning: "Deberíamos salir / pasar el rato pronto.",
    example: "We should hang out soon, it's been too long.",
    example_translation: "Deberíamos salir pronto, ha pasado demasiado tiempo.",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "Let's set something up.",
    ipa: "/lɛts sɛt ˈsʌmθɪŋ ʌp/",
    meaning: "Organicemos / coordinemos algo.",
    example: "Let's set something up for next week.",
    example_translation: "Organicemos algo para la próxima semana.",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "What time works for you?",
    ipa: "/wʌt taɪm wɜːrks fər juː/",
    meaning: "¿A qué hora te conviene?",
    example: "What time works for you tomorrow?",
    example_translation: "¿A qué hora te conviene mañana?",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "Let's keep in touch.",
    ipa: "/lɛts kiːp ɪn tʌtʃ/",
    meaning: "Sigamos en contacto.",
    example: "Let's keep in touch, don't be a stranger.",
    example_translation: "Sigamos en contacto, no te pierdas.",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "I'll text you the details.",
    ipa: "/aɪl tɛkst juː ðə ˈdiːteɪlz/",
    meaning: "Te enviaré los detalles por mensaje.",
    example: "I'll text you the details later tonight.",
    example_translation: "Te enviaré los detalles por mensaje más tarde.",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "Let me check my schedule.",
    ipa: "/lɛt miː tʃɛk maɪ ˈskɛdʒuːl/",
    meaning: "Déjame revisar mi agenda.",
    example: "Let me check my schedule and get back to you.",
    example_translation: "Déjame revisar mi agenda y te aviso.",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "I'll get back to you on that.",
    ipa: "/aɪl ɡɛt bæk tuː juː ɒn ðæt/",
    meaning: "Te responderé / te confirmo sobre eso más tarde.",
    example: "I'll get back to you on that by tomorrow.",
    example_translation: "Te confirmo sobre eso a más tardar mañana.",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "Count me in.",
    ipa: "/kaʊnt miː ɪn/",
    meaning: "Cuenta conmigo.",
    example: "Count me in, sounds like fun.",
    example_translation: "Cuenta conmigo, suena divertido.",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "I'm in.",
    ipa: "/aɪm ɪn/",
    meaning: "Me apunto / Estoy dentro.",
    example: "I'm in, what time should we meet?",
    example_translation: "Me apunto, ¿a qué hora nos vemos?",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "I'll pass this time.",
    ipa: "/aɪl pæs ðɪs taɪm/",
    meaning: "Paso esta vez / Dejo pasar la oportunidad.",
    example: "I'll pass this time, but thanks for inviting me.",
    example_translation: "Paso esta vez, pero gracias por invitarme.",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "Let's play it by ear.",
    ipa: "/lɛts pleɪ ɪt baɪ ɪər/",
    meaning: "Improvisemos sobre la marcha.",
    example: "Let's play it by ear and decide when we get there.",
    example_translation: "Improvisemos sobre la marcha y decidamos al llegar.",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "Same time, same place?",
    ipa: "/seɪm taɪm seɪm pleɪs/",
    meaning: "¿A la misma hora y en el mismo lugar?",
    example: "Same time, same place next week?",
    example_translation: "¿A la misma hora y en el mismo lugar la próxima semana?",
    category: "Making Plans With Others",
    tag: "Future"
  },
  {
    chunk: "It's a date.",
    ipa: "/ɪts ə deɪt/",
    meaning: "Quedamos en eso / Queda agendado.",
    example: "Saturday at noon? It's a date.",
    example_translation: "¿Sábado al mediodía? Quedamos en eso.",
    category: "Making Plans With Others",
    tag: "Future"
  },

  // 20. Common Future Questions
  {
    chunk: "What are you doing this weekend?",
    ipa: "/wʌt ɑːr juː ˈduːɪŋ ðɪs ˈwiːkɛnd/",
    meaning: "¿Qué vas a hacer este fin de semana?",
    example: "What are you doing this weekend?",
    example_translation: "¿Qué vas a hacer este fin de semana?",
    category: "Common Future Questions",
    tag: "Future"
  },
  {
    chunk: "Where do you see yourself in five years?",
    ipa: "/wɛər duː juː siː jɔːrˈsɛlf ɪn faɪv jɪərz/",
    meaning: "¿Dónde te ves dentro de cinco años?",
    example: "Where do you see yourself in five years?",
    example_translation: "¿Dónde te ves dentro de cinco años?",
    category: "Common Future Questions",
    tag: "Future"
  },
  {
    chunk: "What's next for you?",
    ipa: "/wʌts nɛkst fər juː/",
    meaning: "¿Qué sigue para ti?",
    example: "So, what's next for you after graduation?",
    example_translation: "Y bien, ¿qué sigue para ti después de la graduación?",
    category: "Common Future Questions",
    tag: "Future"
  },
  {
    chunk: "Any plans for tonight?",
    ipa: "/ˈɛni plænz fər təˈnaɪt/",
    meaning: "¿Algún plan para esta noche?",
    example: "Any plans for tonight, or are you staying in?",
    example_translation: "¿Algún plan para esta noche o te quedarás en casa?",
    category: "Common Future Questions",
    tag: "Future"
  },
  {
    chunk: "When are you leaving?",
    ipa: "/wɛn ɑːr juː ˈliːvɪŋ/",
    meaning: "¿Cuándo te vas / te marchas?",
    example: "When are you leaving for the airport?",
    example_translation: "¿Cuándo sales hacia el aeropuerto?",
    category: "Common Future Questions",
    tag: "Future"
  },
  {
    chunk: "What time should we meet?",
    ipa: "/wʌt taɪm ʃʊd wiː miːt/",
    meaning: "¿A qué hora deberíamos reunirnos?",
    example: "What time should we meet tomorrow?",
    example_translation: "¿A qué hora deberíamos encontrarnos mañana?",
    category: "Common Future Questions",
    tag: "Future"
  },
  {
    chunk: "Will you be there?",
    ipa: "/wɪl juː biː ðɛər/",
    meaning: "¿Estarás allí?",
    example: "Will you be there on Saturday?",
    example_translation: "¿Estarás allí el sábado?",
    category: "Common Future Questions",
    tag: "Future"
  },
  {
    chunk: "How long will it take?",
    ipa: "/haʊ lɔːŋ wɪl ɪt teɪk/",
    meaning: "¿Cuánto tiempo tomará?",
    example: "How long will it take to get there?",
    example_translation: "¿Cuánto tiempo tomará llegar allí?",
    category: "Common Future Questions",
    tag: "Future"
  },
  {
    chunk: "What do you think will happen?",
    ipa: "/wʌt duː juː θɪŋk wɪl ˈhæpən/",
    meaning: "¿Qué crees que pasará?",
    example: "What do you think will happen next?",
    example_translation: "¿Qué crees que pasará a continuación?",
    category: "Common Future Questions",
    tag: "Future"
  },
  {
    chunk: "Are you coming or not?",
    ipa: "/ɑːr juː ˈkʌmɪŋ ɔːr nɒt/",
    meaning: "¿Vienes o no?",
    example: "Are you coming or not? We need to know.",
    example_translation: "¿Vienes o no? Necesitamos saber.",
    category: "Common Future Questions",
    tag: "Future"
  },

  // 21. Closing a Conversation
  {
    chunk: "Well, I should get going.",
    ipa: "/wɛl aɪ ʃʊd ɡɛt ˈɡoʊɪŋ/",
    meaning: "Bueno, debería irme marchando.",
    example: "Well, I should get going, it's getting late.",
    example_translation: "Bueno, debería irme marchando, se está haciendo tarde.",
    category: "Closing a Conversation",
    tag: "Future"
  },
  {
    chunk: "I don't want to keep you.",
    ipa: "/aɪ doʊnt wɒnt tuː kiːp juː/",
    meaning: "No quiero quitarte más tiempo.",
    example: "I don't want to keep you, I know you're busy.",
    example_translation: "No quiero quitarte más tiempo, sé que estás ocupado.",
    category: "Closing a Conversation",
    tag: "Future"
  },
  {
    chunk: "It was great catching up.",
    ipa: "/ɪt wəz ɡreɪt ˈkætʃɪŋ ʌp/",
    meaning: "Fue genial ponernos al día.",
    example: "It was great catching up with you.",
    example_translation: "Fue genial ponerme al día contigo.",
    category: "Closing a Conversation",
    tag: "Future"
  },
  {
    chunk: "Let's do this again sometime.",
    ipa: "/lɛts duː ðɪs əˈɡɛn ˈsʌmtaɪm/",
    meaning: "Repitamos esto en algún momento.",
    example: "Let's do this again sometime soon.",
    example_translation: "Repitamos esto pronto en algún momento.",
    category: "Closing a Conversation",
    tag: "Future"
  },
  {
    chunk: "Take care.",
    ipa: "/teɪk kɛər/",
    meaning: "Cuídate.",
    example: "Take care, talk soon.",
    example_translation: "Cuídate, hablamos pronto.",
    category: "Closing a Conversation",
    tag: "Future"
  },
  {
    chunk: "Talk to you later.",
    ipa: "/tɔːk tuː juː ˈleɪtər/",
    meaning: "Hablamos luego.",
    example: "Talk to you later, have a good one.",
    example_translation: "Hablamos luego, que tengas un buen día.",
    category: "Closing a Conversation",
    tag: "Future"
  },
  {
    chunk: "Catch you later.",
    ipa: "/kætʃ juː ˈleɪtər/",
    meaning: "Nos vemos luego.",
    example: "Catch you later, I'm off.",
    example_translation: "Nos vemos luego, me voy.",
    category: "Closing a Conversation",
    tag: "Future"
  },
  {
    chunk: "Have a good one.",
    ipa: "/hæv ə ɡʊd wʌn/",
    meaning: "¡Que te vaya bien! / ¡Que tengas un buen día!",
    example: "Have a good one, see you around.",
    example_translation: "¡Que te vaya bien, nos vemos por ahí!",
    category: "Closing a Conversation",
    tag: "Future"
  },
  {
    chunk: "Say hi to your family for me.",
    ipa: "/seɪ haɪ tuː jɔːr ˈfæmɪli fər miː/",
    meaning: "Saluda a tu familia de mi parte.",
    example: "Say hi to your family for me.",
    example_translation: "Saluda a tu familia de mi parte.",
    category: "Closing a Conversation",
    tag: "Future"
  },
  {
    chunk: "Until next time.",
    ipa: "/ənˈtɪl nɛkst taɪm/",
    meaning: "Hasta la próxima.",
    example: "Until next time, take care of yourself.",
    example_translation: "Hasta la próxima, cuídate.",
    category: "Closing a Conversation",
    tag: "Future"
  }
];

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Map into ChunkItem structure
const formattedChunks = rawChunks.map((item, index) => {
  const slug = slugify(item.chunk);
  const id = `${String(index + 1).padStart(3, "0")}-${slug}`;
  return {
    id,
    chunk: item.chunk,
    ipa: item.ipa,
    meaning: item.meaning,
    example: item.example,
    example_translation: item.example_translation,
    category: item.category,
    tag: item.tag
  };
});

console.log(`Formatted ${formattedChunks.length} chunks.`);

// Write to lib/chunk-of-day/data.ts
const dataTsContent = `import type { ChunkItem } from "./types";

export const CHUNKS_OF_THE_DAY: ChunkItem[] = ${JSON.stringify(formattedChunks, null, 2)};
`;

fs.writeFileSync(path.join(ROOT, "lib/chunk-of-day/data.ts"), dataTsContent, "utf-8");
console.log("Updated lib/chunk-of-day/data.ts");

// Generate Grammar Study Deck (public/grammar-decks/chunk-300-english-from-day-1.json)
// Exactly 6 cards required by Zod schema
const grammarDeckData = {
  meta: {
    eyebrow: "Mazo Especial · 300 Prefabricated Phrases",
    title: "300 Chunks to Speak English",
    titleEmphasis: "From Day 1",
    goal: "Domina 300 bloques conversacionales esenciales en presente, pasado y futuro para hablar con fluidez natural sin traducir en tu cabeza."
  },
  related: [
    { slug: "chunk-vida-cotidiana", label: "Chunks para la vida cotidiana" },
    { slug: "chunk-social-small-talk", label: "Social & Small Talk" },
    { slug: "chunk-discourse-markers", label: "Conectores del discurso" }
  ],
  cards: [
    {
      id: "chunk-300-card-1",
      tag: "Presente · Romper el hielo & Small Talk",
      title: "Iniciar conversaciones sin vacilar",
      lede: "Usa frases hechas en lugar de traducir palabra por palabra al saludar y hablar del clima.",
      blocks: [
        {
          type: "rules",
          rows: [
            { key: "Hey, how's it going?", value: "Hey, ¿cómo te va? · Hey, how's it going? Haven't seen you in a while!", highlights: ["how's it going"] },
            { key: "Long time no see!", value: "¡Cuánto tiempo sin verte! · Long time no see! How have you been?", highlights: ["Long time no see"] },
            { key: "Nice weather we're having, isn't it?", value: "Buen clima estamos teniendo, ¿verdad?", highlights: ["Nice weather"] },
            { key: "Can't complain", value: "No me puedo quejar · Can't complain, things are going fine.", highlights: ["Can't complain"] }
          ]
        }
      ],
      tip: {
        label: "Tip Fonético:",
        body: "\"How's it going?\" suele sonar fluido como /haʊzɪt ˈɡoʊɪŋ/ conectando las palabras."
      }
    },
    {
      id: "chunk-300-card-2",
      tag: "Presente · Opiniones & Acuerdos",
      title: "Expresar ideas y reaccionar",
      lede: "Estructuras clave para dar tu opinión, estar de acuerdo o disentir con educación.",
      blocks: [
        {
          type: "rules",
          rows: [
            { key: "If you ask me,...", value: "Si me preguntas a mí... · If you ask me, the second option is much better.", highlights: ["If you ask me"] },
            { key: "That makes sense", value: "Tiene sentido · That makes sense, thanks for explaining.", highlights: ["makes sense"] },
            { key: "I totally agree", value: "Estoy totalmente de acuerdo.", highlights: ["totally agree"] },
            { key: "I see your point, but...", value: "Entiendo tu punto, pero...", highlights: ["see your point"] }
          ]
        }
      ]
    },
    {
      id: "chunk-300-card-3",
      tag: "Presente · Ayuda & Trabajo",
      title: "Pedir favores y desenvolverse en el día a día",
      lede: "Frases de cortesía para ofrecer o pedir ayuda y hablar de tus tareas diarias.",
      blocks: [
        {
          type: "rules",
          rows: [
            { key: "Could you do me a favor?", value: "¿Me harías un favor? · Could you do me a favor and grab my bag?", highlights: ["do me a favor"] },
            { key: "I'll take care of it", value: "Yo me encargo de ello · Don't worry, I'll take care of it.", highlights: ["take care of it"] },
            { key: "I've got a lot on my plate", value: "Tengo mucho trabajo/pendientes.", highlights: ["lot on my plate"] },
            { key: "I'm still getting the hang of it", value: "Todavía le estoy agarrando el truco.", highlights: ["getting the hang of it"] }
          ]
        }
      ]
    },
    {
      id: "chunk-300-card-4",
      tag: "Pasado · Historias & Experiencias",
      title: "Relatar anécdotas y eventos pasados",
      lede: "Conectores e inicios narrativos para contar lo que viviste con dinamismo.",
      blocks: [
        {
          type: "rules",
          rows: [
            { key: "Have you ever been to...?", value: "¿Alguna vez has estado en...? · Have you ever been to Japan?", highlights: ["Have you ever been"] },
            { key: "That reminds me of the time...", value: "Eso me recuerda la vez en que...", highlights: ["reminds me of"] },
            { key: "Long story short,...", value: "En resumen / Para no hacer el cuento largo...", highlights: ["Long story short"] },
            { key: "Out of nowhere,...", value: "De la nada... · Out of nowhere, it started pouring rain.", highlights: ["Out of nowhere"] }
          ]
        }
      ]
    },
    {
      id: "chunk-300-card-5",
      tag: "Pasado · Disculpas & Explicaciones",
      title: "Explicar contratiempos y disculparse",
      lede: "Maneja malentendidos y retrasos con empatía y naturalidad.",
      blocks: [
        {
          type: "rules",
          rows: [
            { key: "I didn't mean to", value: "No fue mi intención · I didn't mean to interrupt you.", highlights: ["didn't mean to"] },
            { key: "It slipped my mind", value: "Se me pasó de la mente · Sorry, it completely slipped my mind.", highlights: ["slipped my mind"] },
            { key: "I lost track of time", value: "Perdí la noción del tiempo.", highlights: ["lost track of time"] },
            { key: "Let me make it up to you", value: "Déjame compensártelo · Dinner's on me.", highlights: ["make it up to you"] }
          ]
        }
      ]
    },
    {
      id: "chunk-300-card-6",
      tag: "Futuro · Planes, Predicciones & Cierres",
      title: "Proyectar el futuro y cerrar charlas",
      lede: "Formula planes con otros, haz predicciones y despídete sutilmente.",
      blocks: [
        {
          type: "rules",
          rows: [
            { key: "I'm looking forward to...", value: "Tengo muchas ganas de... · I'm looking forward to the weekend.", highlights: ["looking forward to"] },
            { key: "Chances are,...", value: "Lo más probable es que... · Chances are, the meeting will be rescheduled.", highlights: ["Chances are"] },
            { key: "Let's play it by ear", value: "Improvisemos sobre la marcha.", highlights: ["play it by ear"] },
            { key: "Well, I should get going", value: "Bueno, debería irme marchando · It's getting late.", highlights: ["should get going"] }
          ]
        }
      ],
      tip: {
        label: "Clave de Cierre:",
        body: "\"Have a good one\" y \"Talk to you later\" son los cierres universales más usados por hablantes nativos."
      }
    }
  ],
  quiz: [
    {
      q: "¿Qué frase dices para pedir disculpas por haber olvidado una cita de forma natural?",
      options: ["I didn't mean to", "Sorry, it completely slipped my mind!", "My memory went out."],
      answer: 1,
      explain: "'It slipped my mind' es la expresión idiomática perfecta para decir que algo se te olvidó por completo."
    },
    {
      q: "Si quieres sugerir improvisar un plan sobre la marcha sin agendar hora fija, ¿qué dices?",
      options: ["Let's play it by ear", "Let's do music later", "Plan without ears"],
      answer: 0,
      explain: "'Let me / Let's play it by ear' significa tomar decisiones a medida que suceden las cosas."
    },
    {
      q: "¿Cuál de estos chunks sirve para iniciar una conversación casual al reencontrarte con alguien?",
      options: ["Long time no see!", "Until next time", "I will leave now"],
      answer: 0,
      explain: "'Long time no see!' significa '¡Cuánto tiempo sin verte!' y es una apertura cálida y espontánea."
    }
  ]
};

fs.writeFileSync(
  path.join(ROOT, "public/grammar-decks/chunk-300-english-from-day-1.json"),
  JSON.stringify(grammarDeckData, null, 2) + "\n",
  "utf-8"
);
console.log("Created public/grammar-decks/chunk-300-english-from-day-1.json");
