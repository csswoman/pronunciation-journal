import {
  Crosshair,
  Ear,
  Heart,
  Keyboard,
  Zap,
  Snail,
  Lightbulb,
  BookOpen,
  Puzzle,
  Ghost,
  Volume2,
  ShieldAlert,
  ArrowLeft,
  Timer,
  RotateCcw,
  BrainCircuit,
  Layers,
} from '@/components/icons'
import type { GameIntroCopy } from './types'

export const PHONEME_INVADERS_INTRO: GameIntroCopy = {
  kicker: 'Discriminación auditiva',
  title: 'Phoneme Invaders',
  description:
    'Escucha una palabra y derriba la nave que la lleva antes de que toque el suelo. Las dos naves suenan casi igual: la diferencia está en un solo sonido.',
  rules: [
    { icon: Crosshair, text: 'Toca la nave o pulsa 1–4 según su carril.' },
    { icon: Volume2, text: 'Pulsa R o «Repetir» para volver a escuchar.' },
    { icon: Heart, text: 'Tienes 3 escudos. Cada fallo o nave que aterriza resta uno.' },
    { icon: Zap, text: 'Cada 10 aciertos sube la velocidad y aparecen más carriles.' },
  ],
  startLabel: 'Empezar partida',
  duration: '3 min',
  tone: 'sky',
  icon: Crosshair,
}

export const WEAK_FORM_INTRO: GameIntroCopy = {
  kicker: 'Comprensión de habla rápida',
  title: 'Weak Form Catcher',
  description:
    'Oirás frases a velocidad nativa. Cae la versión reducida («whaddya want») y tú escribes la forma completa en inglés antes de que llegue al suelo.',
  rules: [
    { icon: Keyboard, text: 'Escribe la frase completa: «what do you want».' },
    { icon: Snail, text: 'Tienes 2 ayudas por partida: audio lento o primera palabra.' },
    { icon: Heart, text: 'La partida termina tras 3 frases falladas.' },
    { icon: BookOpen, text: 'Después de cada frase verás la regla del cambio de sonido.' },
  ],
  startLabel: 'Empezar entrenamiento',
  duration: '4 min',
  tone: 'mint',
  icon: Ear,
}

export const CHUNK_DUEL_INTRO: GameIntroCopy = {
  kicker: 'Bloques y colocaciones',
  title: 'Chunk Duel',
  description:
    'Arma expresiones frecuentes en inglés tocando sus piezas en orden, antes de que el rival fantasma llene su barra.',
  rules: [
    { icon: Puzzle, text: '10 rondas por partida. Toca las piezas en el orden correcto.' },
    { icon: Ghost, text: 'Una pieza equivocada no resta puntos, pero el fantasma sigue avanzando.' },
    { icon: Volume2, text: 'Al completar la ronda escucharás el bloque en voz nativa.' },
  ],
  startLabel: 'Empezar duelo',
  duration: '3 min',
  tone: 'butter',
  icon: Puzzle,
}

export const FALSE_FRIENDS_INTRO: GameIntroCopy = {
  kicker: 'Falsos amigos',
  title: '¿Trampa? Falsos Amigos',
  description:
    'Verás una palabra en inglés con una traducción. Decide rápido si es verdad o si es la trampa de un falso amigo.',
  rules: [
    { icon: ArrowLeft, text: 'Usa los botones o las flechas: ← Trampa, → Verdad.' },
    { icon: Timer, text: 'Tienes 5 segundos por palabra.' },
    { icon: RotateCcw, text: 'Las que falles vuelven al final en una ronda de rescate con contexto.' },
  ],
  startLabel: 'Empezar desafío',
  duration: '3 min',
  tone: 'lilac',
  icon: ShieldAlert,
}

export const MEMORY_MATCH_INTRO: GameIntroCopy = {
  kicker: 'Memoria y asociación',
  title: 'Memory Match',
  description:
    'Gira las cartas de dos en dos y encuentra las parejas. Elige qué quieres asociar: significado, audio o pronunciación IPA.',
  rules: [
    { icon: Layers, text: 'Cada intento gira dos cartas. Menos intentos, más estrellas.' },
    { icon: BrainCircuit, text: 'Cada partida mezcla palabras distintas del vocabulario esencial.' },
    { icon: Lightbulb, text: 'Las cartas de audio suenan al girarlas: escucha bien antes de buscar su pareja.' },
  ],
  startLabel: 'Empezar partida',
  duration: '2–4 min',
  tone: 'coral',
  icon: BrainCircuit,
}
