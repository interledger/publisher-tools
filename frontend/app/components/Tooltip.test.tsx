import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  it('renders default info button and shows tooltip on hover', async () => {
    const user = userEvent.setup()
    render(<Tooltip label="Info label">Tooltip content</Tooltip>)

    const button = screen.getByRole('button', { name: 'Info label' })
    expect(button).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.hover(button)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip content')

    await user.unhover(button)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders custom trigger when content prop is provided', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Tooltip explanation">
        <button type="button">Custom trigger</button>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: 'Custom trigger' })
    expect(trigger).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.hover(trigger)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip explanation')

    await user.unhover(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('closes tooltip when Escape key is pressed', async () => {
    const user = userEvent.setup()
    render(<Tooltip label="Help">Help text</Tooltip>)

    const button = screen.getByRole('button', { name: 'Help' })
    await user.hover(button)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
