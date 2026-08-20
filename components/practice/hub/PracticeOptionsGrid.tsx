'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  MicVocal,
  ListOrdered,
  Layers,
  RotateCcw,
  BookOpen,
  Waves,
  Sparkles,
  Search,
  Clapperboard,
  GraduationCap,
  ArrowRight,
  MessageCircle,
  Mic,
  Volume2,
  CheckCircle2,
  Play,
  RefreshCw,
} from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import { useAICoachStore } from '@/lib/stores/aiCoachStore'
import { buildCoachPrefill } from '@/lib/ai-practice/coach-prefill'
import { speakText } from '@/lib/speech/synthesis'
import type { SessionArc } from '@/lib/practice/types'
import { cn } from '@/lib/cn'

interface PracticeOptionsGridProps {
  dueCount: number | null
  arc?: SessionArc
}

type SoundCategory = 'all' | 'vowels' | 'consonants'

interface QuickSoundQuiz {
  id: string
  category: 'vowels' | 'consonants'
  word: string
  phoneme: string
  meaning: string
  distractor: string
  distractorWord: string
  distractorPhoneme: string
  explanation: string
  mouthTip: string
}

const QUICK_SOUND_QUIZZES: QuickSoundQuiz[] = [
  {
    id: 'sheep-ship',
    category: 'vowels',
    word: 'sheep',
    phoneme: '/iː/',
    meaning: 'oveja',
    distractor: 'ship',
    distractorWord: 'ship (barco)',
    distractorPhoneme: '/ɪ/',
    explanation: '¡Exacto! /iː/ es una vocal larga y sonriente (sheep), mientras que /ɪ/ es corta y relajada (ship).',
    mouthTip: 'Sonríe ligeramente y tensa los lados de la lengua contra los molares superiores.',
  },
  {
    id: 'fool-full',
    category: 'vowels',
    word: 'fool',
    phoneme: '/uː/',
    meaning: 'tonto',
    distractor: 'full',
    distractorWord: 'full (lleno)',
    distractorPhoneme: '/ʊ/',
    explanation: '¡Muy bien! /uː/ requiere redondear y tensar bien los labios hacia adelante.',
    mouthTip: 'Redondea los labios fuertemente como si fueras a silbar.',
  },
  {
    id: 'cat-cut',
    category: 'vowels',
    word: 'cat',
    phoneme: '/æ/',
    meaning: 'gato',
    distractor: 'cut',
    distractorWord: 'cut (cortar)',
    distractorPhoneme: '/ʌ/',
    explanation: '¡Perfecto! /æ/ es una vocal abierta: la mandíbula baja más que en español.',
    mouthTip: 'Abre bien la mandíbula hacia abajo y aplana la lengua en la base de la boca.',
  },
  {
    id: 'think-sink',
    category: 'consonants',
    word: 'think',
    phoneme: '/θ/',
    meaning: 'pensar',
    distractor: 'sink',
    distractorWord: 'sink (hundir/lavabo)',
    distractorPhoneme: '/s/',
    explanation: '¡Muy bien! /θ/ se pronuncia colocando la punta de la lengua suavemente entre los dientes.',
    mouthTip: 'Asoma la punta de la lengua entre los incisivos y sopla suavemente sin tocar el paladar.',
  },
  {
    id: 'berry-very',
    category: 'consonants',
    word: 'berry',
    phoneme: '/b/',
    meaning: 'baya / fruto rojo',
    distractor: 'very',
    distractorWord: 'very (muy)',
    distractorPhoneme: '/v/',
    explanation: '¡Excelente! /b/ es bilabial (juntando ambos labios), mientras /v/ apoya los dientes en el labio inferior.',
    mouthTip: 'Junta ambos labios por completo para crear una pequeña oclusión antes de liberar el aire.',
  },
  {
    id: 'right-light',
    category: 'consonants',
    word: 'right',
    phoneme: '/r/',
    meaning: 'correcto / derecha',
    distractor: 'light',
    distractorWord: 'light (luz/ligero)',
    distractorPhoneme: '/l/',
    explanation: '¡Correcto! En inglés la /r/ nunca toca el paladar ni vibra.',
    mouthTip: 'Curva la punta de la lengua hacia atrás en el aire sin llegar a tocar el paladar.',
  },
]

