import React from 'react'
import { Checkbox } from './Checkbox'

interface ConfigConditionProps {
  id?: string
  number?: string | number
  title?: string
  editCount?: string | number
  presetName?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

export const ConfigCondition: React.FC<ConfigConditionProps> = ({
  id,
  number = '1',
  title = '',
  editCount = 'Has local changes',
  presetName = 'Preset one',
  checked = false,
  onCheckedChange,
  className = '',
  disabled = false
}) => {
  const hasLocalChanges = editCount === 'Has local changes'
  const isDisabled = disabled || !hasLocalChanges

  const handleClick = () => {
    if (!isDisabled && onCheckedChange) {
      onCheckedChange(!checked)
    }
  }

  return (
    <div
      className={`flex items-center w-full px-md py-sm ${className} ${
        !isDisabled ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'
      }`}
      id={id}
      onClick={handleClick}
    >
      <span
        className={`text-style-small-standard w-[50px] mr-md ${
          isDisabled ? 'text-text-secondary' : 'text-text-primary'
        }`}
      >
        {number}.
      </span>

      <div className="w-[150px] mr-md">
        <p
          className={`text-style-small-emphasis ${
            isDisabled ? 'text-text-secondary' : 'text-text-primary'
          }`}
        >
          {title}
        </p>
        {hasLocalChanges && (
          <p className="text-style-small-standard text-text-success">
            {editCount}
          </p>
        )}
        {!hasLocalChanges && (
          <p className="text-style-small-standard text-text-secondary">
            No changes
          </p>
        )}
      </div>

      <div className="w-[70px] flex justify-center mr-md">
        <div style={{ pointerEvents: 'none' }}>
          <Checkbox
            checked={checked}
            onChange={onCheckedChange}
            disabled={isDisabled}
          />
        </div>
      </div>

      <div className="w-[140px]">
        <p
          className={`text-style-small-emphasis text-center ${
            isDisabled ? 'text-text-secondary' : 'text-text-primary'
          }`}
        >
          {presetName}
        </p>
      </div>
    </div>
  )
}

export default ConfigCondition
