import type { ChunkItem } from "./types";

/**
 * Tech / product career chunks: interviews, selling yourself, engineering
 * day-to-day, design critique, and stakeholder meetings. Gated behind the
 * `technology`/`work` interests (see lib/users/interests.ts) so they only
 * surface for learners who opted into that content — see
 * lib/chunk-of-day/queries.ts::filterChunksForInterests.
 */
export const TECH_CHUNKS: ChunkItem[] = [
  {
    "id": "tech-int-01-let-me-think-out-loud-for-a-second",
    "chunk": "Let me think out loud for a second.",
    "ipa": "/lɛt mi θɪŋk aʊt laʊd fɔr ə ˈsɛkənd/",
    "meaning": "Déjame pensar en voz alta un segundo.",
    "example": "Let me think out loud for a second — I want to make sure I explain this clearly.",
    "example_translation": "Déjame pensar en voz alta un segundo — quiero asegurarme de explicar esto con claridad.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Can you walk me through your approach?",
        "es": "¿Puedes explicarme tu enfoque?"
      },
      {
        "en": "Sure, let me think out loud for a second.",
        "es": "Claro, déjame pensar en voz alta un segundo."
      }
    ]
  },
  {
    "id": "tech-int-02-could-you-repeat-the-question-please",
    "chunk": "Could you repeat the question, please?",
    "ipa": "/kʊd ju rɪˈpit ðə ˈkwɛstʃən pliz/",
    "meaning": "¿Podrías repetir la pregunta, por favor?",
    "example": "Could you repeat the question, please? I want to make sure I understood it.",
    "example_translation": "¿Podrías repetir la pregunta, por favor? Quiero asegurarme de haberla entendido.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "So, how would you scale this system?",
        "es": "Entonces, ¿cómo escalarías este sistema?"
      },
      {
        "en": "Could you repeat the question, please?",
        "es": "¿Podrías repetir la pregunta, por favor?"
      }
    ]
  },
  {
    "id": "tech-int-03-whats-the-expected-input-size-here",
    "chunk": "What's the expected input size here?",
    "ipa": "/wʌts ðɪ ɪkˈspɛktɪd ˈɪnpʊt saɪz hɪr/",
    "meaning": "¿Cuál es el tamaño esperado de la entrada aquí?",
    "example": "What's the expected input size here? That affects which approach I'd choose.",
    "example_translation": "¿Cuál es el tamaño esperado de la entrada aquí? Eso afecta el enfoque que elegiría.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Here's the problem: find duplicates in an array.",
        "es": "Aquí está el problema: encuentra duplicados en un arreglo."
      },
      {
        "en": "Got it. What's the expected input size here?",
        "es": "Entendido. ¿Cuál es el tamaño esperado de la entrada aquí?"
      }
    ]
  },
  {
    "id": "tech-int-04-lets-start-with-a-brute-force-approach",
    "chunk": "Let's start with a brute-force approach.",
    "ipa": "/lɛts stɑrt wɪð ə ˈbrut fɔrs əˈproʊtʃ/",
    "meaning": "Empecemos con un enfoque de fuerza bruta.",
    "example": "Let's start with a brute-force approach, then optimize from there.",
    "example_translation": "Empecemos con un enfoque de fuerza bruta y luego optimizamos desde ahí.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "How do you want to tackle this?",
        "es": "¿Cómo quieres abordar esto?"
      },
      {
        "en": "Let's start with a brute-force approach.",
        "es": "Empecemos con un enfoque de fuerza bruta."
      }
    ]
  },
  {
    "id": "tech-int-05-the-time-complexity-here-is-o-n-log-n",
    "chunk": "The time complexity here is O(n log n).",
    "ipa": "/ðə taɪm kəmˈplɛksɪti hɪr ɪz oʊ ɛn lɔɡ ɛn/",
    "meaning": "La complejidad temporal aquí es O(n log n).",
    "example": "The time complexity here is O(n log n), which should be fast enough.",
    "example_translation": "La complejidad temporal aquí es O(n log n), lo cual debería ser suficientemente rápido.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "What's the runtime of your solution?",
        "es": "¿Cuál es el tiempo de ejecución de tu solución?"
      },
      {
        "en": "The time complexity here is O(n log n).",
        "es": "La complejidad temporal aquí es O(n log n)."
      }
    ]
  },
  {
    "id": "tech-int-06-id-optimize-this-later-if-i-had-more-tim",
    "chunk": "I'd optimize this later if I had more time.",
    "ipa": "/aɪd ˈɑptɪmaɪz ðɪs ˈleɪtər ɪf aɪ hæd mɔr taɪm/",
    "meaning": "Optimizaría esto después si tuviera más tiempo.",
    "example": "I'd optimize this later if I had more time, but this works for now.",
    "example_translation": "Optimizaría esto después si tuviera más tiempo, pero esto funciona por ahora.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Is this the most efficient version?",
        "es": "¿Es esta la versión más eficiente?"
      },
      {
        "en": "Not quite — I'd optimize this later if I had more time.",
        "es": "No exactamente — lo optimizaría después si tuviera más tiempo."
      }
    ]
  },
  {
    "id": "tech-int-07-can-i-ask-a-clarifying-question-first",
    "chunk": "Can I ask a clarifying question first?",
    "ipa": "/kæn aɪ æsk ə ˈklærəfaɪɪŋ ˈkwɛstʃən fɜrst/",
    "meaning": "¿Puedo hacer una pregunta aclaratoria primero?",
    "example": "Can I ask a clarifying question first, before I start coding?",
    "example_translation": "¿Puedo hacer una pregunta aclaratoria primero, antes de empezar a programar?",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Go ahead and start whenever you're ready.",
        "es": "Adelante, empieza cuando estés lista."
      },
      {
        "en": "Can I ask a clarifying question first?",
        "es": "¿Puedo hacer una pregunta aclaratoria primero?"
      }
    ]
  },
  {
    "id": "tech-int-08-in-my-previous-role-i-was-responsible-fo",
    "chunk": "In my previous role, I was responsible for the backend.",
    "ipa": "/ɪn maɪ ˈpriviəs roʊl aɪ wʌz rɪˈspɑnsəbəl fɔr ðə ˈbækɛnd/",
    "meaning": "En mi puesto anterior, era responsable del backend.",
    "example": "In my previous role, I was responsible for the backend and our API design.",
    "example_translation": "En mi puesto anterior, era responsable del backend y del diseño de nuestra API.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Tell me about your last position.",
        "es": "Cuéntame sobre tu último puesto."
      },
      {
        "en": "In my previous role, I was responsible for the backend.",
        "es": "En mi puesto anterior, era responsable del backend."
      }
    ]
  },
  {
    "id": "tech-int-09-i-led-a-team-of-four-engineers",
    "chunk": "I led a team of four engineers.",
    "ipa": "/aɪ lɛd ə tim ʌv fɔr ˈɛndʒəˈnɪrz/",
    "meaning": "Lideré un equipo de cuatro ingenieros.",
    "example": "I led a team of four engineers on a project that shipped last quarter.",
    "example_translation": "Lideré un equipo de cuatro ingenieros en un proyecto que lanzamos el trimestre pasado.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Have you had any leadership experience?",
        "es": "¿Has tenido experiencia liderando equipos?"
      },
      {
        "en": "Yes, I led a team of four engineers.",
        "es": "Sí, lideré un equipo de cuatro ingenieros."
      }
    ]
  },
  {
    "id": "tech-int-10-thats-a-great-question-let-me-break-it-d",
    "chunk": "That's a great question, let me break it down.",
    "ipa": "/ðæts ə ɡreɪt ˈkwɛstʃən lɛt mi breɪk ɪt daʊn/",
    "meaning": "Esa es una gran pregunta, déjame desglosarla.",
    "example": "That's a great question, let me break it down step by step.",
    "example_translation": "Esa es una gran pregunta, déjame desglosarla paso a paso.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "How would you handle a memory leak in production?",
        "es": "¿Cómo manejarías una fuga de memoria en producción?"
      },
      {
        "en": "That's a great question, let me break it down.",
        "es": "Esa es una gran pregunta, déjame desglosarla."
      }
    ]
  },
  {
    "id": "tech-int-11-i-ran-into-a-tricky-edge-case-with-null-",
    "chunk": "I ran into a tricky edge case with null values.",
    "ipa": "/aɪ ræn ˈɪntu ə ˈtrɪki ɛdʒ keɪs wɪð nʌl ˈvæljuz/",
    "meaning": "Me topé con un caso límite complicado con valores nulos.",
    "example": "I ran into a tricky edge case with null values halfway through.",
    "example_translation": "Me topé con un caso límite complicado con valores nulos a mitad de camino.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Did you hit any issues while coding this?",
        "es": "¿Tuviste algún problema mientras programabas esto?"
      },
      {
        "en": "Yeah, I ran into a tricky edge case with null values.",
        "es": "Sí, me topé con un caso límite complicado con valores nulos."
      }
    ]
  },
  {
    "id": "tech-int-12-id-rather-trade-off-readability-for-perf",
    "chunk": "I'd rather trade off readability for performance here.",
    "ipa": "/aɪd ˈræðər treɪd ɔf ˌridəˈbɪləti fɔr pərˈfɔrməns hɪr/",
    "meaning": "Preferiría sacrificar legibilidad por rendimiento aquí.",
    "example": "I'd rather trade off readability for performance here, since this runs on every request.",
    "example_translation": "Preferiría sacrificar legibilidad por rendimiento aquí, ya que esto corre en cada solicitud.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "This code is a bit dense, why not simplify it?",
        "es": "Este código es un poco denso, ¿por qué no simplificarlo?"
      },
      {
        "en": "I'd rather trade off readability for performance here.",
        "es": "Preferiría sacrificar legibilidad por rendimiento aquí."
      }
    ]
  },
  {
    "id": "tech-int-13-walk-me-through-your-thought-process",
    "chunk": "Walk me through your thought process.",
    "ipa": "/wɔk mi θru jɔr θɔt ˈprɑsɛs/",
    "meaning": "Explícame tu proceso de pensamiento.",
    "example": "Walk me through your thought process before you write any code.",
    "example_translation": "Explícame tu proceso de pensamiento antes de escribir cualquier código.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I think I have a solution.",
        "es": "Creo que tengo una solución."
      },
      {
        "en": "Great — walk me through your thought process.",
        "es": "Genial — explícame tu proceso de pensamiento."
      }
    ]
  },
  {
    "id": "tech-int-14-im-not-100-sure-but-my-best-guess-is",
    "chunk": "I'm not 100% sure, but my best guess is...",
    "ipa": "/aɪm nɑt wʌn ˈhʌndrəd pərˈsɛnt ʃʊr bʌt maɪ bɛst ɡɛs ɪz/",
    "meaning": "No estoy 100% segura, pero mi mejor suposición es...",
    "example": "I'm not 100% sure, but my best guess is it's a caching issue.",
    "example_translation": "No estoy 100% segura, pero mi mejor suposición es que es un problema de caché.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Why do you think the test is flaky?",
        "es": "¿Por qué crees que la prueba es inestable?"
      },
      {
        "en": "I'm not 100% sure, but my best guess is a race condition.",
        "es": "No estoy 100% segura, pero mi mejor suposición es una condición de carrera."
      }
    ]
  },
  {
    "id": "tech-int-15-id-like-to-revisit-that-decision-if-we-h",
    "chunk": "I'd like to revisit that decision if we have time.",
    "ipa": "/aɪd laɪk tu ˈrɪvɪzɪt ðæt dɪˈsɪʒən ɪf wi hæv taɪm/",
    "meaning": "Me gustaría revisar esa decisión si tenemos tiempo.",
    "example": "I'd like to revisit that decision if we have time at the end.",
    "example_translation": "Me gustaría revisar esa decisión si tenemos tiempo al final.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Let's move on to the next question.",
        "es": "Pasemos a la siguiente pregunta."
      },
      {
        "en": "Sure, but I'd like to revisit that decision if we have time.",
        "es": "Claro, pero me gustaría revisar esa decisión si tenemos tiempo."
      }
    ]
  },
  {
    "id": "tech-int-16-thats-outside-my-area-of-expertise-but-i",
    "chunk": "That's outside my area of expertise, but I'd research it.",
    "ipa": "/ðæts ˌaʊtˈsaɪd maɪ ˈɛriə ʌv ˌɛkspərˈtiz bʌt aɪd rɪˈsɜrtʃ ɪt/",
    "meaning": "Eso está fuera de mi área de experiencia, pero lo investigaría.",
    "example": "That's outside my area of expertise, but I'd research it before deciding.",
    "example_translation": "Eso está fuera de mi área de experiencia, pero lo investigaría antes de decidir.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "How would you configure the Kubernetes cluster?",
        "es": "¿Cómo configurarías el clúster de Kubernetes?"
      },
      {
        "en": "That's outside my area of expertise, but I'd research it.",
        "es": "Eso está fuera de mi área de experiencia, pero lo investigaría."
      }
    ]
  },
  {
    "id": "tech-int-17-i-made-a-mistake-there-let-me-fix-it",
    "chunk": "I made a mistake there — let me fix it.",
    "ipa": "/aɪ meɪd ə mɪˈsteɪk ðɛr lɛt mi fɪks ɪt/",
    "meaning": "Cometí un error ahí — déjame arreglarlo.",
    "example": "I made a mistake there — let me fix it before we move on.",
    "example_translation": "Cometí un error ahí — déjame arreglarlo antes de continuar.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I think there's a bug in that line.",
        "es": "Creo que hay un error en esa línea."
      },
      {
        "en": "You're right, I made a mistake there — let me fix it.",
        "es": "Tienes razón, cometí un error ahí — déjame arreglarlo."
      }
    ]
  },
  {
    "id": "tech-int-18-what-would-you-like-me-to-focus-on-first",
    "chunk": "What would you like me to focus on first?",
    "ipa": "/wʌt wʊd ju laɪk mi tu ˈfoʊkəs ɑn fɜrst/",
    "meaning": "¿En qué te gustaría que me enfoque primero?",
    "example": "What would you like me to focus on first, correctness or speed?",
    "example_translation": "¿En qué te gustaría que me enfoque primero, en la corrección o en la velocidad?",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "You can approach this however you want.",
        "es": "Puedes abordar esto como quieras."
      },
      {
        "en": "Okay, what would you like me to focus on first?",
        "es": "Bien, ¿en qué te gustaría que me enfoque primero?"
      }
    ]
  },
  {
    "id": "tech-int-19-i-usually-write-tests-before-i-write-the",
    "chunk": "I usually write tests before I write the implementation.",
    "ipa": "/aɪ ˈjuʒuəli raɪt tɛsts bɪˈfɔr aɪ raɪt ði ˌɪmpləmɛnˈteɪʃən/",
    "meaning": "Normalmente escribo pruebas antes de escribir la implementación.",
    "example": "I usually write tests before I write the implementation, when I can.",
    "example_translation": "Normalmente escribo pruebas antes de escribir la implementación, cuando puedo.",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Do you practice test-driven development?",
        "es": "¿Practicas desarrollo dirigido por pruebas?"
      },
      {
        "en": "Yes, I usually write tests before I write the implementation.",
        "es": "Sí, normalmente escribo pruebas antes de escribir la implementación."
      }
    ]
  },
  {
    "id": "tech-int-20-do-you-want-me-to-code-this-in-typescrip",
    "chunk": "Do you want me to code this in TypeScript or pseudocode?",
    "ipa": "/du ju wɑnt mi tu koʊd ðɪs ɪn ˈtaɪpˈskrɪpt ɔr ˈsudoʊkoʊd/",
    "meaning": "¿Quieres que codifique esto en TypeScript o en pseudocódigo?",
    "example": "Do you want me to code this in TypeScript or pseudocode, whichever is easier for you?",
    "example_translation": "¿Quieres que codifique esto en TypeScript o en pseudocódigo, lo que te resulte más fácil?",
    "category": "Tech Interviews",
    "tag": "Interview",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Let's move to the coding part of the interview.",
        "es": "Pasemos a la parte de código de la entrevista."
      },
      {
        "en": "Sure — do you want me to code this in TypeScript or pseudocode?",
        "es": "Claro — ¿quieres que codifique esto en TypeScript o en pseudocódigo?"
      }
    ]
  },
  {
    "id": "tech-sell-01-i-led-the-migration-that-cut-load-time-b",
    "chunk": "I led the migration that cut load time by 40%.",
    "ipa": "/aɪ lɛd ðə maɪˈɡreɪʃən ðæt kʌt loʊd taɪm baɪ ˈfɔrti pərˈsɛnt/",
    "meaning": "Lideré la migración que redujo el tiempo de carga en un 40%.",
    "example": "I led the migration that cut load time by 40% across the whole platform.",
    "example_translation": "Lideré la migración que redujo el tiempo de carga en un 40% en toda la plataforma.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "What's an achievement you're proud of?",
        "es": "¿De qué logro estás orgullosa?"
      },
      {
        "en": "I led the migration that cut load time by 40%.",
        "es": "Lideré la migración que redujo el tiempo de carga en un 40%."
      }
    ]
  },
  {
    "id": "tech-sell-02-im-looking-for-a-role-where-i-can-grow-i",
    "chunk": "I'm looking for a role where I can grow into a senior position.",
    "ipa": "/aɪm ˈlʊkɪŋ fɔr ə roʊl wɛr aɪ kæn ɡroʊ ˈɪntu ə ˈsinjər pəˈzɪʃən/",
    "meaning": "Busco un puesto donde pueda crecer hacia una posición senior.",
    "example": "I'm looking for a role where I can grow into a senior position over time.",
    "example_translation": "Busco un puesto donde pueda crecer hacia una posición senior con el tiempo.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "What are you looking for in your next job?",
        "es": "¿Qué buscas en tu próximo trabajo?"
      },
      {
        "en": "I'm looking for a role where I can grow into a senior position.",
        "es": "Busco un puesto donde pueda crecer hacia una posición senior."
      }
    ]
  },
  {
    "id": "tech-sell-03-is-there-any-flexibility-on-the-base-sal",
    "chunk": "Is there any flexibility on the base salary?",
    "ipa": "/ɪz ðɛr ˈɛni ˌflɛksəˈbɪləti ɑn ðə beɪs ˈsæləri/",
    "meaning": "¿Hay algo de flexibilidad en el salario base?",
    "example": "Is there any flexibility on the base salary, given my experience?",
    "example_translation": "¿Hay algo de flexibilidad en el salario base, dada mi experiencia?",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Here's our offer: $95,000 base.",
        "es": "Aquí está nuestra oferta: $95,000 de base."
      },
      {
        "en": "Thank you. Is there any flexibility on the base salary?",
        "es": "Gracias. ¿Hay algo de flexibilidad en el salario base?"
      }
    ]
  },
  {
    "id": "tech-sell-04-i-shipped-that-feature-ahead-of-schedule",
    "chunk": "I shipped that feature ahead of schedule.",
    "ipa": "/aɪ ʃɪpt ðæt ˈfitʃər əˈhɛd ʌv ˈskɛdʒul/",
    "meaning": "Lancé esa función antes de lo previsto.",
    "example": "I shipped that feature ahead of schedule and under budget.",
    "example_translation": "Lancé esa función antes de lo previsto y por debajo del presupuesto.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "How did that project go?",
        "es": "¿Cómo salió ese proyecto?"
      },
      {
        "en": "Really well — I shipped that feature ahead of schedule.",
        "es": "Muy bien — lancé esa función antes de lo previsto."
      }
    ]
  },
  {
    "id": "tech-sell-05-my-strongest-skill-is-turning-ambiguous-",
    "chunk": "My strongest skill is turning ambiguous requirements into a plan.",
    "ipa": "/maɪ ˈstrɔŋgɪst skɪl ɪz ˈtɜrnɪŋ æmˈbɪɡjuəs rɪˈkwaɪrmənts ˈɪntu ə plæn/",
    "meaning": "Mi habilidad más fuerte es convertir requisitos ambiguos en un plan.",
    "example": "My strongest skill is turning ambiguous requirements into a plan the team can execute.",
    "example_translation": "Mi habilidad más fuerte es convertir requisitos ambiguos en un plan que el equipo pueda ejecutar.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "What would you say is your biggest strength?",
        "es": "¿Cuál dirías que es tu mayor fortaleza?"
      },
      {
        "en": "My strongest skill is turning ambiguous requirements into a plan.",
        "es": "Mi habilidad más fuerte es convertir requisitos ambiguos en un plan."
      }
    ]
  },
  {
    "id": "tech-sell-06-i-mentored-two-junior-developers-on-my-l",
    "chunk": "I mentored two junior developers on my last team.",
    "ipa": "/aɪ ˈmɛntɔrd tu ˈdʒuːnjər dɪˈvɛləpərz ɑn maɪ læst tim/",
    "meaning": "Fui mentora de dos desarrolladores junior en mi último equipo.",
    "example": "I mentored two junior developers on my last team and both got promoted.",
    "example_translation": "Fui mentora de dos desarrolladores junior en mi último equipo y ambos fueron ascendidos.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Do you have experience mentoring others?",
        "es": "¿Tienes experiencia siendo mentora de otras personas?"
      },
      {
        "en": "Yes, I mentored two junior developers on my last team.",
        "es": "Sí, fui mentora de dos desarrolladores junior en mi último equipo."
      }
    ]
  },
  {
    "id": "tech-sell-07-id-love-to-hear-more-about-the-teams-roa",
    "chunk": "I'd love to hear more about the team's roadmap.",
    "ipa": "/aɪd lʌv tu hɪr mɔr əˈbaʊt ðə timz ˈroʊdmæp/",
    "meaning": "Me encantaría saber más sobre la hoja de ruta del equipo.",
    "example": "I'd love to hear more about the team's roadmap for next year.",
    "example_translation": "Me encantaría saber más sobre la hoja de ruta del equipo para el próximo año.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Do you have any questions for us?",
        "es": "¿Tienes alguna pregunta para nosotros?"
      },
      {
        "en": "Yes, I'd love to hear more about the team's roadmap.",
        "es": "Sí, me encantaría saber más sobre la hoja de ruta del equipo."
      }
    ]
  },
  {
    "id": "tech-sell-08-what-does-success-look-like-in-this-role",
    "chunk": "What does success look like in this role after six months?",
    "ipa": "/wʌt dʌz səkˈsɛs lʊk laɪk ɪn ðɪs roʊl ˈæftər sɪks mʌnθs/",
    "meaning": "¿Cómo se ve el éxito en este puesto después de seis meses?",
    "example": "What does success look like in this role after six months, in your view?",
    "example_translation": "¿Cómo se ve el éxito en este puesto después de seis meses, en tu opinión?",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Any final questions before we wrap up?",
        "es": "¿Alguna pregunta final antes de terminar?"
      },
      {
        "en": "What does success look like in this role after six months?",
        "es": "¿Cómo se ve el éxito en este puesto después de seis meses?"
      }
    ]
  },
  {
    "id": "tech-sell-09-i-reduced-our-bug-backlog-by-half-in-one",
    "chunk": "I reduced our bug backlog by half in one quarter.",
    "ipa": "/aɪ rɪˈdust aʊr bʌɡ ˈbæklɔɡ baɪ hæf ɪn wʌn ˈkwɔrtər/",
    "meaning": "Reduje nuestro backlog de errores a la mitad en un trimestre.",
    "example": "I reduced our bug backlog by half in one quarter by prioritizing ruthlessly.",
    "example_translation": "Reduje nuestro backlog de errores a la mitad en un trimestre priorizando sin piedad.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "What impact did you have on that team?",
        "es": "¿Qué impacto tuviste en ese equipo?"
      },
      {
        "en": "I reduced our bug backlog by half in one quarter.",
        "es": "Reduje nuestro backlog de errores a la mitad en un trimestre."
      }
    ]
  },
  {
    "id": "tech-sell-10-im-comfortable-working-across-the-stack",
    "chunk": "I'm comfortable working across the stack.",
    "ipa": "/aɪm ˈkʌmftərbəl ˈwɜrkɪŋ əˈkrɔs ðə stæk/",
    "meaning": "Me siento cómoda trabajando en todo el stack.",
    "example": "I'm comfortable working across the stack, from the database to the UI.",
    "example_translation": "Me siento cómoda trabajando en todo el stack, desde la base de datos hasta la interfaz.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Are you more front-end or back-end?",
        "es": "¿Eres más de front-end o back-end?"
      },
      {
        "en": "Honestly, I'm comfortable working across the stack.",
        "es": "Honestamente, me siento cómoda trabajando en todo el stack."
      }
    ]
  },
  {
    "id": "tech-sell-11-that-aligns-with-what-im-looking-for-in-",
    "chunk": "That aligns with what I'm looking for in my next role.",
    "ipa": "/ðæt əˈlaɪnz wɪð wʌt aɪm ˈlʊkɪŋ fɔr ɪn maɪ nɛkst roʊl/",
    "meaning": "Eso concuerda con lo que busco en mi próximo puesto.",
    "example": "That aligns with what I'm looking for in my next role, especially the mentorship part.",
    "example_translation": "Eso concuerda con lo que busco en mi próximo puesto, especialmente la parte de mentoría.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "We offer a lot of autonomy on this team.",
        "es": "Ofrecemos mucha autonomía en este equipo."
      },
      {
        "en": "That aligns with what I'm looking for in my next role.",
        "es": "Eso concuerda con lo que busco en mi próximo puesto."
      }
    ]
  },
  {
    "id": "tech-sell-12-can-we-talk-about-the-equity-package-as-",
    "chunk": "Can we talk about the equity package as well?",
    "ipa": "/kæn wi tɔk əˈbaʊt ði ˈɛkwɪti ˈpækɪdʒ æz wɛl/",
    "meaning": "¿Podemos hablar también sobre el paquete de acciones?",
    "example": "Can we talk about the equity package as well, not just the base salary?",
    "example_translation": "¿Podemos hablar también sobre el paquete de acciones, no solo el salario base?",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "So, here's the salary breakdown.",
        "es": "Entonces, aquí está el desglose del salario."
      },
      {
        "en": "Thanks. Can we talk about the equity package as well?",
        "es": "Gracias. ¿Podemos hablar también sobre el paquete de acciones?"
      }
    ]
  },
  {
    "id": "tech-sell-13-i-take-ownership-of-my-projects-end-to-e",
    "chunk": "I take ownership of my projects end to end.",
    "ipa": "/aɪ teɪk ˈoʊnərʃɪp ʌv maɪ ˈprɑdʒɛkts ɛnd tu ɛnd/",
    "meaning": "Me hago responsable de mis proyectos de principio a fin.",
    "example": "I take ownership of my projects end to end, from design to deployment.",
    "example_translation": "Me hago responsable de mis proyectos de principio a fin, desde el diseño hasta el despliegue.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "How would you describe your work style?",
        "es": "¿Cómo describirías tu estilo de trabajo?"
      },
      {
        "en": "I take ownership of my projects end to end.",
        "es": "Me hago responsable de mis proyectos de principio a fin."
      }
    ]
  },
  {
    "id": "tech-sell-14-id-appreciate-some-time-to-think-it-over",
    "chunk": "I'd appreciate some time to think it over before I accept.",
    "ipa": "/aɪd əˈpriʃieɪt sʌm taɪm tu θɪŋk ɪt ˈoʊvər bɪˈfɔr aɪ əkˈsɛpt/",
    "meaning": "Agradecería algo de tiempo para pensarlo antes de aceptar.",
    "example": "I'd appreciate some time to think it over before I accept the offer.",
    "example_translation": "Agradecería algo de tiempo para pensarlo antes de aceptar la oferta.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "So, do we have a deal?",
        "es": "Entonces, ¿tenemos un trato?"
      },
      {
        "en": "I'd appreciate some time to think it over before I accept.",
        "es": "Agradecería algo de tiempo para pensarlo antes de aceptar."
      }
    ]
  },
  {
    "id": "tech-sell-15-i-negotiated-a-signing-bonus-with-my-las",
    "chunk": "I negotiated a signing bonus with my last offer.",
    "ipa": "/aɪ nɪˈɡoʊʃieɪtɪd ə ˈsaɪnɪŋ ˈboʊnəs wɪð maɪ læst ˈɔfər/",
    "meaning": "Negocié un bono de contratación en mi última oferta.",
    "example": "I negotiated a signing bonus with my last offer to cover relocation costs.",
    "example_translation": "Negocié un bono de contratación en mi última oferta para cubrir los costos de mudanza.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Have you negotiated an offer before?",
        "es": "¿Has negociado una oferta antes?"
      },
      {
        "en": "Yes, I negotiated a signing bonus with my last offer.",
        "es": "Sí, negocié un bono de contratación en mi última oferta."
      }
    ]
  },
  {
    "id": "tech-sell-16-my-proudest-achievement-was-launching-th",
    "chunk": "My proudest achievement was launching this feature from scratch.",
    "ipa": "/maɪ ˈpraʊdɪst əˈtʃivmənt wʌz ˈlɔntʃɪŋ ðɪs ˈfitʃər frʌm skrætʃ/",
    "meaning": "Mi mayor logro fue lanzar esta función desde cero.",
    "example": "My proudest achievement was launching this feature from scratch in three months.",
    "example_translation": "Mi mayor logro fue lanzar esta función desde cero en tres meses.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "What are you most proud of professionally?",
        "es": "¿De qué te sientes más orgullosa profesionalmente?"
      },
      {
        "en": "My proudest achievement was launching this feature from scratch.",
        "es": "Mi mayor logro fue lanzar esta función desde cero."
      }
    ]
  },
  {
    "id": "tech-sell-17-im-confident-i-can-hit-the-ground-runnin",
    "chunk": "I'm confident I can hit the ground running.",
    "ipa": "/aɪm ˈkɑnfɪdənt aɪ kæn hɪt ðə ɡraʊnd ˈrʌnɪŋ/",
    "meaning": "Estoy segura de que puedo empezar a rendir de inmediato.",
    "example": "I'm confident I can hit the ground running given my experience with this stack.",
    "example_translation": "Estoy segura de que puedo empezar a rendir de inmediato dada mi experiencia con este stack.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "How long do you think the ramp-up would take?",
        "es": "¿Cuánto crees que tomaría tu adaptación?"
      },
      {
        "en": "I'm confident I can hit the ground running.",
        "es": "Estoy segura de que puedo empezar a rendir de inmediato."
      }
    ]
  },
  {
    "id": "tech-sell-18-let-me-tell-you-about-a-project-im-reall",
    "chunk": "Let me tell you about a project I'm really proud of.",
    "ipa": "/lɛt mi tɛl ju əˈbaʊt ə ˈprɑdʒɛkt aɪm ˈrɪli praʊd ʌv/",
    "meaning": "Déjame contarte sobre un proyecto del que estoy muy orgullosa.",
    "example": "Let me tell you about a project I'm really proud of from last year.",
    "example_translation": "Déjame contarte sobre un proyecto del que estoy muy orgullosa del año pasado.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Tell me about a time you solved a hard problem.",
        "es": "Cuéntame de una vez que resolviste un problema difícil."
      },
      {
        "en": "Let me tell you about a project I'm really proud of.",
        "es": "Déjame contarte sobre un proyecto del que estoy muy orgullosa."
      }
    ]
  },
  {
    "id": "tech-sell-19-im-open-to-relocating-for-the-right-oppo",
    "chunk": "I'm open to relocating for the right opportunity.",
    "ipa": "/aɪm ˈoʊpən tu ˌriloʊˈkeɪtɪŋ fɔr ðə raɪt ˌɑpərˈtuːnəti/",
    "meaning": "Estoy abierta a reubicarme por la oportunidad correcta.",
    "example": "I'm open to relocating for the right opportunity, if it makes sense.",
    "example_translation": "Estoy abierta a reubicarme por la oportunidad correcta, si tiene sentido.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "This role is based in our New York office.",
        "es": "Este puesto está en nuestra oficina de Nueva York."
      },
      {
        "en": "That's fine — I'm open to relocating for the right opportunity.",
        "es": "Está bien — estoy abierta a reubicarme por la oportunidad correcta."
      }
    ]
  },
  {
    "id": "tech-sell-20-thank-you-for-the-offer-ill-get-back-to-",
    "chunk": "Thank you for the offer — I'll get back to you by Friday.",
    "ipa": "/θæŋk ju fɔr ði ˈɔfər aɪl ɡɛt bæk tu ju baɪ ˈfraɪdeɪ/",
    "meaning": "Gracias por la oferta — te responderé antes del viernes.",
    "example": "Thank you for the offer — I'll get back to you by Friday with my decision.",
    "example_translation": "Gracias por la oferta — te responderé antes del viernes con mi decisión.",
    "category": "Selling Yourself",
    "tag": "Career",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "So that's our final offer.",
        "es": "Entonces esa es nuestra oferta final."
      },
      {
        "en": "Thank you for the offer — I'll get back to you by Friday.",
        "es": "Gracias por la oferta — te responderé antes del viernes."
      }
    ]
  },
  {
    "id": "tech-eng-01-im-blocked-on-the-api-not-being-ready-ye",
    "chunk": "I'm blocked on the API not being ready yet.",
    "ipa": "/aɪm blɑkt ɑn ði ˈeɪpiˈaɪ nɑt ˈbiɪŋ ˈrɛdi jɛt/",
    "meaning": "Estoy bloqueada porque la API todavía no está lista.",
    "example": "I'm blocked on the API not being ready yet, so I'll work on tests meanwhile.",
    "example_translation": "Estoy bloqueada porque la API todavía no está lista, así que mientras tanto trabajaré en las pruebas.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "How's the integration going?",
        "es": "¿Cómo va la integración?"
      },
      {
        "en": "I'm blocked on the API not being ready yet.",
        "es": "Estoy bloqueada porque la API todavía no está lista."
      }
    ]
  },
  {
    "id": "tech-eng-02-can-we-push-this-to-the-next-sprint",
    "chunk": "Can we push this to the next sprint?",
    "ipa": "/kæn wi pʊʃ ðɪs tu ðə nɛkst sprɪnt/",
    "meaning": "¿Podemos pasar esto al siguiente sprint?",
    "example": "Can we push this to the next sprint? We're not going to finish it in time.",
    "example_translation": "¿Podemos pasar esto al siguiente sprint? No lo vamos a terminar a tiempo.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "We're not going to finish this ticket today.",
        "es": "No vamos a terminar este ticket hoy."
      },
      {
        "en": "Can we push this to the next sprint?",
        "es": "¿Podemos pasar esto al siguiente sprint?"
      }
    ]
  },
  {
    "id": "tech-eng-03-nit-this-variable-name-could-be-clearer",
    "chunk": "Nit: this variable name could be clearer.",
    "ipa": "/nɪt ðɪs ˈvɛriəbəl neɪm kʊd bi ˈklɪrər/",
    "meaning": "Detalle menor: este nombre de variable podría ser más claro.",
    "example": "Nit: this variable name could be clearer, maybe call it 'userCount'.",
    "example_translation": "Detalle menor: este nombre de variable podría ser más claro, tal vez llámala 'userCount'.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Any feedback on my PR?",
        "es": "¿Algún comentario sobre mi PR?"
      },
      {
        "en": "Just one nit: this variable name could be clearer.",
        "es": "Solo un detalle menor: este nombre de variable podría ser más claro."
      }
    ]
  },
  {
    "id": "tech-eng-04-it-works-on-my-machine-but-let-me-check-",
    "chunk": "It works on my machine, but let me check the CI logs.",
    "ipa": "/ɪt wɜrks ɑn maɪ məˈʃin bʌt lɛt mi tʃɛk ðə si aɪ lɔɡz/",
    "meaning": "Funciona en mi máquina, pero déjame revisar los logs del CI.",
    "example": "It works on my machine, but let me check the CI logs to see what's failing.",
    "example_translation": "Funciona en mi máquina, pero déjame revisar los logs del CI para ver qué está fallando.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "The build is failing on your PR.",
        "es": "El build está fallando en tu PR."
      },
      {
        "en": "Weird, it works on my machine, but let me check the CI logs.",
        "es": "Qué raro, funciona en mi máquina, pero déjame revisar los logs del CI."
      }
    ]
  },
  {
    "id": "tech-eng-05-lets-pair-on-this-for-twenty-minutes",
    "chunk": "Let's pair on this for twenty minutes.",
    "ipa": "/lɛts pɛr ɑn ðɪs fɔr ˈtwɛnti ˈmɪnɪts/",
    "meaning": "Programemos juntos en esto durante veinte minutos.",
    "example": "Let's pair on this for twenty minutes, I think we'll move faster together.",
    "example_translation": "Programemos juntos en esto durante veinte minutos, creo que avanzaremos más rápido juntas.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I'm stuck on this bug.",
        "es": "Estoy atascada con este error."
      },
      {
        "en": "Let's pair on this for twenty minutes.",
        "es": "Programemos juntos en esto durante veinte minutos."
      }
    ]
  },
  {
    "id": "tech-eng-06-i-opened-a-pr-can-you-take-a-look-when-y",
    "chunk": "I opened a PR, can you take a look when you get a chance?",
    "ipa": "/aɪ ˈoʊpənd ə pi ɑr kæn ju teɪk ə lʊk wɛn ju ɡɛt ə tʃæns/",
    "meaning": "Abrí un PR, ¿puedes echarle un vistazo cuando tengas oportunidad?",
    "example": "I opened a PR, can you take a look when you get a chance? No rush.",
    "example_translation": "Abrí un PR, ¿puedes echarle un vistazo cuando tengas oportunidad? Sin prisa.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "What are you working on today?",
        "es": "¿En qué estás trabajando hoy?"
      },
      {
        "en": "I opened a PR, can you take a look when you get a chance?",
        "es": "Abrí un PR, ¿puedes echarle un vistazo cuando tengas oportunidad?"
      }
    ]
  },
  {
    "id": "tech-eng-07-this-ticket-is-bigger-than-it-looks-lets",
    "chunk": "This ticket is bigger than it looks — let's split it up.",
    "ipa": "/ðɪs ˈtɪkɪt ɪz ˈbɪɡər ðæn ɪt lʊks lɛts splɪt ɪt ʌp/",
    "meaning": "Este ticket es más grande de lo que parece — dividámoslo.",
    "example": "This ticket is bigger than it looks — let's split it up into smaller tasks.",
    "example_translation": "Este ticket es más grande de lo que parece — dividámoslo en tareas más pequeñas.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "How's this ticket going?",
        "es": "¿Cómo va este ticket?"
      },
      {
        "en": "This ticket is bigger than it looks — let's split it up.",
        "es": "Este ticket es más grande de lo que parece — dividámoslo."
      }
    ]
  },
  {
    "id": "tech-eng-08-ill-take-this-one-its-in-my-wheelhouse",
    "chunk": "I'll take this one, it's in my wheelhouse.",
    "ipa": "/aɪl teɪk ðɪs wʌn ɪts ɪn maɪ ˈwilhaʊs/",
    "meaning": "Yo me encargo de esta, es lo mío.",
    "example": "I'll take this one, it's in my wheelhouse — I've done this before.",
    "example_translation": "Yo me encargo de esta, es lo mío — ya he hecho esto antes.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Who wants to pick up the auth ticket?",
        "es": "¿Quién quiere tomar el ticket de autenticación?"
      },
      {
        "en": "I'll take this one, it's in my wheelhouse.",
        "es": "Yo me encargo de esta, es lo mío."
      }
    ]
  },
  {
    "id": "tech-eng-09-can-someone-review-my-pr-before-end-of-d",
    "chunk": "Can someone review my PR before end of day?",
    "ipa": "/kæn ˈsʌmwʌn rɪˈvju maɪ pi ɑr bɪˈfɔr ɛnd ʌv deɪ/",
    "meaning": "¿Alguien puede revisar mi PR antes de que termine el día?",
    "example": "Can someone review my PR before end of day? I want to deploy tomorrow.",
    "example_translation": "¿Alguien puede revisar mi PR antes de que termine el día? Quiero desplegar mañana.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Anything urgent from your side?",
        "es": "¿Algo urgente de tu parte?"
      },
      {
        "en": "Can someone review my PR before end of day?",
        "es": "¿Alguien puede revisar mi PR antes de que termine el día?"
      }
    ]
  },
  {
    "id": "tech-eng-10-i-found-a-bug-in-production-looking-into",
    "chunk": "I found a bug in production, looking into it now.",
    "ipa": "/aɪ faʊnd ə bʌɡ ɪn prəˈdʌkʃən ˈlʊkɪŋ ˈɪntu ɪt naʊ/",
    "meaning": "Encontré un error en producción, lo estoy investigando ahora.",
    "example": "I found a bug in production, looking into it now — will update the thread.",
    "example_translation": "Encontré un error en producción, lo estoy investigando ahora — actualizaré el hilo.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Users are reporting errors on checkout.",
        "es": "Los usuarios reportan errores al pagar."
      },
      {
        "en": "I found a bug in production, looking into it now.",
        "es": "Encontré un error en producción, lo estoy investigando ahora."
      }
    ]
  },
  {
    "id": "tech-eng-11-lets-roll-this-back-until-we-find-the-ro",
    "chunk": "Let's roll this back until we find the root cause.",
    "ipa": "/lɛts roʊl ðɪs bæk ənˈtɪl wi faɪnd ðə rut kɔz/",
    "meaning": "Reversemos esto hasta que encontremos la causa raíz.",
    "example": "Let's roll this back until we find the root cause of the outage.",
    "example_translation": "Reversemos esto hasta que encontremos la causa raíz de la caída.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "The new deploy is causing errors.",
        "es": "El nuevo despliegue está causando errores."
      },
      {
        "en": "Let's roll this back until we find the root cause.",
        "es": "Reversemos esto hasta que encontremos la causa raíz."
      }
    ]
  },
  {
    "id": "tech-eng-12-im-going-to-refactor-this-before-adding-",
    "chunk": "I'm going to refactor this before adding more features.",
    "ipa": "/aɪm ˈɡoʊɪŋ tu riˈfæktɔr ðɪs bɪˈfɔr ˈædɪŋ mɔr ˈfitʃərz/",
    "meaning": "Voy a refactorizar esto antes de añadir más funciones.",
    "example": "I'm going to refactor this before adding more features, it's getting messy.",
    "example_translation": "Voy a refactorizar esto antes de añadir más funciones, se está volviendo desordenado.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Can we add the export feature this week?",
        "es": "¿Podemos añadir la función de exportar esta semana?"
      },
      {
        "en": "I'm going to refactor this before adding more features.",
        "es": "Voy a refactorizar esto antes de añadir más funciones."
      }
    ]
  },
  {
    "id": "tech-eng-13-the-build-is-failing-on-the-main-branch",
    "chunk": "The build is failing on the main branch.",
    "ipa": "/ðə bɪld ɪz ˈfeɪlɪŋ ɑn ðə meɪn brænʧ/",
    "meaning": "El build está fallando en la rama principal.",
    "example": "The build is failing on the main branch, can everyone hold off on merging?",
    "example_translation": "El build está fallando en la rama principal, ¿pueden todos esperar antes de hacer merge?",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Is it okay to merge my PR now?",
        "es": "¿Está bien hacer merge de mi PR ahora?"
      },
      {
        "en": "Hold on, the build is failing on the main branch.",
        "es": "Espera, el build está fallando en la rama principal."
      }
    ]
  },
  {
    "id": "tech-eng-14-can-you-approve-this-so-i-can-merge",
    "chunk": "Can you approve this so I can merge?",
    "ipa": "/kæn ju əˈpruv ðɪs soʊ aɪ kæn mɜrdʒ/",
    "meaning": "¿Puedes aprobar esto para que pueda hacer merge?",
    "example": "Can you approve this so I can merge? I already addressed your comments.",
    "example_translation": "¿Puedes aprobar esto para que pueda hacer merge? Ya atendí tus comentarios.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I left a couple of comments on your PR.",
        "es": "Dejé un par de comentarios en tu PR."
      },
      {
        "en": "Fixed them — can you approve this so I can merge?",
        "es": "Ya los arreglé — ¿puedes aprobar esto para que pueda hacer merge?"
      }
    ]
  },
  {
    "id": "tech-eng-15-i-dont-think-we-have-enough-test-coverag",
    "chunk": "I don't think we have enough test coverage here.",
    "ipa": "/aɪ doʊnt θɪŋk wi hæv ɪˈnʌf tɛst ˈkʌvərɪdʒ hɪr/",
    "meaning": "No creo que tengamos suficiente cobertura de pruebas aquí.",
    "example": "I don't think we have enough test coverage here for the edge cases.",
    "example_translation": "No creo que tengamos suficiente cobertura de pruebas aquí para los casos límite.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I think this PR is ready to merge.",
        "es": "Creo que este PR está listo para hacer merge."
      },
      {
        "en": "I don't think we have enough test coverage here.",
        "es": "No creo que tengamos suficiente cobertura de pruebas aquí."
      }
    ]
  },
  {
    "id": "tech-eng-16-lets-sync-offline-about-this-instead-of-",
    "chunk": "Let's sync offline about this instead of in the thread.",
    "ipa": "/lɛts sɪŋk ˈɔflaɪn əˈbaʊt ðɪs ɪnˈstɛd ʌv ɪn ðə θrɛd/",
    "meaning": "Sincronicemos esto en privado en vez de en el hilo.",
    "example": "Let's sync offline about this instead of in the thread, it's getting long.",
    "example_translation": "Sincronicemos esto en privado en vez de en el hilo, se está haciendo largo.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "This Slack thread has forty replies now.",
        "es": "Este hilo de Slack ya tiene cuarenta respuestas."
      },
      {
        "en": "Let's sync offline about this instead of in the thread.",
        "es": "Sincronicemos esto en privado en vez de en el hilo."
      }
    ]
  },
  {
    "id": "tech-eng-17-ill-write-up-a-postmortem-after-the-inci",
    "chunk": "I'll write up a postmortem after the incident.",
    "ipa": "/aɪl raɪt ʌp ə ˈpoʊstmɔrtəm ˈæftər ði ˈɪnsədənt/",
    "meaning": "Escribiré un postmortem después del incidente.",
    "example": "I'll write up a postmortem after the incident so we learn from it.",
    "example_translation": "Escribiré un postmortem después del incidente para que aprendamos de esto.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "That was a rough outage.",
        "es": "Esa caída fue difícil."
      },
      {
        "en": "Agreed — I'll write up a postmortem after the incident.",
        "es": "De acuerdo — escribiré un postmortem después del incidente."
      }
    ]
  },
  {
    "id": "tech-eng-18-this-deadline-feels-unrealistic-given-th",
    "chunk": "This deadline feels unrealistic given the scope.",
    "ipa": "/ðɪs ˈdɛdlaɪn filz ˌʌnriˈælɪstɪk ˈɡɪvən ðə skoʊp/",
    "meaning": "Esta fecha límite parece poco realista dado el alcance.",
    "example": "This deadline feels unrealistic given the scope we've agreed on.",
    "example_translation": "Esta fecha límite parece poco realista dado el alcance que acordamos.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "We need this shipped by Friday.",
        "es": "Necesitamos esto lanzado para el viernes."
      },
      {
        "en": "This deadline feels unrealistic given the scope.",
        "es": "Esta fecha límite parece poco realista dado el alcance."
      }
    ]
  },
  {
    "id": "tech-eng-19-i-pushed-a-hotfix-for-the-login-issue",
    "chunk": "I pushed a hotfix for the login issue.",
    "ipa": "/aɪ pʊʃt ə ˈhɑtfɪks fɔr ðə ˈlɔɡɪn ˈɪʃu/",
    "meaning": "Subí un hotfix para el problema de inicio de sesión.",
    "example": "I pushed a hotfix for the login issue, should be live in a few minutes.",
    "example_translation": "Subí un hotfix para el problema de inicio de sesión, debería estar en vivo en unos minutos.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Is the login bug fixed yet?",
        "es": "¿Ya está arreglado el error de inicio de sesión?"
      },
      {
        "en": "Yes, I pushed a hotfix for the login issue.",
        "es": "Sí, subí un hotfix para el problema de inicio de sesión."
      }
    ]
  },
  {
    "id": "tech-eng-20-lets-timebox-this-investigation-to-one-d",
    "chunk": "Let's timebox this investigation to one day.",
    "ipa": "/lɛts ˈtaɪmbɑks ðɪs ɪnˌvɛstɪˈɡeɪʃən tu wʌn deɪ/",
    "meaning": "Pongamos un límite de tiempo de un día para esta investigación.",
    "example": "Let's timebox this investigation to one day so it doesn't drag on.",
    "example_translation": "Pongamos un límite de tiempo de un día para esta investigación para que no se alargue.",
    "category": "Engineering Day-to-Day",
    "tag": "Engineering",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "How long should we spend debugging this?",
        "es": "¿Cuánto tiempo deberíamos dedicar a depurar esto?"
      },
      {
        "en": "Let's timebox this investigation to one day.",
        "es": "Pongamos un límite de tiempo de un día para esta investigación."
      }
    ]
  },
  {
    "id": "tech-design-01-what-problem-are-we-solving-for-the-user",
    "chunk": "What problem are we solving for the user?",
    "ipa": "/wʌt ˈprɑbləm ɑr wi ˈsɑlvɪŋ fɔr ðə ˈjuzər/",
    "meaning": "¿Qué problema estamos resolviendo para el usuario?",
    "example": "What problem are we solving for the user before we jump into solutions?",
    "example_translation": "¿Qué problema estamos resolviendo para el usuario antes de saltar a las soluciones?",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Here's my proposal for the new dashboard.",
        "es": "Aquí está mi propuesta para el nuevo panel."
      },
      {
        "en": "First, what problem are we solving for the user?",
        "es": "Primero, ¿qué problema estamos resolviendo para el usuario?"
      }
    ]
  },
  {
    "id": "tech-design-02-id-push-back-on-that-a-little",
    "chunk": "I'd push back on that a little.",
    "ipa": "/aɪd pʊʃ bæk ɑn ðæt ə ˈlɪtəl/",
    "meaning": "Cuestionaría un poco eso.",
    "example": "I'd push back on that a little — I'm not sure users will notice the difference.",
    "example_translation": "Cuestionaría un poco eso — no estoy segura de que los usuarios noten la diferencia.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I think we should add a fourth color option.",
        "es": "Creo que deberíamos añadir una cuarta opción de color."
      },
      {
        "en": "I'd push back on that a little.",
        "es": "Cuestionaría un poco eso."
      }
    ]
  },
  {
    "id": "tech-design-03-lets-validate-this-with-users-before-com",
    "chunk": "Let's validate this with users before committing.",
    "ipa": "/lɛts ˈvælɪdeɪt ðɪs wɪð ˈjuzərz bɪˈfɔr kəˈmɪtɪŋ/",
    "meaning": "Validemos esto con usuarios antes de comprometernos.",
    "example": "Let's validate this with users before committing engineering resources.",
    "example_translation": "Validemos esto con usuarios antes de comprometer recursos de ingeniería.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Should we build this whole flow?",
        "es": "¿Deberíamos construir todo este flujo?"
      },
      {
        "en": "Let's validate this with users before committing.",
        "es": "Validemos esto con usuarios antes de comprometernos."
      }
    ]
  },
  {
    "id": "tech-design-04-this-flow-feels-like-it-has-too-many-ste",
    "chunk": "This flow feels like it has too many steps.",
    "ipa": "/ðɪs floʊ filz laɪk ɪt hæz tu ˈmɛni stɛps/",
    "meaning": "Este flujo se siente como que tiene demasiados pasos.",
    "example": "This flow feels like it has too many steps for something this simple.",
    "example_translation": "Este flujo se siente como que tiene demasiados pasos para algo tan simple.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Here's the checkout flow I designed.",
        "es": "Aquí está el flujo de pago que diseñé."
      },
      {
        "en": "This flow feels like it has too many steps.",
        "es": "Este flujo se siente como que tiene demasiados pasos."
      }
    ]
  },
  {
    "id": "tech-design-05-can-you-walk-me-through-the-users-mental",
    "chunk": "Can you walk me through the user's mental model here?",
    "ipa": "/kæn ju wɔk mi θru ðə ˈjuzərz ˈmɛntəl ˈmɑdəl hɪr/",
    "meaning": "¿Puedes explicarme el modelo mental del usuario aquí?",
    "example": "Can you walk me through the user's mental model here? I want to understand the reasoning.",
    "example_translation": "¿Puedes explicarme el modelo mental del usuario aquí? Quiero entender el razonamiento.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I organized the menu this way on purpose.",
        "es": "Organicé el menú así a propósito."
      },
      {
        "en": "Can you walk me through the user's mental model here?",
        "es": "¿Puedes explicarme el modelo mental del usuario aquí?"
      }
    ]
  },
  {
    "id": "tech-design-06-i-like-the-direction-but-the-hierarchy-f",
    "chunk": "I like the direction, but the hierarchy feels off.",
    "ipa": "/aɪ laɪk ðə dɪˈrɛkʃən bʌt ðə ˈhaɪərˌɑrki filz ɔf/",
    "meaning": "Me gusta la dirección, pero la jerarquía se siente mal.",
    "example": "I like the direction, but the hierarchy feels off — the CTA should stand out more.",
    "example_translation": "Me gusta la dirección, pero la jerarquía se siente mal — el CTA debería resaltar más.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "What do you think of this new layout?",
        "es": "¿Qué opinas de este nuevo diseño?"
      },
      {
        "en": "I like the direction, but the hierarchy feels off.",
        "es": "Me gusta la dirección, pero la jerarquía se siente mal."
      }
    ]
  },
  {
    "id": "tech-design-07-whats-the-empty-state-for-this-screen",
    "chunk": "What's the empty state for this screen?",
    "ipa": "/wʌts ði ˈɛmpti steɪt fɔr ðɪs skrin/",
    "meaning": "¿Cuál es el estado vacío para esta pantalla?",
    "example": "What's the empty state for this screen when the user has no data yet?",
    "example_translation": "¿Cuál es el estado vacío para esta pantalla cuando el usuario aún no tiene datos?",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Here's the dashboard with sample data.",
        "es": "Aquí está el panel con datos de ejemplo."
      },
      {
        "en": "What's the empty state for this screen?",
        "es": "¿Cuál es el estado vacío para esta pantalla?"
      }
    ]
  },
  {
    "id": "tech-design-08-lets-a-b-test-these-two-versions",
    "chunk": "Let's A/B test these two versions.",
    "ipa": "/lɛts eɪ bi tɛst ðiz tu ˈvɜrʒənz/",
    "meaning": "Hagamos una prueba A/B con estas dos versiones.",
    "example": "Let's A/B test these two versions instead of guessing which one is better.",
    "example_translation": "Hagamos una prueba A/B con estas dos versiones en vez de adivinar cuál es mejor.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "We can't agree on which button color to use.",
        "es": "No nos ponemos de acuerdo en qué color de botón usar."
      },
      {
        "en": "Let's A/B test these two versions.",
        "es": "Hagamos una prueba A/B con estas dos versiones."
      }
    ]
  },
  {
    "id": "tech-design-09-this-copy-doesnt-match-our-brand-voice",
    "chunk": "This copy doesn't match our brand voice.",
    "ipa": "/ðɪs ˈkɑpi ˈdʌzənt mætʃ aʊr brænd vɔɪs/",
    "meaning": "Este texto no coincide con la voz de nuestra marca.",
    "example": "This copy doesn't match our brand voice — it sounds too formal.",
    "example_translation": "Este texto no coincide con la voz de nuestra marca — suena demasiado formal.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "What do you think of this error message?",
        "es": "¿Qué opinas de este mensaje de error?"
      },
      {
        "en": "This copy doesn't match our brand voice.",
        "es": "Este texto no coincide con la voz de nuestra marca."
      }
    ]
  },
  {
    "id": "tech-design-10-id-love-to-see-this-on-a-smaller-screen",
    "chunk": "I'd love to see this on a smaller screen.",
    "ipa": "/aɪd lʌv tu si ðɪs ɑn ə ˈsmɔlər skrin/",
    "meaning": "Me encantaría ver esto en una pantalla más pequeña.",
    "example": "I'd love to see this on a smaller screen before we finalize it.",
    "example_translation": "Me encantaría ver esto en una pantalla más pequeña antes de finalizarlo.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Here's the new design on desktop.",
        "es": "Aquí está el nuevo diseño en escritorio."
      },
      {
        "en": "I'd love to see this on a smaller screen.",
        "es": "Me encantaría ver esto en una pantalla más pequeña."
      }
    ]
  },
  {
    "id": "tech-design-11-what-happens-if-the-user-has-no-data-yet",
    "chunk": "What happens if the user has no data yet?",
    "ipa": "/wʌt ˈhæpənz ɪf ðə ˈjuzər hæz noʊ ˈdeɪtə jɛt/",
    "meaning": "¿Qué pasa si el usuario todavía no tiene datos?",
    "example": "What happens if the user has no data yet? We should design for that too.",
    "example_translation": "¿Qué pasa si el usuario todavía no tiene datos? Deberíamos diseñar también para eso.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "The chart looks great with real data.",
        "es": "El gráfico se ve genial con datos reales."
      },
      {
        "en": "What happens if the user has no data yet?",
        "es": "¿Qué pasa si el usuario todavía no tiene datos?"
      }
    ]
  },
  {
    "id": "tech-design-12-this-interaction-isnt-accessible-for-scr",
    "chunk": "This interaction isn't accessible for screen readers.",
    "ipa": "/ðɪs ˌɪntərˈækʃən ˈɪzənt ækˈsɛsəbəl fɔr skrin ˈridərz/",
    "meaning": "Esta interacción no es accesible para lectores de pantalla.",
    "example": "This interaction isn't accessible for screen readers, we need to add labels.",
    "example_translation": "Esta interacción no es accesible para lectores de pantalla, necesitamos añadir etiquetas.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "The new dropdown looks slick.",
        "es": "El nuevo menú desplegable se ve elegante."
      },
      {
        "en": "This interaction isn't accessible for screen readers.",
        "es": "Esta interacción no es accesible para lectores de pantalla."
      }
    ]
  },
  {
    "id": "tech-design-13-can-we-simplify-this-down-to-one-primary",
    "chunk": "Can we simplify this down to one primary action?",
    "ipa": "/kæn wi ˈsɪmplɪfaɪ ðɪs daʊn tu wʌn ˈpraɪmɛri ˈækʃən/",
    "meaning": "¿Podemos simplificar esto a una sola acción principal?",
    "example": "Can we simplify this down to one primary action instead of three buttons?",
    "example_translation": "¿Podemos simplificar esto a una sola acción principal en vez de tres botones?",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "This screen has three call-to-action buttons.",
        "es": "Esta pantalla tiene tres botones de llamada a la acción."
      },
      {
        "en": "Can we simplify this down to one primary action?",
        "es": "¿Podemos simplificar esto a una sola acción principal?"
      }
    ]
  },
  {
    "id": "tech-design-14-i-think-were-solving-the-wrong-problem",
    "chunk": "I think we're solving the wrong problem.",
    "ipa": "/aɪ θɪŋk wɪr ˈsɑlvɪŋ ðə rɔŋ ˈprɑbləm/",
    "meaning": "Creo que estamos resolviendo el problema equivocado.",
    "example": "I think we're solving the wrong problem — users didn't ask for this.",
    "example_translation": "Creo que estamos resolviendo el problema equivocado — los usuarios no pidieron esto.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "We've spent two weeks on this feature.",
        "es": "Llevamos dos semanas en esta función."
      },
      {
        "en": "I think we're solving the wrong problem.",
        "es": "Creo que estamos resolviendo el problema equivocado."
      }
    ]
  },
  {
    "id": "tech-design-15-lets-ship-an-mvp-and-iterate-from-feedba",
    "chunk": "Let's ship an MVP and iterate from feedback.",
    "ipa": "/lɛts ʃɪp ən ɛm vi pi ænd ˈɪtəreɪt frʌm ˈfidbæk/",
    "meaning": "Lancemos un MVP e iteremos con base en la retroalimentación.",
    "example": "Let's ship an MVP and iterate from feedback instead of perfecting it now.",
    "example_translation": "Lancemos un MVP e iteremos con base en la retroalimentación en vez de perfeccionarlo ahora.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "There's still a lot we could polish here.",
        "es": "Todavía hay mucho que podríamos pulir aquí."
      },
      {
        "en": "Let's ship an MVP and iterate from feedback.",
        "es": "Lancemos un MVP e iteremos con base en la retroalimentación."
      }
    ]
  },
  {
    "id": "tech-design-16-the-contrast-here-is-too-low-to-read-com",
    "chunk": "The contrast here is too low to read comfortably.",
    "ipa": "/ðə ˈkɑntræst hɪr ɪz tu loʊ tu rid ˈkʌmftərbli/",
    "meaning": "El contraste aquí es demasiado bajo para leer cómodamente.",
    "example": "The contrast here is too low to read comfortably on a bright screen.",
    "example_translation": "El contraste aquí es demasiado bajo para leer cómodamente en una pantalla brillante.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I used a lighter gray for the secondary text.",
        "es": "Usé un gris más claro para el texto secundario."
      },
      {
        "en": "The contrast here is too low to read comfortably.",
        "es": "El contraste aquí es demasiado bajo para leer cómodamente."
      }
    ]
  },
  {
    "id": "tech-design-17-id-like-to-see-the-data-before-we-finali",
    "chunk": "I'd like to see the data before we finalize this.",
    "ipa": "/aɪd laɪk tu si ðə ˈdeɪtə bɪˈfɔr wi ˈfaɪnəlaɪz ðɪs/",
    "meaning": "Me gustaría ver los datos antes de finalizar esto.",
    "example": "I'd like to see the data before we finalize this design decision.",
    "example_translation": "Me gustaría ver los datos antes de finalizar esta decisión de diseño.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "So we're going with the new onboarding flow.",
        "es": "Entonces vamos con el nuevo flujo de incorporación."
      },
      {
        "en": "I'd like to see the data before we finalize this.",
        "es": "Me gustaría ver los datos antes de finalizar esto."
      }
    ]
  },
  {
    "id": "tech-design-18-this-feels-inconsistent-with-the-rest-of",
    "chunk": "This feels inconsistent with the rest of the product.",
    "ipa": "/ðɪs filz ˌɪnkənˈsɪstənt wɪð ðə rɛst ʌv ðə ˈprɑdʌkt/",
    "meaning": "Esto se siente inconsistente con el resto del producto.",
    "example": "This feels inconsistent with the rest of the product's design system.",
    "example_translation": "Esto se siente inconsistente con el resto del sistema de diseño del producto.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Here's the new settings page.",
        "es": "Aquí está la nueva página de ajustes."
      },
      {
        "en": "This feels inconsistent with the rest of the product.",
        "es": "Esto se siente inconsistente con el resto del producto."
      }
    ]
  },
  {
    "id": "tech-design-19-who-are-we-designing-this-for-exactly",
    "chunk": "Who are we designing this for, exactly?",
    "ipa": "/hu ɑr wi dɪˈzaɪnɪŋ ðɪs fɔr ɪɡˈzæktli/",
    "meaning": "¿Para quién estamos diseñando esto exactamente?",
    "example": "Who are we designing this for, exactly? Power users or first-time visitors?",
    "example_translation": "¿Para quién estamos diseñando esto exactamente? ¿Usuarios avanzados o visitantes primerizos?",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I added a lot of advanced options here.",
        "es": "Añadí muchas opciones avanzadas aquí."
      },
      {
        "en": "Who are we designing this for, exactly?",
        "es": "¿Para quién estamos diseñando esto exactamente?"
      }
    ]
  },
  {
    "id": "tech-design-20-lets-park-this-idea-and-revisit-it-next-",
    "chunk": "Let's park this idea and revisit it next sprint.",
    "ipa": "/lɛts pɑrk ðɪs aɪˈdiə ænd ˈrɪvɪzɪt ɪt nɛkst sprɪnt/",
    "meaning": "Dejemos esta idea en pausa y retomémosla el próximo sprint.",
    "example": "Let's park this idea and revisit it next sprint when we have more time.",
    "example_translation": "Dejemos esta idea en pausa y retomémosla el próximo sprint cuando tengamos más tiempo.",
    "category": "Design Critique",
    "tag": "Design",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "This redesign idea could take weeks.",
        "es": "Esta idea de rediseño podría tomar semanas."
      },
      {
        "en": "Let's park this idea and revisit it next sprint.",
        "es": "Dejemos esta idea en pausa y retomémosla el próximo sprint."
      }
    ]
  },
  {
    "id": "tech-stake-01-just-to-make-sure-were-on-the-same-page",
    "chunk": "Just to make sure we're on the same page…",
    "ipa": "/dʒʌst tu meɪk ʃʊr wir ɑn ðə seɪm peɪdʒ/",
    "meaning": "Solo para asegurarnos de que estamos de acuerdo…",
    "example": "Just to make sure we're on the same page, let me summarize what we decided.",
    "example_translation": "Solo para asegurarnos de que estamos de acuerdo, déjame resumir lo que decidimos.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "So we'll launch next month, right?",
        "es": "Entonces lanzaremos el próximo mes, ¿verdad?"
      },
      {
        "en": "Just to make sure we're on the same page, yes.",
        "es": "Solo para asegurarnos de que estamos de acuerdo, sí."
      }
    ]
  },
  {
    "id": "tech-stake-02-what-does-success-look-like-here",
    "chunk": "What does success look like here?",
    "ipa": "/wʌt dʌz səkˈsɛs lʊk laɪk hɪr/",
    "meaning": "¿Cómo se ve el éxito aquí?",
    "example": "What does success look like here, in terms of measurable outcomes?",
    "example_translation": "¿Cómo se ve el éxito aquí, en términos de resultados medibles?",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "We want to improve user engagement.",
        "es": "Queremos mejorar la participación de los usuarios."
      },
      {
        "en": "What does success look like here?",
        "es": "¿Cómo se ve el éxito aquí?"
      }
    ]
  },
  {
    "id": "tech-stake-03-let-me-circle-back-on-that",
    "chunk": "Let me circle back on that.",
    "ipa": "/lɛt mi ˈsɜrkəl bæk ɑn ðæt/",
    "meaning": "Déjame retomar eso después.",
    "example": "Let me circle back on that once I've checked with the team.",
    "example_translation": "Déjame retomar eso después de consultarlo con el equipo.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Can we commit to that date today?",
        "es": "¿Podemos comprometernos a esa fecha hoy?"
      },
      {
        "en": "Let me circle back on that.",
        "es": "Déjame retomar eso después."
      }
    ]
  },
  {
    "id": "tech-stake-04-i-hear-your-concern-but-i-see-it-differe",
    "chunk": "I hear your concern, but I see it differently.",
    "ipa": "/aɪ hɪr jɔr kənˈsɜrn bʌt aɪ si ɪt ˈdɪfərəntli/",
    "meaning": "Entiendo tu preocupación, pero yo lo veo diferente.",
    "example": "I hear your concern, but I see it differently based on what the data shows.",
    "example_translation": "Entiendo tu preocupación, pero yo lo veo diferente según lo que muestran los datos.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I'm worried this feature is too risky.",
        "es": "Me preocupa que esta función sea demasiado arriesgada."
      },
      {
        "en": "I hear your concern, but I see it differently.",
        "es": "Entiendo tu preocupación, pero yo lo veo diferente."
      }
    ]
  },
  {
    "id": "tech-stake-05-can-we-table-this-for-the-next-meeting",
    "chunk": "Can we table this for the next meeting?",
    "ipa": "/kæn wi ˈteɪbəl ðɪs fɔr ðə nɛkst ˈmitɪŋ/",
    "meaning": "¿Podemos dejar esto para la próxima reunión?",
    "example": "Can we table this for the next meeting? We're running out of time.",
    "example_translation": "¿Podemos dejar esto para la próxima reunión? Se nos está acabando el tiempo.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "We still have three topics to cover.",
        "es": "Todavía tenemos tres temas por cubrir."
      },
      {
        "en": "Can we table this for the next meeting?",
        "es": "¿Podemos dejar esto para la próxima reunión?"
      }
    ]
  },
  {
    "id": "tech-stake-06-ill-follow-up-with-an-email-summarizing-",
    "chunk": "I'll follow up with an email summarizing next steps.",
    "ipa": "/aɪl ˈfɑloʊ ʌp wɪð ən ˈimeɪl ˈsʌməˌraɪzɪŋ nɛkst stɛps/",
    "meaning": "Enviaré un correo resumiendo los siguientes pasos.",
    "example": "I'll follow up with an email summarizing next steps after this call.",
    "example_translation": "Enviaré un correo resumiendo los siguientes pasos después de esta llamada.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Great meeting, what happens now?",
        "es": "Buena reunión, ¿qué sigue ahora?"
      },
      {
        "en": "I'll follow up with an email summarizing next steps.",
        "es": "Enviaré un correo resumiendo los siguientes pasos."
      }
    ]
  },
  {
    "id": "tech-stake-07-thats-not-something-we-can-commit-to-thi",
    "chunk": "That's not something we can commit to this quarter.",
    "ipa": "/ðæts nɑt ˈsʌmθɪŋ wi kæn kəˈmɪt tu ðɪs ˈkwɔrtər/",
    "meaning": "Eso no es algo a lo que podamos comprometernos este trimestre.",
    "example": "That's not something we can commit to this quarter, given our current priorities.",
    "example_translation": "Eso no es algo a lo que podamos comprometernos este trimestre, dadas nuestras prioridades actuales.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Can you also build the mobile app by then?",
        "es": "¿También pueden construir la app móvil para entonces?"
      },
      {
        "en": "That's not something we can commit to this quarter.",
        "es": "Eso no es algo a lo que podamos comprometernos este trimestre."
      }
    ]
  },
  {
    "id": "tech-stake-08-lets-align-on-priorities-before-we-dive-",
    "chunk": "Let's align on priorities before we dive into details.",
    "ipa": "/lɛts əˈlaɪn ɑn praɪˈɔrɪtiz bɪˈfɔr wi daɪv ˈɪntu ˈditeɪlz/",
    "meaning": "Alineemos las prioridades antes de entrar en detalles.",
    "example": "Let's align on priorities before we dive into details on implementation.",
    "example_translation": "Alineemos las prioridades antes de entrar en detalles de implementación.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "So, where do we start?",
        "es": "Entonces, ¿por dónde empezamos?"
      },
      {
        "en": "Let's align on priorities before we dive into details.",
        "es": "Alineemos las prioridades antes de entrar en detalles."
      }
    ]
  },
  {
    "id": "tech-stake-09-i-want-to-make-sure-expectations-are-rea",
    "chunk": "I want to make sure expectations are realistic.",
    "ipa": "/aɪ wɑnt tu meɪk ʃʊr ˌɛkspɛkˈteɪʃənz ɑr ˌriəˈlɪstɪk/",
    "meaning": "Quiero asegurarme de que las expectativas sean realistas.",
    "example": "I want to make sure expectations are realistic before we promise a date.",
    "example_translation": "Quiero asegurarme de que las expectativas sean realistas antes de prometer una fecha.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Can we promise this to the client by Monday?",
        "es": "¿Podemos prometerle esto al cliente para el lunes?"
      },
      {
        "en": "I want to make sure expectations are realistic.",
        "es": "Quiero asegurarme de que las expectativas sean realistas."
      }
    ]
  },
  {
    "id": "tech-stake-10-could-you-clarify-what-you-mean-by-urgen",
    "chunk": "Could you clarify what you mean by 'urgent'?",
    "ipa": "/kʊd ju ˈklærəfaɪ wʌt ju min baɪ ˈɜrdʒənt/",
    "meaning": "¿Podrías aclarar a qué te refieres con 'urgente'?",
    "example": "Could you clarify what you mean by 'urgent'? Do you need it today or this week?",
    "example_translation": "¿Podrías aclarar a qué te refieres con 'urgente'? ¿Lo necesitas hoy o esta semana?",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "We need this fixed urgently.",
        "es": "Necesitamos que esto se arregle urgentemente."
      },
      {
        "en": "Could you clarify what you mean by 'urgent'?",
        "es": "¿Podrías aclarar a qué te refieres con 'urgente'?"
      }
    ]
  },
  {
    "id": "tech-stake-11-ill-loop-in-the-design-team-on-this",
    "chunk": "I'll loop in the design team on this.",
    "ipa": "/aɪl lup ɪn ðə dɪˈzaɪn tim ɑn ðɪs/",
    "meaning": "Voy a incluir al equipo de diseño en esto.",
    "example": "I'll loop in the design team on this before we finalize the plan.",
    "example_translation": "Voy a incluir al equipo de diseño en esto antes de finalizar el plan.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Who else needs to know about this change?",
        "es": "¿Quién más necesita saber de este cambio?"
      },
      {
        "en": "I'll loop in the design team on this.",
        "es": "Voy a incluir al equipo de diseño en esto."
      }
    ]
  },
  {
    "id": "tech-stake-12-lets-take-this-offline-and-revisit-with-",
    "chunk": "Let's take this offline and revisit with more context.",
    "ipa": "/lɛts teɪk ðɪs ˈɔflaɪn ænd ˈrɪvɪzɪt wɪð mɔr ˈkɑntɛkst/",
    "meaning": "Llevemos esto fuera de la reunión y retomémoslo con más contexto.",
    "example": "Let's take this offline and revisit with more context next week.",
    "example_translation": "Llevemos esto fuera de la reunión y retomémoslo con más contexto la próxima semana.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "This is turning into a long debate.",
        "es": "Esto se está convirtiendo en un debate largo."
      },
      {
        "en": "Let's take this offline and revisit with more context.",
        "es": "Llevemos esto fuera de la reunión y retomémoslo con más contexto."
      }
    ]
  },
  {
    "id": "tech-stake-13-i-appreciate-the-feedback-ill-take-it-in",
    "chunk": "I appreciate the feedback, I'll take it into account.",
    "ipa": "/aɪ əˈpriʃieɪt ðə ˈfidbæk aɪl teɪk ɪt ˈɪntu əˈkaʊnt/",
    "meaning": "Agradezco la retroalimentación, la tomaré en cuenta.",
    "example": "I appreciate the feedback, I'll take it into account for the next version.",
    "example_translation": "Agradezco la retroalimentación, la tomaré en cuenta para la próxima versión.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "I think the pricing page is confusing.",
        "es": "Creo que la página de precios es confusa."
      },
      {
        "en": "I appreciate the feedback, I'll take it into account.",
        "es": "Agradezco la retroalimentación, la tomaré en cuenta."
      }
    ]
  },
  {
    "id": "tech-stake-14-whos-the-decision-maker-on-this-one",
    "chunk": "Who's the decision-maker on this one?",
    "ipa": "/huz ðə dɪˈsɪʒən ˈmeɪkər ɑn ðɪs wʌn/",
    "meaning": "¿Quién es quien toma la decisión en esto?",
    "example": "Who's the decision-maker on this one? I want to make sure we ask the right person.",
    "example_translation": "¿Quién es quien toma la decisión en esto? Quiero asegurarme de preguntarle a la persona correcta.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "We can't seem to move forward on this.",
        "es": "Parece que no podemos avanzar en esto."
      },
      {
        "en": "Who's the decision-maker on this one?",
        "es": "¿Quién es quien toma la decisión en esto?"
      }
    ]
  },
  {
    "id": "tech-stake-15-lets-set-a-follow-up-to-check-on-progres",
    "chunk": "Let's set a follow-up to check on progress.",
    "ipa": "/lɛts sɛt ə ˈfɑloʊ ʌp tu tʃɛk ɑn ˈprɑɡrɛs/",
    "meaning": "Programemos un seguimiento para revisar el progreso.",
    "example": "Let's set a follow-up to check on progress in two weeks.",
    "example_translation": "Programemos un seguimiento para revisar el progreso en dos semanas.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "So we've agreed on the plan.",
        "es": "Entonces hemos acordado el plan."
      },
      {
        "en": "Great — let's set a follow-up to check on progress.",
        "es": "Genial — programemos un seguimiento para revisar el progreso."
      }
    ]
  },
  {
    "id": "tech-stake-16-i-dont-think-thats-feasible-with-our-cur",
    "chunk": "I don't think that's feasible with our current resources.",
    "ipa": "/aɪ doʊnt θɪŋk ðæts ˈfizəbəl wɪð aʊr ˈkʌrənt ˈrisɔrsɪz/",
    "meaning": "No creo que eso sea viable con nuestros recursos actuales.",
    "example": "I don't think that's feasible with our current resources and timeline.",
    "example_translation": "No creo que eso sea viable con nuestros recursos actuales y el plazo que tenemos.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "We'd like to launch in three languages at once.",
        "es": "Nos gustaría lanzar en tres idiomas a la vez."
      },
      {
        "en": "I don't think that's feasible with our current resources.",
        "es": "No creo que eso sea viable con nuestros recursos actuales."
      }
    ]
  },
  {
    "id": "tech-stake-17-can-we-get-alignment-from-the-whole-team",
    "chunk": "Can we get alignment from the whole team first?",
    "ipa": "/kæn wi ɡɛt əˈlaɪnmənt frʌm ðə hoʊl tim fɜrst/",
    "meaning": "¿Podemos obtener el acuerdo de todo el equipo primero?",
    "example": "Can we get alignment from the whole team first before we announce this?",
    "example_translation": "¿Podemos obtener el acuerdo de todo el equipo primero antes de anunciar esto?",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Let's announce the new policy tomorrow.",
        "es": "Anunciemos la nueva política mañana."
      },
      {
        "en": "Can we get alignment from the whole team first?",
        "es": "¿Podemos obtener el acuerdo de todo el equipo primero?"
      }
    ]
  },
  {
    "id": "tech-stake-18-i-want-to-flag-a-risk-before-we-move-for",
    "chunk": "I want to flag a risk before we move forward.",
    "ipa": "/aɪ wɑnt tu flæɡ ə rɪsk bɪˈfɔr wi muv ˈfɔrwərd/",
    "meaning": "Quiero señalar un riesgo antes de avanzar.",
    "example": "I want to flag a risk before we move forward with this timeline.",
    "example_translation": "Quiero señalar un riesgo antes de avanzar con este cronograma.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "So we'll go ahead with this plan.",
        "es": "Entonces seguiremos adelante con este plan."
      },
      {
        "en": "I want to flag a risk before we move forward.",
        "es": "Quiero señalar un riesgo antes de avanzar."
      }
    ]
  },
  {
    "id": "tech-stake-19-lets-agree-on-a-single-source-of-truth-f",
    "chunk": "Let's agree on a single source of truth for this data.",
    "ipa": "/lɛts əˈɡri ɑn ə ˈsɪŋɡəl sɔrs ʌv truθ fɔr ðɪs ˈdeɪtə/",
    "meaning": "Acordemos una única fuente de verdad para estos datos.",
    "example": "Let's agree on a single source of truth for this data before we build reports on it.",
    "example_translation": "Acordemos una única fuente de verdad para estos datos antes de construir reportes sobre ellos.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "Marketing has different numbers than we do.",
        "es": "Marketing tiene números diferentes a los nuestros."
      },
      {
        "en": "Let's agree on a single source of truth for this data.",
        "es": "Acordemos una única fuente de verdad para estos datos."
      }
    ]
  },
  {
    "id": "tech-stake-20-thanks-for-your-patience-while-we-sort-t",
    "chunk": "Thanks for your patience while we sort this out.",
    "ipa": "/θæŋks fɔr jɔr ˈpeɪʃəns waɪl wi sɔrt ðɪs aʊt/",
    "meaning": "Gracias por tu paciencia mientras resolvemos esto.",
    "example": "Thanks for your patience while we sort this out on our end.",
    "example_translation": "Gracias por tu paciencia mientras resolvemos esto de nuestro lado.",
    "category": "Stakeholder Meetings",
    "tag": "Meetings",
    "track": "tech",
    "example_dialogue": [
      {
        "en": "This has taken longer than expected.",
        "es": "Esto ha tomado más tiempo del esperado."
      },
      {
        "en": "Thanks for your patience while we sort this out.",
        "es": "Gracias por tu paciencia mientras resolvemos esto."
      }
    ]
  }
];
