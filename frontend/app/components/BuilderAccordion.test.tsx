import { describe, expect, it, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BuilderAccordion } from './BuilderAccordion'
import { DialogProvider } from './dialogs/DialogProvider'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
})

describe('BuilderAccordion', () => {
  it('does not render reset button when closed', () => {
    render(
      <DialogProvider>
        <BuilderAccordion title="Content" isOpen={false} onRefresh={vi.fn()}>
          <div>Child content</div>
        </BuilderAccordion>
      </DialogProvider>,
    )

    expect(
      screen.queryByRole('button', {
        name: /Reset content to saved settings/i,
      }),
    ).not.toBeInTheDocument()
  })

  it('renders disabled reset button when open with no changes', () => {
    render(
      <DialogProvider>
        <BuilderAccordion
          title="Content"
          isOpen={true}
          hasChanges={false}
          onRefresh={vi.fn()}
        >
          <div>Child content</div>
        </BuilderAccordion>
      </DialogProvider>,
    )

    const button = screen.getByRole('button', {
      name: /Reset content to saved settings/i,
    })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('renders enabled reset button when open with changes and shows tooltip on hover', async () => {
    const user = userEvent.setup()
    render(
      <DialogProvider>
        <BuilderAccordion
          title="Content"
          isOpen={true}
          hasChanges={true}
          onRefresh={vi.fn()}
        >
          <div>Child content</div>
        </BuilderAccordion>
      </DialogProvider>,
    )

    const button = screen.getByRole('button', {
      name: /Reset content to saved settings/i,
    })
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()

    await user.hover(button)
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Discard all current changes made to this section and revert to saved settings.',
    )
  })

  it('opens confirmation dialog on reset click and handles continue vs discard', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()

    render(
      <DialogProvider>
        <BuilderAccordion
          title="Content"
          isOpen={true}
          hasChanges={true}
          onRefresh={onRefresh}
        >
          <div>Child content</div>
        </BuilderAccordion>
      </DialogProvider>,
    )

    const resetButton = screen.getByRole('button', {
      name: /Reset content to saved settings/i,
    })

    await user.click(resetButton)
    expect(screen.getByText('Discard changes?')).toBeInTheDocument()

    const keepChangesButton = screen.getByRole('button', {
      name: 'Keep changes',
    })
    await user.click(keepChangesButton)
    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument()
    expect(onRefresh).not.toHaveBeenCalled()

    await user.click(resetButton)
    expect(screen.getByText('Discard changes?')).toBeInTheDocument()

    const discardButton = screen.getByRole('button', {
      name: 'Discard changes',
    })
    await user.click(discardButton)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('renders edited icon when closed with changes', () => {
    render(
      <DialogProvider>
        <BuilderAccordion
          title="Content"
          isOpen={false}
          hasChanges={true}
          onRefresh={vi.fn()}
        >
          <div>Child content</div>
        </BuilderAccordion>
      </DialogProvider>,
    )

    expect(screen.getByText('Edited')).toBeInTheDocument()
  })

  it('does not render edited icon when closed with no changes', () => {
    render(
      <DialogProvider>
        <BuilderAccordion
          title="Content"
          isOpen={false}
          hasChanges={false}
          onRefresh={vi.fn()}
        >
          <div>Child content</div>
        </BuilderAccordion>
      </DialogProvider>,
    )

    expect(screen.queryByText('Edited')).not.toBeInTheDocument()
  })

  it('does not render edited icon when open even with changes', () => {
    render(
      <DialogProvider>
        <BuilderAccordion
          title="Content"
          isOpen={true}
          hasChanges={true}
          onRefresh={vi.fn()}
        >
          <div>Child content</div>
        </BuilderAccordion>
      </DialogProvider>,
    )

    expect(screen.queryByText('Edited')).not.toBeInTheDocument()
  })
})
