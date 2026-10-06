import React, { useEffect, useRef, useState } from 'react'
import { cx } from 'class-variance-authority'
import { SVGCheckIcon, SVGDeleteScript, SVGSpinner } from '@/assets'
import { InputField, ToolsSecondaryButton } from '@/components'
import { BodyStandard } from '@/typography'
import { getPercentageStepBase } from '~/lib/revshare'
import { useDebounceValidation } from '../../hooks/useDebounceValidation'

interface ShareInputProps {
  index: number
  name: string
  pointer: string
  percentage: number
  percentageDisabled?: boolean
  percentageError?: string
  showDelete?: boolean
  onChangeName: (name: string) => void
  onChangePointer: (pointer: string) => void
  onChangePercentage: (percentage: number) => void
  onValidationChange: (index: number, isValid: boolean) => void
  onRemove: () => void
}

const DEFAULT_WALLET_ADDRESS = 'https://walletprovider.com/myWallet'
const GRID_COLS =
  'md:grid-cols-[1fr_3fr_1fr_minmax(0,auto)] lg:grid-cols-[12rem_1fr_8rem_minmax(0,auto)]'
const GRID_GAP = 'md:gap-x-md'

export const ShareInputTable = ({ children }: React.PropsWithChildren) => {
  return (
    <div
      role="table"
      aria-labelledby="revshare-table-caption"
      className="contents"
    >
      <div id="revshare-table-caption" role="caption" className="sr-only">
        Revenue sharing recipients
      </div>
      {children}
    </div>
  )
}

export const ShareInputHeader = ({ showDelete }: { showDelete: boolean }) => {
  return (
    <div role="rowgroup">
      <div
        role="row"
        aria-rowindex={1}
        className={cx(
          'hidden p-md leading-sm text-silver-600 rounded-lg bg-silver-50',
          'md:grid',
          GRID_COLS,
          GRID_GAP,
        )}
      >
        <div
          role="columnheader"
          id="col-recipient-name"
          aria-label="Recipient name, optional field"
        >
          Name
        </div>
        <div
          role="columnheader"
          id="col-payment-pointer"
          aria-label="Wallet address for recipient, required field"
        >
          Wallet address
        </div>
        <div
          role="columnheader"
          id="col-percentage"
          aria-label="Percentage of revenue for recipient, required field"
        >
          Percentage
        </div>
        {showDelete && (
          <div
            role="columnheader"
            id="col-remove"
            aria-label="Remove recipient from table"
          >
            Remove
          </div>
        )}
      </div>
    </div>
  )
}

export const ShareInput = React.memo(
  ({
    index,
    name,
    pointer,
    percentage,
    onChangeName,
    onChangePointer,
    onChangePercentage,
    onValidationChange,
    onRemove,
    showDelete = false,
    percentageDisabled = false,
    percentageError,
  }: ShareInputProps) => {
    const { isValidating, isValid, error } = useDebounceValidation(pointer, 500)
    const [showSuccess, setShowSuccess] = useState(false)
    // Keep the typed text so clearing doesn't add a 0 in the field.
    // New rows start empty rather than showing a 0 to delete first.
    const [percentageText, setPercentageText] = useState(
      percentage ? String(percentage) : '',
    )

    useEffect(() => {
      if (Number(percentageText) !== percentage) {
        setPercentageText(String(percentage))
      }
    }, [percentage])

    // Let the browser's validity (and so the `invalid:` styles) include the
    // rules it cannot check itself, such as the total being 100%.
    const percentageInputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
      percentageInputRef.current?.setCustomValidity(percentageError ?? '')
    }, [percentageError])

    useEffect(() => {
      onValidationChange(index, isValid)
    }, [isValid])

    useEffect(() => {
      let timerId: NodeJS.Timeout | undefined
      if (isValid === true) {
        setShowSuccess(true)
        timerId = setTimeout(() => {
          setShowSuccess(false)
        }, 1500)
      } else {
        setShowSuccess(false)
      }
      return () => {
        clearTimeout(timerId)
      }
    }, [isValid])

    const hasError = !!error
    const showValidationSpinner = isValidating
    const showIcon = showValidationSpinner || showSuccess

    const nameInputId = `name-input-${index}`
    const pointerInputId = `pointer-input-${index}`
    const percentageInputId = `percentage-input-${index}`

    return (
      <div
        role="row"
        aria-rowindex={index + 2}
        aria-invalid={hasError}
        className={cx(
          'bg-white flex flex-col gap-md p-md rounded-sm border border-silver-200',
          'md:rounded-none md:border-none md:grid md:px-md md:py-0 md:items-center',
          GRID_COLS,
          GRID_GAP,
        )}
      >
        <div className="flex flex-row justify-between items-center md:hidden">
          <BodyStandard>Recipient #{index + 1}</BodyStandard>
          {showDelete && (
            <ToolsSecondaryButton
              onClick={onRemove}
              className="border-none p-xs shrink-0"
              aria-label="Remove recipient"
            >
              <SVGDeleteScript className="w-6 h-6" />
            </ToolsSecondaryButton>
          )}
        </div>
        <div role="cell" aria-labelledby="col-recipient-name">
          <label htmlFor={nameInputId} className="sr-only">
            Name (optional)
          </label>
          <InputField
            id={nameInputId}
            placeholder="Fill in name (optional)"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeName(e.target.value)
            }
            ariaDescription="Enter an optional name for this recipient"
          />
        </div>
        <div
          role="cell"
          className="relative"
          aria-labelledby="col-payment-pointer"
        >
          <label htmlFor={pointerInputId} className="sr-only">
            Wallet address
          </label>
          <InputField
            id={pointerInputId}
            placeholder={DEFAULT_WALLET_ADDRESS}
            value={pointer}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangePointer(e.target.value)
            }
            required
            error={error}
            ariaDescription="Enter a valid wallet address for this recipient"
            className={cx(
              showIcon && 'pr-10',
              hasError && 'border-field-border-error',
            )}
          />
          {showIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {showValidationSpinner && <SVGSpinner className="w-4 h-4" />}
              {showSuccess && <SVGCheckIcon className="w-4 h-4" />}
            </div>
          )}
        </div>
        <div role="cell" aria-labelledby="col-percentage">
          <label htmlFor={percentageInputId} className="sr-only">
            Percentage
          </label>
          <InputField
            ref={percentageInputRef}
            id={percentageInputId}
            type="number"
            value={percentageText}
            min={getPercentageStepBase(percentage)}
            max={100}
            step={1}
            addonAfter="%"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPercentageText(e.target.value)
              onChangePercentage(Number(e.target.value))
            }}
            onBlur={() => {
              // Normalize what was typed (e.g. 05 -> 5), but keep an empty field empty
              if (percentageText !== '') setPercentageText(String(percentage))
            }}
            disabled={percentageDisabled || (!!pointer && isValid !== true)}
            required
            aria-invalid={!!percentageError}
            className="has-invalid:border-field-border-error"
            ariaDescription="Enter the percentage of revenue for this recipient. All recipient percentages must add up to 100."
          />
        </div>
        {showDelete && (
          <div
            role="cell"
            className="hidden md:block"
            aria-labelledby="col-remove"
          >
            <ToolsSecondaryButton
              onClick={onRemove}
              className="border-none p-xs shrink-0"
              aria-label="Remove recipient"
            >
              <SVGDeleteScript className="w-6 h-6" />
            </ToolsSecondaryButton>
          </div>
        )}
      </div>
    )
  },
)

ShareInput.displayName = 'ShareInput'
