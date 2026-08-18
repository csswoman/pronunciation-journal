import { contrastTargetId, getTarget, phonemeTargetId, targetId } from '@/lib/pronunciation/targets/registry'
import type { MissionRegistryIssue, OralMission, LegacyRoleplayScenario } from './types'

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
]

export const MISSION_REGISTRY: Readonly<Record<string, OralMission>> = Object.freeze(
  Object.fromEntries(MISSIONS.map((mission) => [mission.id, mission])) as Record<string, OralMission>,
)

export function listMissions(): readonly OralMission[] {
  return MISSIONS
}

export function getMission(missionId: string): OralMission | null {
  return MISSION_REGISTRY[missionId] ?? null
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

  for (const mission of MISSIONS) {
    if (seen.has(mission.id)) {
      issues.push({ missionId: mission.id, code: 'duplicate_id', detail: 'duplicate mission id' })
    }
    seen.add(mission.id)

    if (mission.targets.length < 2 || mission.targets.length > 3) {
      issues.push({ missionId: mission.id, code: 'invalid_target_count', detail: 'missions must have 2–3 targets' })
    }
    if (!allowedCefr.has(mission.recommendedCefr)) {
      issues.push({ missionId: mission.id, code: 'invalid_cefr', detail: `unsupported CEFR level ${mission.recommendedCefr}` })
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

    for (const target of mission.targets) {
      if (!getTarget(target.targetId).ok) {
        issues.push({ missionId: mission.id, code: 'invalid_target', detail: `unknown pronunciation target ${target.targetId}` })
      }
    }
  }

  return issues
}
