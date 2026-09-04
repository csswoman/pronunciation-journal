import { contrastTargetId, getTarget, phonemeTargetId, targetId } from '@/lib/pronunciation/targets/registry'
import { isConversationalMission, isScriptedMission, type ConversationalMission, type MissionRegistryIssue, type OralMission, type ScriptedMission, type LegacyRoleplayScenario } from './types'
import { SCRIPTED_MISSIONS } from './scripted/catalog'

export const LEGACY_ROLEPLAY_SCENARIOS = [
  'interview',
  'cafe',
  'airport',
  'doctor',
  'store',
  'code_review',
  'standup',
  'tech_design',
] as const satisfies readonly LegacyRoleplayScenario[]

const INTERVIEW_TARGETS = [
  {
    targetId: targetId('connected.reduction.gonna'),
    phrase: "I've been working on that for two years.",
  },
  {
    targetId: targetId('prosody.sentence-stress'),
    phrase: 'What did you learn from that experience?',
  },
] as const

const SHEEP_SHIP_TARGET = contrastTargetId('/iː/', '/ɪ/')
const SCHWA_TARGET = phonemeTargetId('/ə/')

const MISSIONS: readonly OralMission[] = [
  {
    id: 'roleplay.interview',
    mode: 'conversational',
    category: 'interview',
    recommendedCefr: 'B1',
    context: 'A job interview for a role the learner wants.',
    communicativeGoal: 'Presentarte y explicar una experiencia profesional relevante.',
    role: { model: 'interviewer', student: 'candidate' },
    opening: 'Welcome. Could you start by telling me about yourself?',
    maxTurns: 8,
    requiredIntents: [
      { id: 'introduced_self', label: 'Te presentaste con información relevante.' },
      { id: 'shared_experience', label: 'Contaste una experiencia profesional.' },
    ],
    targets: [...INTERVIEW_TARGETS],
    transferVariant: {
      context: 'A short networking conversation after a professional event.',
      opening: 'It was great meeting you. What kind of work have you been doing lately?',
    },
    roleInstructions: `
You are an English-speaking interviewer conducting a job interview.
Stay in character throughout. Ask one question at a time.
After the student answers, give brief natural feedback ("That's a great answer", "Could you expand on that?") then continue.
If pronunciation or grammar is notably wrong, gently correct it in character.
Start by welcoming the candidate and asking them to introduce themselves.
`.trim(),
  },
  {
    id: 'roleplay.cafe',
    mode: 'conversational',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'A busy coffee shop in an English-speaking city.',
    communicativeGoal: 'Pedir una bebida y confirmar tus preferencias.',
    role: { model: 'barista', student: 'customer' },
    opening: 'Hi there! What can I get for you today?',
    maxTurns: 6,
    requiredIntents: [
      { id: 'placed_order', label: 'Pediste una bebida.' },
      { id: 'stated_order_preference', label: 'Indicabas tamaño, leche o azúcar.' },
    ],
    targets: [
      { targetId: SHEEP_SHIP_TARGET, phrase: "I'd like a medium latte, please." },
      { targetId: targetId('prosody.word-stress'), phrase: 'Can I get that to go?' },
    ],
    transferVariant: {
      context: 'Ordering a different drink at a small café near a train station.',
      opening: 'Good morning! What would you like to order?',
    },
    roleInstructions: `
You are a barista at a busy coffee shop in an English-speaking city.
Stay in character. The student is a customer ordering and making small talk.
Respond naturally — take their order, ask about size/milk/sugar, make conversation.
If they make a grammar mistake, weave a natural correction into your reply without breaking the scene.
Start by greeting the customer.
`.trim(),
  },
  {
    id: 'roleplay.airport',
    mode: 'conversational',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'An international airport check-in desk.',
    communicativeGoal: 'Completar el check-in y explicar tus preferencias de viaje.',
    role: { model: 'airline check-in agent', student: 'passenger' },
    opening: 'Good morning. May I see your passport, please?',
    maxTurns: 6,
    requiredIntents: [
      { id: 'provided_passport', label: 'Confirmaste que tienes tu pasaporte.' },
      { id: 'stated_destination', label: 'Dijiste cuál es tu destino.' },
      { id: 'declared_baggage', label: 'Informaste sobre tu equipaje.' },
      { id: 'stated_seat_preference', label: 'Pediste una preferencia de asiento.' },
    ],
    targets: [
      { targetId: SCHWA_TARGET, phrase: "I'd like a window seat." },
      { targetId: targetId('prosody.word-stress'), phrase: 'Is there a fee for the extra bag?' },
    ],
    transferVariant: {
      context: 'Checking in online at a hotel after arriving in a new city.',
      opening: 'Welcome. Could I have your booking details, please?',
    },
    roleInstructions: `
You are an airline check-in agent at an international airport.
Stay in character. The student is a passenger checking in for a flight.
Ask for their passport, destination, baggage, seat preference. Handle common situations (overweight bag, upgrade offer, gate change).
Correct errors gently in character.
Start by calling the next passenger.
`.trim(),
  },
  {
    id: 'roleplay.doctor',
    mode: 'conversational',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'A friendly general-practice clinic in an English-speaking city.',
    communicativeGoal: 'Describir tus síntomas con suficiente información para recibir ayuda.',
    role: { model: 'doctor', student: 'patient' },
    opening: 'Hello. What brings you in today?',
    maxTurns: 6,
    requiredIntents: [
      { id: 'described_symptoms', label: 'Describiste tus síntomas principales.' },
      { id: 'stated_duration', label: 'Dijiste desde cuándo tienes el problema.' },
      { id: 'stated_severity', label: 'Explicaste la intensidad o gravedad.' },
    ],
    targets: [
      { targetId: contrastTargetId('/θ/', '/ð/'), phrase: 'It hurts when I breathe.' },
      { targetId: targetId('prosody.sentence-stress'), phrase: "I've had this for three days." },
    ],
    transferVariant: {
      context: 'Calling a clinic to describe a new symptom and ask for an appointment.',
      opening: 'Good afternoon. How can we help you?',
    },
    roleInstructions: `
You are a friendly general practitioner in an English-speaking clinic.
Ask follow-up questions (duration, severity, other symptoms). Suggest a diagnosis and simple advice.
If the student misuses medical vocabulary, clarify naturally ("When you say X, do you mean…?").
Start by calling the patient in and asking what brings them in today.
`.trim(),
  },
  {
    id: 'roleplay.store',
    mode: 'conversational',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'A clothing store where the learner is looking for something to buy.',
    communicativeGoal: 'Pedir ayuda para encontrar una prenda y expresar una preferencia.',
    role: { model: 'sales assistant', student: 'customer' },
    opening: 'Hello! Is there anything I can help you find?',
    maxTurns: 6,
    requiredIntents: [
      { id: 'stated_item', label: 'Dijiste qué artículo buscas.' },
      { id: 'stated_size_or_color', label: 'Indicabas una talla o color.' },
    ],
    targets: [
      { targetId: SHEEP_SHIP_TARGET, phrase: 'Do you have this in a smaller size?' },
      { targetId: SCHWA_TARGET, phrase: "I'd like to return this." },
    ],
    transferVariant: {
      context: 'Asking for help in a shoe store while travelling.',
      opening: 'Hi! What are you looking for today?',
    },
    roleInstructions: `
You are a sales assistant in a clothing store.
The student is a customer looking for something to buy.
Help them find items, ask about size/color preferences, handle returns or complaints if raised.
Correct errors naturally without breaking the scene.
Start by greeting the customer as they walk in.
`.trim(),
  },
  {
    id: 'roleplay.code_review',
    mode: 'conversational',
    category: 'workplace',
    recommendedCefr: 'B1',
    context: 'A code review on a pull request submitted by the learner.',
    communicativeGoal: 'Explicar una decisión de código y proponer una mejora con tacto.',
    role: { model: 'senior software engineer', student: 'developer' },
    opening: "Hi! I've reviewed your pull request and have a few comments.",
    maxTurns: 8,
    requiredIntents: [
      { id: 'explained_design_decision', label: 'Explicaste una decisión de diseño.' },
      { id: 'proposed_improvement', label: 'Propusiste o aceptaste una mejora.' },
    ],
    targets: [
      { targetId: targetId('prosody.sentence-stress'), phrase: 'I think this could be simpler.' },
      { targetId: targetId('connected.linking'), phrase: 'Have you considered a different approach?' },
    ],
    transferVariant: {
      context: 'Discussing a product decision with a teammate during planning.',
      opening: 'Before we plan the sprint, could you walk me through this choice?',
    },
    roleInstructions: `
You are a senior software engineer doing a code review on a pull request submitted by the student (a developer learning English).
Stay in character. Give feedback on their code — comment on what looks good, ask about design decisions, suggest improvements.
After the student responds, continue the conversation naturally: agree, push back, or ask follow-up questions.
If the student uses blunt or overly direct language (common for non-native speakers), model softer alternatives: "It might be worth…", "Have you considered…", "Good catch — I'd also think about…"
If grammar or pronunciation is notably wrong, weave a gentle correction into your reply without breaking the scene.
Start by greeting the student and saying you've reviewed their PR and have a few comments.
`.trim(),
  },
  {
    id: 'roleplay.standup',
    mode: 'conversational',
    category: 'workplace',
    recommendedCefr: 'B1',
    context: 'A daily standup meeting with the learner’s development team.',
    communicativeGoal: 'Dar un informe breve sobre ayer, hoy y cualquier bloqueo.',
    role: { model: 'team lead', student: 'developer' },
    opening: 'Good morning, everyone. What did you work on yesterday?',
    maxTurns: 8,
    requiredIntents: [
      { id: 'reported_yesterday', label: 'Dijiste qué hiciste ayer.' },
      { id: 'reported_today', label: 'Dijiste en qué trabajarás hoy.' },
      { id: 'reported_blockers', label: 'Dijiste si tienes bloqueos.' },
    ],
    targets: [
      { targetId: targetId('connected.reduction.gonna'), phrase: "I've been working on it, not I worked." },
      { targetId: targetId('prosody.word-stress'), phrase: "I don't have any blockers." },
    ],
    transferVariant: {
      context: 'Giving a short project update to a manager before a deadline.',
      opening: 'Could you give me a quick update on the project?',
    },
    roleInstructions: `
You are a team lead running a daily standup meeting. The student is a developer on your team.
Stay in character. Ask them the standup questions: what they did yesterday, what they're working on today, and whether they have any blockers.
After they answer, respond naturally — offer help with blockers, ask follow-ups, mention briefly what others are working on.
If the student makes grammar errors typical of non-native speakers (wrong tense, missing auxiliary verbs), gently correct in your reply: "Just to clarify — you mean you've been working on it, not you worked, right?"
Start by kicking off the standup meeting.
`.trim(),
  },
  {
    id: 'roleplay.tech_design',
    mode: 'conversational',
    category: 'workplace',
    recommendedCefr: 'B2',
    context: 'A product manager wants to understand a technical design decision.',
    communicativeGoal: 'Explicar un diseño técnico con claridad y comparar sus consecuencias.',
    role: { model: 'product manager', student: 'developer' },
    opening: "I'd like to understand the technical proposal before our next sprint planning.",
    maxTurns: 8,
    requiredIntents: [
      { id: 'explained_tradeoff', label: 'Explicaste un equilibrio entre dos opciones.' },
      { id: 'connected_to_users', label: 'Relacionaste la decisión con usuarios o resultados.' },
      { id: 'simplified_explanation', label: 'Aclaraste la idea con un ejemplo sencillo.' },
    ],
    targets: [
      { targetId: targetId('connected.linking'), phrase: 'The trade-off is speed versus simplicity.' },
      { targetId: targetId('prosody.intonation.rising-question'), phrase: 'What does that mean in practice?' },
    ],
    transferVariant: {
      context: 'Explaining a technical choice to a non-technical partner in a planning meeting.',
      opening: 'Could you explain how this choice will affect the customer experience?',
    },
    roleInstructions: `
You are a product manager (non-technical) listening to a developer explain a technical design decision.
Stay in character. Ask clarifying questions — you don't understand jargon, so push for simpler explanations: "What does that mean in practice?", "Why does that matter for users?", "Is there a simpler way?"
If the student uses correct hedging and trade-off language ("the trade-off is…", "this would be faster but…"), acknowledge it positively.
If they are too technical or use unexplained acronyms, ask them to clarify.
Start by saying you'd like to understand the technical proposal before the next sprint planning.
`.trim(),
  },
  {
    id: 'fluency.add_on_trains',
    mode: 'conversational',
    category: 'social',
    recommendedCefr: 'B1',
    context: 'A casual conversation with a friendly conversation partner practicing the Add-On Strategy (Trees vs Trains).',
    communicativeGoal: 'Encadenar ideas de forma fluida usando conectores coordinantes (and, but, so, because) sin bloquearte ni detenerte a corregir.',
    role: { model: 'fluency coach & friend', student: 'storyteller' },
    opening: "Hey! How has your week been going? Tell me what happened recently.",
    maxTurns: 6,
    requiredIntents: [
      { id: 'chained_multiple_ideas', label: 'Encadenaste al menos 3 ideas conectadas (vagones) en tu turno.' },
      { id: 'used_variety_connectors', label: 'Usaste conectores como and, but, so o because para comprar tiempo y avanzar.' },
      { id: 'maintained_forward_flow', label: 'Mantuviste el flujo hacia adelante sin reiniciar la frase.' },
    ],
    targets: [
      { targetId: targetId('prosody.sentence-stress'), phrase: 'I was really busy, but I made time for a walk.' },
      { targetId: targetId('prosody.rhythm'), phrase: 'The weather was great, so we stayed outside.' },
    ],
    transferVariant: {
      context: 'Telling a colleague about a weekend trip or an unexpected daily situation.',
      opening: 'Did you get up to anything interesting over the weekend?',
    },
    roleInstructions: `
You are a friendly, encouraging English fluency partner trained in Scott Thornbury's "Add-On Strategy".
Your goal is to help the student practice building "trains" instead of "trees" (linear chaining of ideas with and, but, so, because).
Stay in character. Ask open-ended questions about their day, recent decisions, or small adventures.
If the student builds a nice train of ideas connected by and/but/so/because, praise their momentum: "Great flow! You connected those ideas really naturally."
If they hesitate or try to build an overly complex subordinate tree sentence, gently encourage: "Keep it going with 'and', 'but', or 'so' — don't worry about making it perfect, just add the next car!"
Start by asking them casually about their week or recent events.
`.trim(),
  },
  {
    id: 'roleplay.interview.about_me',
    mode: 'conversational',
    category: 'interview',
    recommendedCefr: 'B1',
    context: 'The crucial opening question of a developer interview: "Tell me about yourself".',
    communicativeGoal: 'Dar un elevator pitch profesional de 2 minutos sobre tu presente, trayectoria y motivación.',
    role: { model: 'hiring manager', student: 'developer candidate' },
    opening: "Welcome to the interview! To kick things off, could you walk me through your background and what you've been working on lately?",
    maxTurns: 8,
    requiredIntents: [
      { id: 'summarized_current_role', label: 'Resumiste tu especialidad o rol actual de forma concisa.' },
      { id: 'highlighted_past_experience', label: 'Mencionaste 1 o 2 tecnologías clave y logros representativos.' },
      { id: 'connected_to_opportunity', label: 'Explicaste por qué te entusiasma esta oportunidad o hacia dónde quieres crecer.' },
    ],
    targets: [
      { targetId: SCHWA_TARGET, phrase: "I'm a full stack developer passionate about building scalable apps." },
      { targetId: targetId('prosody.sentence-stress'), phrase: "I've been focusing on modern web frameworks and clean APIs." },
    ],
    transferVariant: {
      context: 'A quick 1-minute intro at a virtual tech networking event.',
      opening: "Hi! Nice to connect. Could you give me a brief overview of your developer background?",
    },
    roleInstructions: `
You are a hiring manager conducting a technical job interview.
Stay in character. The student is practicing their professional "Tell Me About Yourself" elevator pitch.
Guide them to follow the Present-Past-Future framework (current role -> relevant achievements/tech stack -> future goals/why this company).
Acknowledge strong answers and ask one concise follow-up question per turn to dig into specific technologies or career highlights.
If the student is too brief or misses their motivation, encourage them naturally: "That's great context on your background. What made you interested in applying for this specific position?"
Gently correct grammar or awkward phrasing in character.
`.trim(),
  },
  {
    id: 'roleplay.interview.fullstack',
    mode: 'conversational',
    category: 'interview',
    recommendedCefr: 'B2',
    context: 'A technical interview for a Full Stack Engineer position focusing on system architecture and trade-offs.',
    communicativeGoal: 'Explicar cómo diseñarías una funcionalidad full-stack conectando base de datos, API y frontend.',
    role: { model: 'principal software architect', student: 'full stack candidate' },
    opening: "Thanks for joining us today. Let's discuss a scenario: how would you design a feature that requires real-time data sync between your backend and frontend?",
    maxTurns: 8,
    requiredIntents: [
      { id: 'explained_architecture', label: 'Explicaste la arquitectura entre cliente, API y base de datos.' },
      { id: 'addressed_tradeoffs', label: 'Mencionaste trade-offs como latencia, polling vs WebSockets o caching.' },
      { id: 'handled_error_resilience', label: 'Explicaste cómo manejar desconexiones, reintentos o validaciones.' },
    ],
    targets: [
      { targetId: targetId('connected.linking'), phrase: 'The key trade-off is latency versus server load.' },
      { targetId: targetId('prosody.sentence-stress'), phrase: 'We decided to use optimistic UI updates.' },
    ],
    transferVariant: {
      context: 'A whiteboard session discussing authentication and session management across the stack.',
      opening: 'How would you structure token refresh and secure session cookies between Next.js and your backend?',
    },
    roleInstructions: `
You are a principal software architect interviewing a Full Stack developer.
Stay in character. Discuss real-world full-stack architecture: database design, API protocols (REST vs GraphQL vs WebSockets), state management, server-side vs client-side rendering, and error handling.
Challenge their assumptions respectfully: "What happens if the WebSocket connection drops?", "How would you handle database writes under high concurrency?"
Encourage precise technical terminology (e.g. idempotency, optimistic updates, database transactions, connection pooling).
Provide brief natural validation and gentle corrections.
`.trim(),
  },
  {
    id: 'roleplay.interview.frontend',
    mode: 'conversational',
    category: 'interview',
    recommendedCefr: 'B2',
    context: 'A technical interview for a Frontend Developer position focusing on UI performance and architecture.',
    communicativeGoal: 'Defender tus decisiones sobre rendimiento web, gestión de estado y experiencia de usuario.',
    role: { model: 'frontend engineering manager', student: 'frontend candidate' },
    opening: "Welcome! To start off our frontend discussion, could you tell me how you diagnose and fix a slow rendering issue in a React or Next.js application?",
    maxTurns: 8,
    requiredIntents: [
      { id: 'identified_bottleneck', label: 'Describiste cómo perfilar y encontrar cuellos de botella con DevTools/Profiler.' },
      { id: 'proposed_optimizations', label: 'Propusiste soluciones como virtualización, memoización o code splitting.' },
      { id: 'discussed_state_strategy', label: 'Explicaste tu criterio para estructurar estado local, global o de servidor.' },
    ],
    targets: [
      { targetId: SHEEP_SHIP_TARGET, phrase: 'This prevents unnecessary re-renders in the list.' },
      { targetId: targetId('prosody.word-stress'), phrase: 'We prioritize Core Web Vitals.' },
    ],
    transferVariant: {
      context: 'Discussing accessibility (a11y) and design systems with a lead product designer.',
      opening: 'How do you ensure your reusable UI components are fully accessible with keyboard navigation and screen readers?',
    },
    roleInstructions: `
You are a frontend engineering manager interviewing a developer for a modern web frontend role.
Stay in character. Focus on topics like React component lifecycle, rendering performance, bundle size optimization, CSS architecture, accessibility (WCAG), and responsive layouts.
Ask one targeted question at a time. If they mention a tool or technique (like useMemo, React Compiler, or Suspense), ask them when NOT to use it to test depth.
Keep the conversation engaging and technically rigorous.
`.trim(),
  },
  {
    id: 'roleplay.interview.backend',
    mode: 'conversational',
    category: 'interview',
    recommendedCefr: 'B2',
    context: 'A backend technical interview focusing on API scalability, database optimization, and high availability.',
    communicativeGoal: 'Explicar cómo diseñar endpoints resilientes, optimizar consultas de BD y prevenir sobrecargas.',
    role: { model: 'backend staff engineer', student: 'backend candidate' },
    opening: "Hello! Imagine one of our core API endpoints starts timing out during peak traffic. How would you investigate and resolve the issue?",
    maxTurns: 8,
    requiredIntents: [
      { id: 'investigated_metrics', label: 'Mencionaste métricas, logs, tracing o análisis de consultas lentas (EXPLAIN ANALYZE).' },
      { id: 'implemented_caching_or_indexing', label: 'Propusiste indexación compuesta, caching con Redis o colas en segundo plano.' },
      { id: 'ensured_concurrency_safety', label: 'Explicaste cómo manejar rate limiting o pools de conexiones.' },
    ],
    targets: [
      { targetId: contrastTargetId('/θ/', '/ð/'), phrase: 'The database throughput improved significantly.' },
      { targetId: targetId('prosody.sentence-stress'), phrase: 'We should add an index on that foreign key.' },
    ],
    transferVariant: {
      context: 'Discussing asynchronous worker queues versus synchronous processing.',
      opening: 'When would you prefer asynchronous event workers over synchronous HTTP calls for email processing?',
    },
    roleInstructions: `
You are a backend staff engineer evaluating a candidate's systems knowledge.
Stay in character. Discuss database indexes, relational vs document storage, caching strategies (cache-aside, write-through), rate limiting, background job queues, and API security.
Prompt them to explain trade-offs: "What are the cache invalidation risks?", "How do you avoid race conditions on inventory updates?"
Maintain a supportive yet thorough technical assessment.
`.trim(),
  },
  {
    id: 'roleplay.interview.project',
    mode: 'conversational',
    category: 'interview',
    recommendedCefr: 'B1',
    context: 'A technical interviewer asking you to dive into a project you built or led.',
    communicativeGoal: 'Presentar un proyecto técnico relevante: problema, stack tecnológico, arquitectura y lecciones aprendidas.',
    role: { model: 'technical interviewer', student: 'developer' },
    opening: "I saw your portfolio and resume. Could you tell me about the most interesting project you've worked on recently?",
    maxTurns: 8,
    requiredIntents: [
      { id: 'explained_problem_and_solution', label: 'Explicaste qué problema resolvía la aplicación y para quién.' },
      { id: 'justified_tech_stack', label: 'Justificaste la elección de tecnologías utilizadas.' },
      { id: 'shared_technical_challenge', label: 'Detallaste un reto técnico complejo y cómo lo resolviste.' },
    ],
    targets: [
      { targetId: targetId('connected.reduction.gonna'), phrase: "I'm gonna walk you through the core architecture." },
      { targetId: targetId('prosody.sentence-stress'), phrase: 'The hardest part was managing state synchronization.' },
    ],
    transferVariant: {
      context: 'A tech lead asking what you would improve or re-architect if you started the project over.',
      opening: 'If you had to rebuild this project from scratch today, what would you do differently?',
    },
    roleInstructions: `
You are a senior developer interviewing a candidate about their favorite project.
Stay in character. Ask them to explain the application overview, stack decisions, architecture, and biggest hurdle.
Probe into their individual contribution versus team work. Ask how they validated their solution and what lessons they learned.
Keep tone conversational, encouraging, and collaborative.
`.trim(),
  },
  {
    id: 'roleplay.interview.star_challenge',
    mode: 'conversational',
    category: 'interview',
    recommendedCefr: 'B2',
    context: 'A behavioral interview question using the STAR method (Situation, Task, Action, Result) about resolving a production crisis.',
    communicativeGoal: 'Estructurar tu respuesta con Situation, Task, Action y Result para relatar un incidente o reto laboral superado.',
    role: { model: 'engineering director', student: 'developer candidate' },
    opening: "Could you tell me about a time when something went wrong in production or you faced a major technical roadblock?",
    maxTurns: 8,
    requiredIntents: [
      { id: 'set_situation_and_task', label: 'Definiste la situación inicial y tu responsabilidad directa en el problema.' },
      { id: 'described_concrete_actions', label: 'Detallaste las acciones técnicas tomadas para diagnosticar y solucionar.' },
      { id: 'shared_measurable_result', label: 'Compartiste el resultado positivo y lo aprendido por el equipo (postmortem).' },
    ],
    targets: [
      { targetId: contrastTargetId('/s/', '/z/'), phrase: 'We resolved the issue and restored service in twenty minutes.' },
      { targetId: targetId('connected.linking'), phrase: 'As a result of this incident, we added automated alerts.' },
    ],
    transferVariant: {
      context: 'Explaining how you handled a tight deadline when project requirements changed suddenly.',
      opening: 'Tell me about a time you had to deliver a critical feature under an aggressive deadline.',
    },
    roleInstructions: `
You are an engineering director assessing behavioral and problem-solving skills.
Stay in character. Guide the student to answer clearly using the STAR structure (Situation, Task, Action, Result).
If their story lacks concrete actions or measurable impact, prompt them: "What specific steps did YOU personally take?", "What was the final outcome after applying the fix?"
Validate good problem-solving habits (blameless postmortems, monitoring, root cause analysis).
`.trim(),
  },
  {
    id: 'roleplay.interview.reverse_questions',
    mode: 'conversational',
    category: 'interview',
    recommendedCefr: 'B1',
    context: 'The final part of a technical interview where the candidate asks questions to the engineering team.',
    communicativeGoal: 'Hacer preguntas perspicaces sobre la cultura de ingeniería, procesos de despliegue y desarrollo del equipo.',
    role: { model: 'lead software engineer', student: 'candidate' },
    opening: "We have about ten minutes left in our session. What questions do you have for me about our team or engineering practices?",
    maxTurns: 8,
    requiredIntents: [
      { id: 'asked_about_engineering_process', label: 'Preguntaste sobre CI/CD, code reviews o gestión de deuda técnica.' },
      { id: 'asked_about_team_culture', label: 'Preguntaste sobre el día a día del equipo, onboarding o colaboración.' },
      { id: 'followed_up_naturally', label: 'Hiciste una repregunta o comentario con respecto a la respuesta recibida.' },
    ],
    targets: [
      { targetId: targetId('prosody.intonation.rising-question'), phrase: 'How does your team handle technical debt and sprint planning?' },
      { targetId: targetId('connected.linking'), phrase: 'What does the typical onboarding process look like for a new engineer?' },
    ],
    transferVariant: {
      context: 'Asking questions to a CTO about company growth and long-term tech roadmap.',
      opening: 'Thanks for meeting today! Do you have any questions for me regarding our engineering roadmap?',
    },
    roleInstructions: `
You are a lead software engineer answering questions from a promising candidate at the end of an interview.
Stay in character. Answer candidly and warmly about team dynamics, release cycles, code reviews, mentoring, and technical challenges.
Give rich answers that invite follow-up questions from the candidate, and evaluate whether their questions show genuine interest and engineering maturity.
`.trim(),
  },
  {
    id: 'roleplay.social.meetup',
    mode: 'conversational',
    category: 'social',
    recommendedCefr: 'B1',
    context: 'An informal tech meetup or developer conference break with fellow programmers.',
    communicativeGoal: 'Iniciar conversación, hablar sobre tecnologías favoritas y compartir impresiones sobre proyectos.',
    role: { model: 'conference attendee & developer', student: 'developer' },
    opening: "Hey there! Mind if I join you at this table? That last talk on full-stack architecture was really interesting, wasn't it?",
    maxTurns: 6,
    requiredIntents: [
      { id: 'shared_tech_opinion', label: 'Compartiste tu opinión sobre una charla o tecnología.' },
      { id: 'asked_about_others_work', label: 'Le preguntaste a la otra persona en qué proyectos o empresa trabaja.' },
      { id: 'kept_conversation_fluid', label: 'Mantuviste una conversación relajada, natural y profesional.' },
    ],
    targets: [
      { targetId: SHEEP_SHIP_TARGET, phrase: "I've been working with TypeScript for a while." },
      { targetId: targetId('prosody.sentence-stress'), phrase: "What did you think of the keynote presentation?" },
    ],
    transferVariant: {
      context: 'Joining a virtual developer community voice chat during a hackathon.',
      opening: 'Hey everyone! What tech stack are you all building with this weekend?',
    },
    roleInstructions: `
You are a friendly developer attending a tech conference or local meetup.
Stay in character. Talk about programming languages, web frameworks, work experiences, and tech trends.
Keep the atmosphere casual, encouraging, and collaborative. Ask open-ended questions and react enthusiastically to the student's ideas.
`.trim(),
  },
  {
    id: 'roleplay.service.apartment_issue',
    mode: 'conversational',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'Calling or talking to a building manager or landlord about an urgent apartment repair.',
    communicativeGoal: 'Reportar un problema de mantenimiento (fuga de agua, calefacción) con detalles de urgencia y disponibilidad.',
    role: { model: 'building property manager', student: 'tenant' },
    opening: "Hello, property management office. How can I help you today?",
    maxTurns: 6,
    requiredIntents: [
      { id: 'stated_maintenance_issue', label: 'Describiste el problema concreto (ej. fuga de agua o calefacción).' },
      { id: 'explained_urgency', label: 'Explicaste desde cuándo ocurre y por qué es urgente.' },
      { id: 'coordinated_repair_time', label: 'Indicaste cuándo estás disponible para la visita del técnico.' },
    ],
    targets: [
      { targetId: contrastTargetId('/θ/', '/ð/'), phrase: 'There is water leaking under the sink.' },
      { targetId: SCHWA_TARGET, phrase: 'Could someone come by tomorrow morning?' },
    ],
    transferVariant: {
      context: 'Reporting a broken air conditioner to the front desk at a hotel during travel.',
      opening: 'Front desk, good evening. How may we assist you with your room?',
    },
    roleInstructions: `
You are a building property manager taking maintenance calls from tenants.
Stay in character. Ask for specific details about the issue (exact room, severity, when it started), explain what actions you will take, and agree on a time for the technician to visit.
Keep language natural and customer-service oriented. Gently correct any misunderstandings.
`.trim(),
  },
]

