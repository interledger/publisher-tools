import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ShareInput } from './ShareInput'

const validation = vi.hoisted(() => ({
  isValidating: false,
  isValid: false,
  error: '',
}))
vi.mock('~/hooks/useDebounceValidation', () => ({
  useDebounceValidation: () => ({ ...validation }),
}))

function renderShareInput(
  index: number,
  onValidationChange: (index: number, isValid: boolean) => void,
) {
  return (
    <ShareInput
      index={index}
      name="Alice"
      pointer="https://wallet.test/alice"
      percentage={50}
      onChangeName={vi.fn()}
      onChangePointer={vi.fn()}
      onChangePercentage={vi.fn()}
      onValidationChange={onValidationChange}
      onRemove={vi.fn()}
    />
  )
}

describe('ShareInput', () => {
  it('reports its validity only when it changes, with its current index', () => {
    validation.isValid = false
    const onValidationChange = vi.fn()

    const { rerender } = render(renderShareInput(3, onValidationChange))
    expect(onValidationChange).toHaveBeenCalledTimes(1)
    expect(onValidationChange).toHaveBeenLastCalledWith(3, false)

    // a row above was removed: the validity moves with the share, so the
    // shifted row has nothing new to report
    rerender(renderShareInput(2, onValidationChange))
    expect(onValidationChange).toHaveBeenCalledTimes(1)

    validation.isValid = true
    rerender(renderShareInput(2, onValidationChange))
    expect(onValidationChange).toHaveBeenCalledTimes(2)
    expect(onValidationChange).toHaveBeenLastCalledWith(2, true)
  })
})
