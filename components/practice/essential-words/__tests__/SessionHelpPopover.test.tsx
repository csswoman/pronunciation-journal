// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SessionHelpPopover } from '../SessionHelpPopover'

describe('SessionHelpPopover', () => {
  it('moves focus into the dialog and restores it to the trigger on close', async () => {
    const user = userEvent.setup()
    render(<SessionHelpPopover stats={{ totalWords: 2800, learned: 12, dueCount: 3, dueTomorrow: 0, newToday: 2, newQuota: 10, vaulted: 0 }} />)

    const trigger = screen.getByRole('button', { name: 'Cómo funciona esta práctica' })
    await user.click(trigger)

    const closeButton = await screen.findByRole('button', { name: 'Cerrar' })
    expect(closeButton).toHaveFocus()

    await user.click(closeButton)
    expect(trigger).toHaveFocus()
  })
})
