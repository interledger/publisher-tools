import React from 'react'
import { cx } from 'class-variance-authority'
import { InputField, ToolsSecondaryButton } from '@/components'
import { BodyStandard } from '@/typography'
import { SVGDeleteScript } from '@/assets'

interface ShareInputProps {
  index: number
  name: string
  pointer: string
  weight: number
  percent: number
  placeholder?: string
  percentDisabled?: boolean
  weightDisabled?: boolean
  onChangeName: (name: string) => void
  onChangePointer: (pointer: string) => void
  onChangeWeight: (weight: number) => void
  onChangePercent: (percent: number) => void
  onRemove: () => void
  validatePointer: (pointer: string) => boolean
}

const GRID_COLS = 'md:grid-cols-[16rem_1fr_6rem_6rem_auto]'
const GRID_GAP = 'md:gap-x-md'

export const ShareInputTable = ({
  children
}: {
  children: React.ReactNode
}) => {
  return (
    <div
      role="table"
      aria-labelledby="revshare-table-caption"
      className="contents"
    >
      <div id="revshare-table-caption" className="sr-only">
        Revenue sharing recipients configuration table
      </div>
      {children}
    </div>
  )
}

export const ShareInputHeader = () => {
  return (
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
      <div
        role="columnheader"
        id="col-action"
        aria-label="Action to remove recipient from table"
      >
        Action
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
    placeholder,
    onChangeName,
    onChangePointer,
    onChangeWeight,
    onChangePercent,
    onRemove,
    validatePointer,
    percentDisabled = false,
    weightDisabled = false
  }: ShareInputProps) => {
    const hasError = !validatePointer(pointer)
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
          hasError ? 'md:mb-2xs' : ''
        )}
      >
        <div className="flex flex-row justify-between items-center md:hidden">
          <BodyStandard>Recipient #{index + 1}</BodyStandard>
          <ToolsSecondaryButton
            onClick={onRemove}
            className="border-none py-sm px-xs shrink-0"
            aria-label={`Remove recipient ${index + 1}`}
          >
            <SVGDeleteScript className="w-5 h-5" aria-hidden="true" />
          </ToolsSecondaryButton>
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
            Optional display name for recipient {index + 1}
          </div>
        </div>
        <div
          role="cell"
          className="relative"
          aria-labelledby="col-payment-pointer"
        >
          <label htmlFor={pointerInputId} className="sr-only">
            Wallet Address or Payment Pointer *
          </label>
          <InputField
            id={pointerInputId}
            placeholder={placeholder}
            value={pointer}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangePointer(e.target.value)
            }
            aria-invalid={hasError}
            aria-describedby={cx(
              `pointer-description-${index}`,
              hasError ? `pointer-error-${index}` : ''
            )}
            aria-required="true"
          />
          <div id={`pointer-description-${index}`} className="sr-only">
            Wallet address or payment pointer for recipient {index + 1}
          </div>
          {hasError && (
            <div
              id={`pointer-error-${index}`}
              className="absolute left-0 text-xs mt-2xs text-text-error"
              role="alert"
              aria-live="polite"
            >
              Invalid payment pointer
            </div>
          )}
        </div>
        <div
          role="cell"
          className={hasError ? 'mt-xs' : 'md:mt-0'}
          aria-labelledby="col-weight"
        >
          <label htmlFor={weightInputId} className="sr-only">
            Weight *
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
            disabled={weightDisabled}
            aria-disabled={weightDisabled}
            aria-describedby={`weight-description-${index}`}
            aria-required="true"
          />
          <div id={`weight-description-${index}`} className="sr-only">
            Weight value for revenue distribution calculation for
            recipient&nbsp;
            {index + 1}
          </div>
        </div>
        <div role="cell" aria-labelledby="col-percent">
          <label htmlFor={percentInputId} className="sr-only">
            Percentage
          </label>
          <InputField
            id={percentInputId}
            type="number"
            min={0}
            max={100}
            step="any"
            value={typeof percent === 'number' ? Math.round(percent * 100) : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangePercent(Number(e.target.value) / 100)
            }
            disabled={percentDisabled}
            aria-disabled={percentDisabled}
            aria-describedby={`percent-description-${index}`}
          />
          <div id={`percent-description-${index}`} className="sr-only">
            Calculated percentage of total revenue for recipient {index + 1}
          </div>
        </div>
        <div
          role="cell"
          className="hidden md:block"
          aria-labelledby="col-action"
        >
          <ToolsSecondaryButton
            onClick={onRemove}
            className="border-none py-sm px-xs shrink-0"
            aria-label={`Remove recipient ${index + 1} from revenue sharing table`}
          >
            <SVGDeleteScript className="w-5 h-5" aria-hidden="true" />
          </ToolsSecondaryButton>
        </div>
      </div>
    )
  }
)

ShareInput.displayName = 'ShareInput'
