import React from 'react'
import { cx } from 'class-variance-authority'
import { InputField, ToolsSecondaryButton } from '@/components'
import { BodyStandard } from '../../Typography'
import { SVGDeleteScript } from '~/assets/svg'

interface ShareInputProps {
  index: number
  name: string
  pointer: string
  weight: number
  percent: number
  onChangeName: (name: string) => void
  onChangePointer: (pointer: string) => void
  onChangeWeight: (weight: number) => void
  onChangePercent: (percent: number) => void
  onRemove: () => void
  percentDisabled?: boolean
  weightDisabled?: boolean
}

const GRID_COLS = 'md:grid-cols-[16rem_1fr_6rem_6rem_auto]'
const GRID_GAP = 'md:gap-x-md'

export const ShareInputHeader = () => {
  return (
    <div
      className={cx(
        'hidden p-md leading-sm text-silver-600 rounded-sm bg-silver-50',
        'md:grid',
        GRID_COLS,
        GRID_GAP
      )}
    >
      <div>Name</div>
      <div>Wallet Address</div>
      <div>Weight</div>
      <div>Percentage</div>
      <div>Action</div>
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
    onChangePercent,
    onRemove,
    percentDisabled = false,
    weightDisabled = false
  }: ShareInputProps) => {
    const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      if (value === '') {
        onChangePercent(0)
        return
      }
      const numValue = Number(value)
      if (isNaN(numValue)) {
        return
      }
      let clampedValue = numValue
      if (clampedValue > 100) {
        clampedValue = 100
      }
      if (clampedValue < 0) {
        clampedValue = 0
      }
      onChangePercent(clampedValue / 100)
    }
    return (
      <div
        className={cx(
          'bg-white flex flex-col gap-md p-md rounded-lg border border-silver-200',
          'md:rounded-none md:border-none md:grid md:px-md md:py-0 md:items-center',
          GRID_COLS,
          GRID_GAP
        )}
      >
        <div className="flex flex-row justify-between items-center md:hidden">
          <BodyStandard>Revshare #{index + 1}</BodyStandard>
          <ToolsSecondaryButton
            onClick={onRemove}
            className="border-none py-sm px-xs shrink-0"
          >
            <SVGDeleteScript className="w-5 h-5" />
          </ToolsSecondaryButton>
        </div>
        <div>
          <InputField
            placeholder="Fill in name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeName(e.target.value)
            }
          />
        </div>
        <div>
          <InputField
            placeholder="Wallet Address/Payment Pointer"
            value={pointer}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangePointer(e.target.value)
            }
          />
        </div>
        <div>
          <InputField
            type="number"
            value={weight}
            min={0}
            step="any"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeWeight(Number(e.target.value))
            }
            disabled={weightDisabled}
          />
        </div>
        <div>
          <InputField
            type="number"
            min={0}
            max={100}
            step="any"
            value={typeof percent === 'number' ? Math.round(percent * 100) : ''}
            onChange={handlePercentageChange}
            disabled={percentDisabled}
          />
        </div>
        <div className="hidden md:block">
          <ToolsSecondaryButton
            onClick={onRemove}
            className="border-none py-sm px-xs shrink-0"
          >
            <SVGDeleteScript className="w-5 h-5" />
          </ToolsSecondaryButton>
        </div>
      </div>
    )
  }
)

ShareInput.displayName = 'ShareInput'
