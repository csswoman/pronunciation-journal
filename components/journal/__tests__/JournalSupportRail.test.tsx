// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { JournalSupportRail } from '@/components/journal/JournalSupportRail'

const nudgeMock = vi.hoisted(() => ({ requestJournalNudge: vi.fn() }))

vi.mock('@/lib/journal/nudge-client', () => nudgeMock)

describe('JournalSupportRail vocabulary resolution', { timeout: 15_000 }, () => {
  afterEach(() => {
    vi.useRealTimers()
    nudgeMock.requestJournalNudge.mockReset()
  })

  it('shows learner translation and example for owned seeds while keeping scaffold data for the rest', () => {
    render(
      <JournalSupportRail
        promptId="relaxing-place"
        resolvedVocabulary={[
          { text: 'cozy', translation: 'acogedor de mi casa', ipa: '/koʊzi/', example: 'My own cozy example.', inWordBank: true, srsStatus: 'learning' },
          { text: 'corner', translation: 'rincón', ipa: '/corner/', example: 'Generated corner.', inWordBank: false, srsStatus: null },
          { text: 'quiet', translation: 'silencioso', ipa: '/quiet/', example: 'Generated quiet.', inWordBank: false, srsStatus: null },
          { text: 'blanket', translation: 'manta', ipa: '/blanket/', example: 'Generated blanket.', inWordBank: false, srsStatus: null },
          { text: 'shelf', translation: 'estantería', ipa: '/ʃelf/', example: 'My shelf example.', inWordBank: true, srsStatus: 'review' },
          { text: 'calm down', translation: 'calmarse', ipa: '/calm/', example: 'Generated calm example.', inWordBank: false, srsStatus: null },
        ]}
        selectedGrammarNote={null}
        feedback={null}
      />,
    )

    expect(screen.getByText('2 de estas ya son tuyas — úsalas hoy.')).toBeInTheDocument()
    expect(screen.getByText(/acogedor de mi casa/)).toBeInTheDocument()
    expect(screen.getByText('My own cozy example.')).toBeInTheDocument()
    expect(screen.getByText(/rincón/)).toBeInTheDocument()
    expect(screen.queryByText('Generated corner.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /corner.*rincón/i }))
    expect(screen.getByText('Generated corner.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ocultar guía de apoyo/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Referencia' }))
    expect(screen.getByRole('tabpanel', { name: 'Referencia de escritura' })).toBeInTheDocument()
    expect(screen.getByText('Ejemplos por tiempo')).toBeInTheDocument()
  })

  it('emits starter selection through the rail callback', () => {
    const onStarterSelect = vi.fn()
    render(
      <JournalSupportRail
        promptId="relaxing-place"
        resolvedVocabulary={[]}
        selectedGrammarNote={null}
        feedback={null}
        onStarterSelect={onStarterSelect}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /The place where I feel calm is/ }))
    expect(onStarterSelect).toHaveBeenCalledWith('The place where I feel calm is...')
  })

  it('keeps scheduled topics factual and suggested words as an explicit action', () => {
    render(
      <JournalSupportRail
        promptId="relaxing-place"
        resolvedVocabulary={[]}
        selectedGrammarNote={null}
        feedback={{
          errors: [],
          newWords: ['unwind'],
          scheduledTopics: [
            { topicId: 'grammar:present simple', nextReviewAt: '2026-08-10T12:00:00.000Z', intervalDays: 8 },
          ],
        }}
      />,
    )

    expect(screen.getByText('Reglas programadas')).toBeInTheDocument()
    expect(screen.getByText('Presente simple')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unwind/i })).toBeInTheDocument()
    expect(screen.getByText(/No se añaden automáticamente/)).toBeInTheDocument()
  })

  it('marks seed words used in the draft and ties structure progress to the counter', () => {
    render(
      <JournalSupportRail
        promptId="relaxing-place"
        resolvedVocabulary={[
          { text: 'cozy', translation: 'acogedor', ipa: '/koʊzi/', example: 'A cozy room.', inWordBank: false, srsStatus: null },
          { text: 'shelf', translation: 'estante', ipa: '/ʃelf/', example: 'A shelf.', inWordBank: false, srsStatus: null },
        ]}
        selectedGrammarNote={null}
        feedback={null}
        content="My room is cozy."
        wordCount={25}
        targetLength={60}
        lastTypedAt={Date.now()}
      />,
    )

    expect(screen.getByRole('button', { name: /cozy.*acogedor.*usada en este texto/i })).toBeInTheDocument()
    expect(screen.getByText('25 / 60 palabras')).toBeInTheDocument()
  })

  it('hides structure while empty and shows only the current step while writing', () => {
    const { rerender } = render(
      <JournalSupportRail
        promptId="relaxing-place"
        resolvedVocabulary={[]}
        selectedGrammarNote={null}
        feedback={null}
      />,
    )
    expect(screen.queryByRole('heading', { name: 'Cómo organizarlo' })).not.toBeInTheDocument()

    rerender(
      <JournalSupportRail
        promptId="relaxing-place"
        resolvedVocabulary={[]}
        selectedGrammarNote={null}
        feedback={null}
        content="I went there."
        wordCount={3}
        targetLength={60}
        lastTypedAt={Date.now()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Cómo organizarlo' })).toBeInTheDocument()
    expect(document.querySelector('[data-structure-active="true"]')).toHaveTextContent(/Dónde es\./)
    expect(screen.getByText('Ver los tres pasos')).toBeInTheDocument()
    expect(screen.getByText('Ver los tres pasos').closest('details')).not.toBeNull()
  })

  it('highlights an unused starter after twenty seconds without typing', () => {
    vi.useFakeTimers()
    render(
      <JournalSupportRail
        promptId="relaxing-place"
        resolvedVocabulary={[]}
        selectedGrammarNote={null}
        feedback={null}
        content="I went there."
        wordCount={3}
        targetLength={60}
        lastTypedAt={Date.now()}
      />,
    )

    expect(screen.queryByText('Puedes seguir por aquí')).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(screen.getByText('Puedes seguir por aquí')).toBeInTheDocument()
  })

  it('keeps the on-demand nudge to three calls per entry', async () => {
    vi.useFakeTimers()
    nudgeMock.requestJournalNudge.mockResolvedValue({
      nudges: [
        { en: 'What do you do there?', es: '¿Qué haces allí?' },
        { en: 'Is it quiet or noisy?', es: '¿Es silencioso o ruidoso?' },
        { en: 'One detail I like is...', es: 'Un detalle que me gusta es...' },
      ],
    })
    render(
      <JournalSupportRail
        promptId="relaxing-place"
        promptText="Write about a place that helps you relax."
        resolvedVocabulary={[]}
        selectedGrammarNote={null}
        feedback={null}
        content="I went there."
        wordCount={3}
        targetLength={60}
        lastTypedAt={Date.now()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    for (let call = 0; call < 3; call += 1) {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: call === 0 ? 'Estoy atascada' : /Estoy atascada/ }))
        await Promise.resolve()
      })
    }

    expect(nudgeMock.requestJournalNudge).toHaveBeenCalledTimes(3)
    expect(screen.getByRole('button', { name: 'Ya tienes por dónde seguir' })).toBeDisabled()
    expect(screen.getByText('What do you do there?')).toBeInTheDocument()
  })

  it('keeps the local starter visible and explains recovery when a nudge fails', async () => {
    vi.useFakeTimers()
    nudgeMock.requestJournalNudge.mockRejectedValue(new Error('network unavailable'))
    render(
      <JournalSupportRail
        promptId="relaxing-place"
        promptText="Write about a place that helps you relax."
        resolvedVocabulary={[]}
        selectedGrammarNote={null}
        feedback={null}
        content="I went there."
        wordCount={3}
        targetLength={60}
        lastTypedAt={Date.now()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Estoy atascada' }))
      await Promise.resolve()
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No pudimos generar una idea. Prueba el inicio sugerido o vuelve a intentarlo.',
    )
    expect(screen.getByText('Puedes seguir por aquí')).toBeInTheDocument()
  })
})
