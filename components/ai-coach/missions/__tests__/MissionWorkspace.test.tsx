// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { speakPhrase, scorePronunciation } = vi.hoisted(() => ({
  speakPhrase: vi.fn(),
  scorePronunciation: vi.fn(async () => ({ accuracy: 75 })),
}))

vi.mock('../MissionRunner', () => ({
  default: ({ state, onListen, onSlow }: {
    state: { intentsObserved: Set<string>; phase: string }
    onListen: () => void
    onSlow: () => void
  }) => (
    <>
      <output data-testid="mission-phase">{state.phase}</output>
      <output>{state.intentsObserved.size}</output>
      <button type="button" onClick={onListen}>Escuchar</button>
      <button type="button" onClick={onSlow}>Más lento</button>
    </>
  ),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'learner-1' } }),
}))

vi.mock('@/lib/ai-coach/pronunciation', () => ({ speakPhrase }))
vi.mock('@/lib/pronunciation/scoring', () => ({ scorePronunciation }))
vi.mock('../../ChatView', () => ({ default: () => <output data-testid="chat-view" /> }))
vi.mock('../scripted/ScriptedMissionRunner', () => ({
  default: ({ mission }: { mission: { id: string } }) => (
    <output data-testid="scripted-runner">{mission.id}</output>
  ),
}))
vi.mock('../../CustomPromptPanel', () => ({
  default: ({ onSubmit }: { onSubmit: (text: string, options?: { voice?: { transcript: true; scored: boolean } }) => void }) => (
    <>
      <button type="button" onClick={() => onSubmit('A typed response')}>Enviar texto</button>
      <button type="button" onClick={() => onSubmit('A spoken response', { voice: { transcript: true, scored: true } })}>Enviar voz</button>
    </>
  ),
}))

import { MissionWorkspace } from '../MissionWorkspace'

const props = {
  messages: [],
  isStreaming: false,
  isDisabled: false,
  onSendMessage: vi.fn(async () => undefined),
  onSaveWord: vi.fn(),
  onToolAnswer: vi.fn(),
}

describe('MissionWorkspace', () => {
  it('routes observed model intents into its mission reducer state', () => {
    let observedIntent: ((intentId: string) => void) | null = null
    const setMissionIntentHandler = vi.fn((handler: ((intentId: string) => void) | null) => {
      observedIntent = handler
    })

    render(<MissionWorkspace missionId="roleplay.cafe" setMissionIntentHandler={setMissionIntentHandler} {...props} />)

    act(() => observedIntent?.('placed_order'))

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('plays the correction phrase at normal and slow rates', () => {
    render(<MissionWorkspace missionId="roleplay.cafe" setMissionIntentHandler={vi.fn()} {...props} />)

    fireEvent.click(screen.getByRole('button', { name: 'Escuchar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Más lento' }))

    expect(speakPhrase).toHaveBeenNthCalledWith(1, "I'd like a medium latte, please.")
    expect(speakPhrase).toHaveBeenNthCalledWith(2, "I'd like a medium latte, please.", 0.55)
  })

  it('keeps a typed mission response distinct from spoken evidence', () => {
    render(<MissionWorkspace missionId="roleplay.cafe" setMissionIntentHandler={vi.fn()} {...props} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enviar texto' }))

    expect(screen.getByTestId('mission-phase')).toHaveTextContent('active')
    expect(props.onSendMessage).toHaveBeenCalledWith('A typed response', undefined)
  })

  it('scores spoken mission responses before they can open a correction', async () => {
    render(<MissionWorkspace missionId="roleplay.cafe" setMissionIntentHandler={vi.fn()} {...props} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enviar voz' }))
    await waitFor(() => expect(screen.getByTestId('mission-phase')).toHaveTextContent('active'))

    fireEvent.click(screen.getByRole('button', { name: 'Enviar voz' }))
    await waitFor(() => expect(screen.getByTestId('mission-phase')).toHaveTextContent('correction'))

    expect(scorePronunciation).toHaveBeenCalledTimes(2)
  })
})

describe('MissionWorkspace — despacho por modo', () => {
  it('monta el runner con guion para una mision scripted', async () => {
    render(<MissionWorkspace missionId="scripted.cafe.order" setMissionIntentHandler={vi.fn()} {...props} />)

    await waitFor(() =>
      expect(screen.getByTestId('scripted-runner')).toHaveTextContent('scripted.cafe.order'))
  })

  it('no ofrece entrada de texto en una mision con guion', async () => {
    render(<MissionWorkspace missionId="scripted.cafe.order" setMissionIntentHandler={vi.fn()} {...props} />)

    await waitFor(() => expect(screen.getByTestId('scripted-runner')).toBeInTheDocument())
    // El bug original: el guion caia al chat libre y lo escrito se enviaba como turno.
    expect(screen.queryByRole('button', { name: 'Enviar texto' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('chat-view')).not.toBeInTheDocument()
  })

  it('mantiene intacto el camino conversacional', () => {
    render(<MissionWorkspace missionId="roleplay.cafe" setMissionIntentHandler={vi.fn()} {...props} />)

    expect(screen.queryByTestId('scripted-runner')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar texto' })).toBeInTheDocument()
  })
})
