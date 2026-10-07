import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputField } from './InputField'

describe('InputField', () => {
  it('associates the label with the input', () => {
    render(<InputField label="Title" />)

    expect(screen.getByRole('textbox', { name: 'Title' })).toBeInTheDocument()
  })

  it('describes the input with the aria description', () => {
    render(<InputField label="Title" ariaDescription="Keep it short." />)

    expect(
      screen.getByRole('textbox', { name: 'Title' }),
    ).toHaveAccessibleDescription('Keep it short.')
  })

  it('describes the input with the help text', () => {
    render(<InputField label="Title" helpText="Shown above the message." />)

    expect(
      screen.getByRole('textbox', { name: 'Title' }),
    ).toHaveAccessibleDescription('Shown above the message.')
  })

  it('describes the input with both the aria description and the help text', () => {
    render(
      <InputField
        label="Title"
        ariaDescription="Keep it short."
        helpText="Shown above the message."
      />,
    )

    expect(
      screen.getByRole('textbox', { name: 'Title' }),
    ).toHaveAccessibleDescription('Keep it short. Shown above the message.')
  })

  it('describes the input with the error instead of the help text', () => {
    render(
      <InputField
        label="Title"
        helpText="Shown above the message."
        error="Title is required."
      />,
    )

    expect(
      screen.getByRole('textbox', { name: 'Title' }),
    ).toHaveAccessibleDescription('Title is required.')
  })

  it('links each input to its own error', () => {
    render(
      <>
        <InputField label="Title" error="Title is required." />
        <InputField label="Message" error="Message is required." />
      </>,
    )

    expect(
      screen.getByRole('textbox', { name: 'Title' }),
    ).toHaveAccessibleDescription('Title is required.')
    expect(
      screen.getByRole('textbox', { name: 'Message' }),
    ).toHaveAccessibleDescription('Message is required.')
  })

  it('marks the input as invalid and describes it with the error', () => {
    render(<InputField label="Title" error="Title is required." />)

    const input = screen.getByRole('textbox', { name: 'Title' })
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('Title is required.')
  })

  it('trims surrounding whitespace on blur', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<InputField label="Title" onChange={onChange} />)

    const input = screen.getByRole('textbox', { name: 'Title' })
    await user.type(input, '  hello  ')
    await user.tab()

    expect(input).toHaveValue('hello')
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ target: input }),
    )
  })
})
