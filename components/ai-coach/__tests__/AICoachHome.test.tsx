// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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

  it('la pestana de chat muestra el estado inicial limpio para conversar', () => {
    renderHome('chat')
    expect(
      screen.queryByText(/Misiones de conversación/i),
    ).not.toBeInTheDocument()
  })
})