/**
 * Las misiones con guion viven en su propio catalogo pero comparten registry:
 * `getMission` es el unico punto de entrada, y el runner se elige por `mode`.
 */
const ALL_MISSIONS: readonly OralMission[] = [...MISSIONS, ...SCRIPTED_MISSIONS]

export const MISSION_REGISTRY: Readonly<Record<string, OralMission>> = Object.freeze(
  Object.fromEntries(ALL_MISSIONS.map((mission) => [mission.id, mission])) as Record<string, OralMission>,
)

const DYNAMIC_MISSIONS = new Map<string, OralMission>()

export function registerDynamicMission(mission: OralMission): void {
  DYNAMIC_MISSIONS.set(mission.id, mission)
}

export function listMissions(): readonly OralMission[] {
  return [...DYNAMIC_MISSIONS.values(), ...ALL_MISSIONS]
}

/**
 * Las dos clases de mision se practican de forma distinta y viven en
 * pestanas distintas: con guion se habla, conversacional se escribe.
 * El filtrado vive aqui y no en la UI para que exista una sola fuente.
 */
export function listScriptedMissions(): readonly ScriptedMission[] {
  const dynamic = Array.from(DYNAMIC_MISSIONS.values()).filter(isScriptedMission)
  return [...dynamic, ...ALL_MISSIONS.filter(isScriptedMission)]
}

