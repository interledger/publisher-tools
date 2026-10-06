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
