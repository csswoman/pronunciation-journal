// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PhraseCard from '../PhraseCard'

describe('PhraseCard', () => {
  it('plays the selected word at a slower model speed', () => {
    const onListenWord = vi.fn()

    render(
      <PhraseCard
        phrase="The weather"
        wordIPAs={[]}
        ipaLoading={false}
        analyzing={false}
        hasAnalysis={false}
        hasMistakes={false}
        onListen={vi.fn()}
        onSlow={vi.fn()}
        onListenWord={onListenWord}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Escuchar weather' }))

    expect(onListenWord).toHaveBeenCalledWith('weather')
  })
})