export default function PracticeOptionsGrid({
  dueCount,
  arc,
}: PracticeOptionsGridProps) {
  const openCoach = useAICoachStore((s) => s.openCoach)
  const prefill = buildCoachPrefill(arc)

  // Interactive Micro-Practice State (Quick Sound Check)
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory>('all')
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const filteredQuizzes = QUICK_SOUND_QUIZZES.filter(
    (q) => selectedCategory === 'all' || q.category === selectedCategory,
  )
  const currentQuiz = filteredQuizzes[quizIndex % filteredQuizzes.length] || QUICK_SOUND_QUIZZES[0]

  const handlePlaySound = useCallback((word: string) => {
    setIsPlayingAudio(true)
    speakText(word, {
      rate: 0.82,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    })
  }, [])

  const handleSelectAnswer = useCallback((phoneme: string) => {
    setSelectedAnswer(phoneme)
  }, [])

  const handleNextQuiz = useCallback(() => {
    setSelectedAnswer(null)
    setQuizIndex((prev) => (prev + 1) % filteredQuizzes.length)
  }, [filteredQuizzes.length])

  // Keyboard Shortcuts (Alex / Power User)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs or textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        handlePlaySound(currentQuiz.word)
      } else if (e.key === '1' || e.key.toLowerCase() === 'a') {
        e.preventDefault()
        handleSelectAnswer(currentQuiz.phoneme)
      } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
        e.preventDefault()
        handleSelectAnswer(currentQuiz.distractorPhoneme)
      } else if (e.key === 'n' || e.key.toLowerCase() === 'o' || e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextQuiz()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentQuiz, handlePlaySound, handleSelectAnswer, handleNextQuiz])

  return (
    <div className="flex flex-col gap-6">
      {/* ─── TOP SECTION: 2-COLUMN BALANCED HERO BENTO ────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* COLUMNA IZQUIERDA: Laboratorio de Sonidos + Micro-práctica Ligera */}
        <div className="group/hero flex flex-col justify-between gap-5 rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/10 via-surface-raised to-surface-raised p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md lg:col-span-6">
          <div className="flex flex-col gap-3.5">
            {/* Header con Kicker y Categorías */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--hue-icon-bg)] text-primary transition-transform group-hover/hero:scale-105">
                  <MicVocal size={18} aria-hidden />
                </span>
                <span className="font-kicker text-fg-subtle">Pronunciación</span>
              </div>

              {/* Selector Temático (Vocales / Consonantes / Todas) */}
              <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-base/80 p-0.5 shadow-2xs backdrop-blur-xs">
                {(['all', 'vowels', 'consonants'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat)
                      setSelectedAnswer(null)
                      setQuizIndex(0)
                    }}
                    className={cn(
                      'focus-ring rounded-full px-2.5 py-0.5 text-tiny font-medium transition-all duration-150',
                      selectedCategory === cat
                        ? 'bg-primary text-on-primary shadow-xs font-semibold'
                        : 'text-fg-muted hover:text-fg hover:bg-surface-sunken',
                    )}
                  >
                    {cat === 'all' ? 'Todos' : cat === 'vowels' ? 'Vocales' : 'Consonantes'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Link
                href="/practice/sounds"
                onClick={() => void setLastPracticeMode('sounds')}
                className="focus-ring group/title flex items-center justify-between gap-2 rounded-sm"
              >
                <h2 className="text-h3 font-bold text-fg transition-colors group-hover/title:text-primary">
                  Laboratorio de sonidos
                </h2>
                <ArrowRight
                  size={18}
                  className="text-fg-subtle transition-transform duration-200 group-hover/title:translate-x-1 group-hover/title:text-primary"
                  aria-hidden
                />
              </Link>
              <p className="text-body-sm text-fg-muted text-pretty">
                Distingue sonidos parecidos (pares mínimos) y entrena tu oído con grabaciones acústicas reales.
              </p>
            </div>

            {/* WIDGET INTERACTIVO DE MICRO-PRÁCTICA: "Prueba rápida de oído" */}
            <div className="mt-1 flex flex-col gap-3 rounded-xl border border-border-default bg-surface-base p-4 shadow-xs transition-all">
              <div className="flex items-center justify-between text-caption">
                <span className="font-mono text-tiny font-semibold uppercase text-fg-subtle">
                  Micro-reto: ¿Cuál de los dos suena?
                </span>
                <button
                  type="button"
                  onClick={handleNextQuiz}
                  className="focus-ring inline-flex items-center gap-1 text-tiny text-fg-subtle transition-colors hover:text-primary active:scale-95"
                  title="Cambiar par fonético (Tecla N)"
                >
                  <RefreshCw size={12} className="transition-transform hover:rotate-180 duration-300" aria-hidden />
                  <span>Probar otro</span>
                  <kbd className="hidden sm:inline-block rounded bg-surface-sunken px-1 font-mono text-[10px] text-fg-subtle">N</kbd>
                </button>
              </div>

              {/* Botón de reproducción de audio grande con forma de onda animada */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePlaySound(currentQuiz.word)}
                  className={cn(
                    'focus-ring flex h-11 flex-1 items-center justify-center gap-2.5 rounded-xl border font-label font-medium transition-all duration-200 shadow-xs active:scale-[0.98]',
                    isPlayingAudio
                      ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/20'
                      : 'border-border-default bg-surface-raised text-fg hover:border-primary/50 hover:bg-surface-sunken hover:shadow-sm',
                  )}
                >
                  {isPlayingAudio ? (
                    <div className="flex items-center gap-0.5">
                      <span className="h-3 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-4 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-3 w-1 rounded-full bg-primary animate-bounce" />
                    </div>
                  ) : (
                    <Play size={18} className="fill-current text-primary transition-transform group-hover:scale-110" aria-hidden />
                  )}
                  <span>Escuchar pronunciación nativa</span>
                  <kbd className="hidden sm:inline-block rounded border border-border-subtle bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
                    Space
                  </kbd>
                </button>
              </div>

              {/* Opciones de respuesta interactiva con atajos de teclado */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAnswer(currentQuiz.phoneme)}
                  className={cn(
                    'focus-ring relative flex flex-col items-center justify-center rounded-lg border p-2.5 transition-all duration-150 text-center active:scale-95',
                    selectedAnswer === currentQuiz.phoneme
                      ? 'border-success bg-success-soft text-success shadow-xs ring-2 ring-success/30 scale-[1.02]'
                      : 'border-border-subtle bg-surface-sunken text-fg hover:border-border-default hover:bg-surface-raised hover:shadow-2xs',
                  )}
                >
                  <span className="font-ipa text-body-lg font-bold">{currentQuiz.phoneme}</span>
                  <span className="text-tiny text-fg-muted">{currentQuiz.word}</span>
                  <kbd className="absolute right-1.5 top-1.5 rounded border border-border-subtle bg-surface-base px-1 font-mono text-[9px] text-fg-subtle">
                    1
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAnswer(currentQuiz.distractorPhoneme)}
                  className={cn(
                    'focus-ring relative flex flex-col items-center justify-center rounded-lg border p-2.5 transition-all duration-150 text-center active:scale-95',
                    selectedAnswer === currentQuiz.distractorPhoneme
                      ? 'border-warning bg-warning-soft text-warning shadow-xs ring-2 ring-warning/30 scale-[1.02]'
                      : 'border-border-subtle bg-surface-sunken text-fg hover:border-border-default hover:bg-surface-raised hover:shadow-2xs',
                  )}
                >
                  <span className="font-ipa text-body-lg font-bold">{currentQuiz.distractorPhoneme}</span>
                  <span className="text-tiny text-fg-muted">{currentQuiz.distractor}</span>
                  <kbd className="absolute right-1.5 top-1.5 rounded border border-border-subtle bg-surface-base px-1 font-mono text-[9px] text-fg-subtle">
                    2
                  </kbd>
                </button>
              </div>

              {/* Feedback pedagógico instantáneo con micro-consejo biomecánico */}
              {selectedAnswer ? (
                <div
                  className={cn(
                    'flex flex-col gap-1 rounded-lg p-2.5 text-caption font-medium transition-all duration-300 animate-fadeIn',
                    selectedAnswer === currentQuiz.phoneme
                      ? 'bg-success-soft/80 text-success border border-success/30'
                      : 'bg-warning-soft/80 text-warning border border-warning/30',
                  )}
                >
                  {selectedAnswer === currentQuiz.phoneme ? (
                    <p>{currentQuiz.explanation}</p>
                  ) : (
                    <>
                      <p>
                        Casi. Sonó <strong>{currentQuiz.word}</strong> con fonema{' '}
                        <span className="font-ipa font-bold">{currentQuiz.phoneme}</span>.
                      </p>
                      <p className="text-tiny text-fg-muted font-normal">
                        💡 <strong>Tip articulatorio:</strong> {currentQuiz.mouthTip}
                      </p>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/practice/sounds"
              onClick={() => void setLastPracticeMode('sounds')}
              className="focus-ring group/btn inline-flex w-full items-center justify-center gap-2 rounded-xl bg-fg px-4 py-3 font-label font-semibold text-surface-base shadow-sm transition-all duration-200 hover:bg-fg/90 hover:shadow-md active:scale-[0.99]"
            >
              <span>Explorar todos los sonidos</span>
              <ArrowRight size={16} className="transition-transform duration-150 group-hover/btn:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>

        {/* COLUMNA DERECHA: Palabras Esenciales & Sistema de Repaso SRS */}
        <div className="group/srs flex flex-col justify-between gap-5 rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-border-default hover:shadow-md lg:col-span-6">
          <div className="flex flex-col gap-4">
            {/* Header con Kicker y Estado Live */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--hue-icon-bg)] text-primary transition-transform group-hover/srs:scale-105">
                  <ListOrdered size={18} aria-hidden />
                </span>
                <span className="font-kicker text-fg-subtle">Vocabulario</span>
              </div>
              {dueCount !== null && dueCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-2.5 py-0.5 text-caption font-semibold text-warning animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  <span>{dueCount} pendientes</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-caption font-medium text-success">
                  <CheckCircle2 size={13} aria-hidden />
                  Al día
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Link
                href="/practice/essential-words"
                onClick={() => void setLastPracticeMode('essential-words')}
                className="focus-ring group/title flex items-center justify-between gap-2 rounded-sm"
              >
                <h2 className="text-h3 font-bold text-fg transition-colors group-hover/title:text-primary">
                  Palabras esenciales
                </h2>
                <ArrowRight
                  size={18}
                  className="text-fg-subtle transition-transform duration-200 group-hover/title:translate-x-1 group-hover/title:text-primary"
                  aria-hidden
                />
              </Link>
              <p className="text-body-sm text-fg-muted text-pretty">
                Aprende y consolida las 1000 palabras de mayor frecuencia con un algoritmo de repetición espaciada.
              </p>
            </div>

            {/* Panel de Retención de Memoria (Llena el espacio armónicamente) */}
            <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-base p-4 shadow-xs">
              <div className="flex items-center justify-between text-caption text-fg-subtle">
                <span className="font-mono text-tiny font-semibold uppercase">Retención a largo plazo</span>
                <span className="font-medium text-fg">Nivel general A1 - B2</span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-body-sm font-semibold text-fg">
                  {dueCount !== null && dueCount > 0 ? 'Palabras listas para repasar' : 'Memoria al día'}
                </span>
                <span className="font-mono text-body-sm font-bold text-primary">
                  {dueCount !== null && dueCount > 0 ? `${dueCount} palabras` : '100%'}
                </span>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 ease-out',
                    dueCount && dueCount > 0 ? 'bg-warning w-3/5' : 'bg-success w-full',
                  )}
                />
              </div>

              {/* Botón de Repaso directo */}
              <Link
                href="/practice/review"
                onClick={() => void setLastPracticeMode('review')}
                className={cn(
                  'focus-ring mt-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 font-label font-semibold transition-all duration-200 shadow-xs active:scale-[0.98]',
                  dueCount && dueCount > 0
                    ? 'border border-warning/40 bg-warning text-surface-base hover:bg-warning/90 hover:shadow-sm'
                    : 'border border-border-default bg-surface-sunken text-fg hover:bg-surface-raised',
                )}
              >
                <RotateCcw size={16} aria-hidden />
                <span>Repaso</span>
                {dueCount && dueCount > 0 ? (
                  <span className="rounded-full bg-surface-base/20 px-2 py-0.5 font-mono text-tiny">
                    {dueCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/practice/essential-words"
              onClick={() => void setLastPracticeMode('essential-words')}
              className="focus-ring group/vocab inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border-default bg-surface-base px-4 py-3 font-label font-semibold text-fg transition-all duration-200 hover:bg-surface-sunken hover:shadow-xs active:scale-[0.99]"
            >
              <span>Ver las 1000 palabras</span>
              <ArrowRight size={16} className="text-primary transition-transform duration-150 group-hover/vocab:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── MIDDLE SECTION: INTERACTIVE PRACTICE MODES (2 COLUMNS) ─────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Inmersión & Speaking (Video con Nativos) */}
        <div className="group flex flex-col justify-between gap-4 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-sunken/40 hover:shadow-md">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-kicker text-fg-subtle">Contexto y lectura</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2.5 py-0.5 font-caption text-caption font-medium text-primary">
                <Clapperboard size={13} aria-hidden />
                Video & Audio
              </span>
            </div>

            <Link
              href="/practice/immersion"
              onClick={() => void setLastPracticeMode('immersion')}
              className="focus-ring group/title flex items-center gap-3 rounded-sm"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--hue-icon-bg)] text-primary transition-transform duration-200 group-hover/title:scale-105">
                <Clapperboard size={22} aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-h4 font-bold text-fg transition-colors group-hover/title:text-primary">
                  Inmersión & Speaking
                </h3>
                <span className="font-caption text-caption text-fg-subtle">Lecciones con nativos</span>
              </div>
            </Link>

            <p className="text-body-sm text-fg-muted text-pretty">
              Lecciones en video con profesores nativos, modo shadowing sincronizado y minería de frases reales.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/practice/immersion"
              onClick={() => void setLastPracticeMode('immersion')}
              className="focus-ring group/imm inline-flex w-full items-center justify-between rounded-xl border border-border-default bg-surface-base px-4 py-2.5 font-label font-semibold text-fg transition-all duration-200 hover:border-primary/40 hover:bg-surface-sunken active:scale-[0.99]"
            >
              <span>Ver lecciones en video</span>
              <ArrowRight size={16} className="text-primary transition-transform duration-150 group-hover/imm:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Coach de Conversación (Speaking con IA) */}
        <div
          data-testid="speak-with-coach"
          className="group/coach flex flex-col justify-between gap-4 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-kicker text-fg-subtle">Speaking en vivo</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2.5 py-0.5 font-caption text-caption font-medium text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Micrófono
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--hue-icon-bg)] text-primary transition-transform duration-200 group-hover/coach:scale-105">
                <Mic size={22} aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-h4 font-bold text-fg">Coach de conversación</h3>
                <span className="font-caption text-caption text-fg-subtle">Retroalimentación inmediata</span>
              </div>
            </div>

            <p className="text-body-sm text-fg-muted text-pretty">
              Habla en voz alta sobre tus temas de hoy y pon a prueba tu claridad, entonación y fluidez.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => openCoach({ tab: 'chat', prefill })}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-default bg-surface-base px-3 font-label font-semibold text-fg transition-all duration-150 hover:bg-surface-sunken hover:shadow-2xs active:scale-[0.98]"
            >
              <MessageCircle size={16} aria-hidden />
              Conversa
            </button>
            <button
              type="button"
              onClick={() => openCoach({ tab: 'missions', prefill })}
              title="Un reto corto con micrófono: el coach te da un objetivo y te escucha."
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-default bg-surface-base px-3 font-label font-semibold text-fg transition-all duration-150 hover:bg-surface-sunken hover:shadow-2xs active:scale-[0.98]"
            >
              <Mic size={16} aria-hidden />
              Misión oral
            </button>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM SECTION: INTEGRATED SPECIALIZED TOOLS (2x3 BALANCED GRID) ──── */}
      <section aria-labelledby="specialized-practice-heading" className="flex flex-col gap-3.5 pt-2">
        <div className="flex items-baseline justify-between px-1">
          <div className="flex flex-col gap-0.5">
            <span className="font-kicker text-fg-subtle">Herramientas y profundización</span>
            <h2 id="specialized-practice-heading" className="text-h3 font-bold text-fg">
              Más formas de practicar
            </h2>
          </div>
        </div>

        {/* 6 Tarjetas Balanceadas en Grid de 2 o 3 Columnas con transiciones lift */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Habla conectada */}
          <Link
            href="/practice/connected-speech"
            onClick={() => void setLastPracticeMode('connected-speech')}
            className="focus-ring group flex flex-col justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-sunken hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-sunken text-fg-muted transition-all duration-200 group-hover:bg-[var(--hue-icon-bg)] group-hover:text-primary group-hover:scale-105">
                <Sparkles size={20} aria-hidden />
              </span>
              <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-tiny font-medium text-fg-muted">
                Fluidez
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label font-bold text-fg transition-colors group-hover:text-primary">
                  Habla conectada
                </span>
                <ArrowRight
                  size={15}
                  className="text-fg-subtle transition-transform duration-150 group-hover:translate-x-1 group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <p className="font-caption text-fg-muted">
                Une palabras al hablar, reducciones y ritmo natural (linking).
              </p>
            </div>
          </Link>

          {/* Entonación */}
          <Link
            href="/practice/intonation"
            onClick={() => void setLastPracticeMode('intonation')}
            className="focus-ring group flex flex-col justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-sunken hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-sunken text-fg-muted transition-all duration-200 group-hover:bg-[var(--hue-icon-bg)] group-hover:text-primary group-hover:scale-105">
                <Waves size={20} aria-hidden />
              </span>
              <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-tiny font-medium text-fg-muted">
                Prosodia
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label font-bold text-fg transition-colors group-hover:text-primary">
                  Entonación
                </span>
                <ArrowRight
                  size={15}
                  className="text-fg-subtle transition-transform duration-150 group-hover:translate-x-1 group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <p className="font-caption text-fg-muted">
                Curvas de tono en preguntas, énfasis y oraciones reales.
              </p>
            </div>
          </Link>

          {/* Lectura en contexto (Reader) */}
          <Link
            href="/practice/reader"
            onClick={() => void setLastPracticeMode('reader')}
            className="focus-ring group flex flex-col justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-sunken hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-sunken text-fg-muted transition-all duration-200 group-hover:bg-[var(--hue-icon-bg)] group-hover:text-primary group-hover:scale-105">
                <BookOpen size={20} aria-hidden />
              </span>
              <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-tiny font-medium text-fg-muted">
                Lectura
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label font-bold text-fg transition-colors group-hover:text-primary">
                  Lectura en contexto
                </span>
                <ArrowRight
                  size={15}
                  className="text-fg-subtle transition-transform duration-150 group-hover:translate-x-1 group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <p className="font-caption text-fg-muted">
                Lecturas graduadas con audio y traducción instantánea.
              </p>
            </div>
          </Link>

          {/* Tus mazos */}
          <Link
            href="/practice/decks"
            onClick={() => void setLastPracticeMode('decks')}
            className="focus-ring group flex flex-col justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-sunken hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-sunken text-fg-muted transition-all duration-200 group-hover:bg-[var(--hue-icon-bg)] group-hover:text-primary group-hover:scale-105">
                <Layers size={20} aria-hidden />
              </span>
              <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-tiny font-medium text-fg-muted">
                Personal
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label font-bold text-fg transition-colors group-hover:text-primary">
                  Tus mazos
                </span>
                <ArrowRight
                  size={15}
                  className="text-fg-subtle transition-transform duration-150 group-hover:translate-x-1 group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <p className="font-caption text-fg-muted">
                Vocabulario personalizado guardado durante tus sesiones.
              </p>
            </div>
          </Link>

          {/* Ruta guiada */}
          <Link
            href="/courses"
            onClick={() => void setLastPracticeMode('courses')}
            className="focus-ring group flex flex-col justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-sunken hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-sunken text-fg-muted transition-all duration-200 group-hover:bg-[var(--hue-icon-bg)] group-hover:text-primary group-hover:scale-105">
                <GraduationCap size={20} aria-hidden />
              </span>
              <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-tiny font-medium text-fg-muted">
                Cursos
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label font-bold text-fg transition-colors group-hover:text-primary">
                  Ruta guiada
                </span>
                <ArrowRight
                  size={15}
                  className="text-fg-subtle transition-transform duration-150 group-hover:translate-x-1 group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <p className="font-caption text-fg-muted">
                Cursos paso a paso estructurados por tu nivel CEFR.
              </p>
            </div>
          </Link>

          {/* Buscar una palabra */}
          <Link
            href="/practice/word-search"
            onClick={() => void setLastPracticeMode('word-search')}
            className="focus-ring group flex flex-col justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-sunken hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-sunken text-fg-muted transition-all duration-200 group-hover:bg-[var(--hue-icon-bg)] group-hover:text-primary group-hover:scale-105">
                <Search size={20} aria-hidden />
              </span>
              <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-tiny font-medium text-fg-muted">
                Diccionario
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label font-bold text-fg transition-colors group-hover:text-primary">
                  Buscar una palabra
                </span>
                <ArrowRight
                  size={15}
                  className="text-fg-subtle transition-transform duration-150 group-hover:translate-x-1 group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <p className="font-caption text-fg-muted">
                Búsqueda rápida, fonética y pistas de uso contextual.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}