export function listConversationalMissions(): readonly ConversationalMission[] {
  return ALL_MISSIONS.filter(isConversationalMission)
}

export function getMission(missionId: string): OralMission | null {
  return DYNAMIC_MISSIONS.get(missionId) ?? MISSION_REGISTRY[missionId] ?? null
}

export function missionIdFromLegacyMode(mode: string): string | null {
  if (!mode.startsWith('roleplay:')) return null
  const scenario = mode.slice('roleplay:'.length) as LegacyRoleplayScenario
  return LEGACY_ROLEPLAY_SCENARIOS.includes(scenario) ? `roleplay.${scenario}` : null
}

export function legacyModeForMission(missionId: string): string | null {
  if (!missionId.startsWith('roleplay.')) return null
  const scenario = missionId.slice('roleplay.'.length) as LegacyRoleplayScenario
  return LEGACY_ROLEPLAY_SCENARIOS.includes(scenario) ? `roleplay:${scenario}` : null
}

export function getMissionForLegacyMode(mode: string): OralMission | null {
  const missionId = missionIdFromLegacyMode(mode)
  return missionId ? getMission(missionId) : null
}

export function validateMissionRegistry(): MissionRegistryIssue[] {
  const issues: MissionRegistryIssue[] = []
  const seen = new Set<string>()
  const allowedCefr = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])

  for (const mission of ALL_MISSIONS) {
    if (seen.has(mission.id)) {
      issues.push({ missionId: mission.id, code: 'duplicate_id', detail: 'duplicate mission id' })
    }
    seen.add(mission.id)

    if (!allowedCefr.has(mission.recommendedCefr)) {
      issues.push({ missionId: mission.id, code: 'invalid_cefr', detail: `unsupported CEFR level ${mission.recommendedCefr}` })
    }

    if (isConversationalMission(mission)) {
      // Solo el roleplay exige targets: son los que guian su bucle de correccion.
      // El guion puntua por alineacion de fonemas, asi que ahi son opcionales.
      if (mission.targets.length < 2 || mission.targets.length > 3) {
        issues.push({ missionId: mission.id, code: 'invalid_target_count', detail: 'conversational missions must have 2–3 targets' })
      }
      if (!Number.isInteger(mission.maxTurns) || mission.maxTurns < 1) {
        issues.push({ missionId: mission.id, code: 'invalid_max_turns', detail: 'maxTurns must be a positive integer' })
      }

      const intentIds = new Set<string>()
      for (const intent of mission.requiredIntents) {
        if (!intent.id.trim() || !intent.label.trim()) {
          issues.push({ missionId: mission.id, code: 'invalid_intent', detail: 'intent ids and labels are required' })
        }
        if (intentIds.has(intent.id)) {
          issues.push({ missionId: mission.id, code: 'duplicate_intent', detail: `duplicate intent ${intent.id}` })
        }
        intentIds.add(intent.id)
      }
    }

    if (isScriptedMission(mission)) {
      if (mission.script.length === 0) {
        issues.push({ missionId: mission.id, code: 'invalid_script', detail: 'scripted missions require at least one line' })
      }
      if (!mission.script.some((line) => line.speaker === 'learner')) {
        issues.push({ missionId: mission.id, code: 'invalid_script', detail: 'scripted missions require a learner line' })
      }
      const lineIds = new Set<string>()
      for (const line of mission.script) {
        if (lineIds.has(line.id)) {
          issues.push({ missionId: mission.id, code: 'invalid_script', detail: `duplicate script line ${line.id}` })
        }
        lineIds.add(line.id)
        if (!line.text.trim()) {
          issues.push({ missionId: mission.id, code: 'invalid_script', detail: `empty script line ${line.id}` })
        }
      }
    }

    for (const target of mission.targets) {
      if (!getTarget(target.targetId).ok) {
        issues.push({ missionId: mission.id, code: 'invalid_target', detail: `unknown pronunciation target ${target.targetId}` })
      }
    }
  }

  return issues
}

