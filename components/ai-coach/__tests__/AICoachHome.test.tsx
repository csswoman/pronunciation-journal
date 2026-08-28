// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AICoachHome from '../AICoachHome'

const noop = () => undefined

function renderHome(activeTab: 'chat' | 'missions') {
  return render(
    <AICoachHome
      activeTab={activeTab}
      onSendMessage={noop}
      onSelectMission={noop}
      isStreaming={false}
    />,
  )
}

describe('AICoachHome', () => {
  it('la pestana de misiones solo ofrece misiones habladas', () => {
    renderHome('missions')
    // `scripted.cafe.order` es de guion; `roleplay.interview` es conversacional.
    expect(
      screen.getByText(/Pedir una bebida y responder a las preguntas del camarero/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Presentarte y explicar una experiencia profesional relevante/i),
    ).not.toBeInTheDocument()
  })

  it('la pestana de chat ofrece las misiones conversacionales', () => {
    renderHome('chat')
    expect(
      screen.getByText(/Presentarte y explicar una experiencia profesional relevante/i),
    ).toBeInTheDocument()
  })

  it('al elegir una conversacional desde chat se avisa con su id', async () => {
    const onSelectMission = vi.fn()
    render(
      <AICoachHome
        activeTab="chat"
        onSendMessage={noop}
        onSelectMission={onSelectMission}
        isStreaming={false}
      />,
    )
    const buttons = screen.getAllByRole('button', { name: /empezar/i })
    buttons[0]?.click()
    expect(onSelectMission).toHaveBeenCalledWith(expect.stringMatching(/^roleplay\./))
  })
})
