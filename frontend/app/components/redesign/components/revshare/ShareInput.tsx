import React, { useEffect, useState } from 'react'
import { cx } from 'class-variance-authority'
import { InputField, ToolsSecondaryButton } from '@/components'
import { BodyStandard } from '@/typography'
import { SVGCheckIcon, SVGDeleteScript, SVGSpinner } from '@/assets'
import { useDebounceValidation } from '../../hooks/useDebounceValidation'

interface ShareInputProps {
  index: number
  name: string
  pointer: string
  weight: number
  percent: number
  weightDisabled?: boolean
  showDelete?: boolean
  onChangeName: (name: string) => void
  onChangePointer: (pointer: string) => void
  onChangeWeight: (weight: number) => void
  onValidationChange: (index: number, isValid: boolean) => void
  onRemove: () => void
}

const DEFAULT_WALLET_ADDRESS = 'https://walletprovider.com/myWallet'
const GRID_COLS =
  'md:grid-cols-[1fr_3fr_1fr_1fr_minmax(0,auto)] lg:grid-cols-[12rem_1fr_6rem_6rem_minmax(0,auto)]'
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
          'hidden p-md leading-sm text-silver-600 rounded-sm bg-silver-50',
          'md:grid',
          GRID_COLS,
          GRID_GAP
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
          aria-label="Wallet address or payment pointer for recipient, required field"
        >
          Wallet Address/Payment Pointer
        </div>
        <div
          role="columnheader"
          id="col-weight"
          aria-label="Weight value for revenue distribution, required field"
        >
          Weight
        </div>
        <div
          role="columnheader"
          id="col-percentage"
          aria-label="Calculated percentage of total revenue based on weight"
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
    weight,
    percent,
    onChangeName,
    onChangePointer,
    onChangeWeight,
    onValidationChange,
    onRemove,
    showDelete = false,
    weightDisabled = false
  }: ShareInputProps) => {
    const { isValidating, isValid, error } = useDebounceValidation(pointer, 500)
    const [showSuccess, setShowSuccess] = useState(false)

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
    const weightInputId = `weight-input-${index}`
    const percentInputId = `percent-input-${index}`

    return (
      <div
        role="row"
        aria-rowindex={index + 2}
        aria-invalid={hasError}
        className={cx(
          'bg-white flex flex-col gap-md p-md rounded-lg border border-silver-200',
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
              aria-describedby={pointerInputId}
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
            aria-describedby={`name-description-${index}`}
          />
          <div id={`name-description-${index}`} className="sr-only">
            Optional name for this recipient.
          </div>
        </div>
        <div
          role="cell"
          className="relative"
          aria-labelledby="col-payment-pointer"
        >
          <label htmlFor={pointerInputId} className="sr-only">
            Wallet Address or Payment Pointer
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
            aria-required="true"
            aria-invalid={hasError}
            aria-describedby={cx(
              `pointer-description-${index}`,
              hasError ? `pointer-error-${index}` : ''
            )}
            className={cx(
              showIcon && 'pr-10',
              hasError && 'border-field-border-error'
            )}
          />
          {showIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {showValidationSpinner && <SVGSpinner className="w-4 h-4" />}
              {showSuccess && <SVGCheckIcon className="w-4 h-4" />}
            </div>
          )}
          <div id={`pointer-description-${index}`} className="sr-only">
            Required wallet address for this recipient.
          </div>
        </div>
        <div
          role="cell"
          aria-labelledby="col-weight"
        >
          <label htmlFor={weightInputId} className="sr-only">
            Weight
          </label>
          <InputField
            id={weightInputId}
            type="number"
            value={weight}
            min={0}
            step="any"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeWeight(Number(e.target.value))
            }
            disabled={weightDisabled || (!!pointer && isValid !== true)}
            aria-disabled={weightDisabled || (!!pointer && isValid !== true)}
            aria-describedby={`weight-description-${index}`}
            aria-required="true"
          />
          <div id={`weight-description-${index}`} className="sr-only">
            Weight value for calculating revenue share.
          </div>
        </div>
        <div role="cell" aria-labelledby="col-percentage">
          <div
            id={percentInputId}
            className="ml-2xs md:ml-0 md:text-center text-field-helpertext-default"
          >
            {Math.round(percent * 100)}%
          </div>
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
              aria-describedby={pointerInputId}
            >
              <SVGDeleteScript className="w-6 h-6" />
            </ToolsSecondaryButton>
          </div>
        )}
      </div>
    )
  }
)

ShareInput.displayName = 'ShareInput'
