// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'

import { render, screen, fireEvent } from '@testing-library/react'
import ScriptedMissionRunner from '../ScriptedMissionRunner'
import type { ScriptedMission } from '@/lib/ai-practice/missions/types'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))
vi.mock('@/hooks/useSpeechRecognition', () => ({

  useSpeechRecognition: () => ({
    status: 'idle', result: null, userAudioUrl: null, errorCode: null,
    isSupported: true, start: vi.fn(), stop: vi.fn(), reset: vi.fn(),
  }),
}))

const mission: ScriptedMission = {
  id: 'm1', mode: 'scripted', origin: 'authored',
  category: 'service', recommendedCefr: 'A2',
  context: 'Cafetería', communicativeGoal: 'Pedir café', targets: [],
  script: [
    { id: 'l1', speaker: 'coach', text: 'What can I get you?' },
    { id: 'l2', speaker: 'learner', text: 'A coffee, please.' },
  ],
}

describe('ScriptedMissionRunner', () => {
  it('empieza por la línea del coach', () => {
    render(<ScriptedMissionRunner mission={mission} onExit={vi.fn()} />)
    expect(screen.getByText('What can I get you?')).toBeInTheDocument()
  })

  it('avanza al turno del estudiante', () => {
    render(<ScriptedMissionRunner mission={mission} onExit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByText('A coffee, please.')).toBeInTheDocument()
  })
})
