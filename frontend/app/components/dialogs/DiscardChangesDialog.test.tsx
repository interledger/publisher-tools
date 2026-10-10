import { describe, expect, it, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DialogProvider } from './DialogProvider'
import { DiscardChangesDialog } from './DiscardChangesDialog'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
})

describe('DiscardChangesDialog', () => {
  it('renders confirmation message and buttons', () => {
    render(
      <DialogProvider>
        <DiscardChangesDialog onDiscard={vi.fn()} onCancel={vi.fn()} />
      </DialogProvider>,
    )

    expect(screen.getByText('Discard changes?')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Are you sure you want to discard your current changes\?/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Discard changes' }),
    ).toBeInTheDocument()
  })

  it('calls onCancel when Continue is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onDiscard = vi.fn()

    render(
      <DialogProvider>
        <DiscardChangesDialog onDiscard={onDiscard} onCancel={onCancel} />
      </DialogProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onDiscard).not.toHaveBeenCalled()
  })

  it('calls onDiscard when Discard changes is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onDiscard = vi.fn()

    render(
      <DialogProvider>
        <DiscardChangesDialog onDiscard={onDiscard} onCancel={onCancel} />
      </DialogProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(onDiscard).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })
})
