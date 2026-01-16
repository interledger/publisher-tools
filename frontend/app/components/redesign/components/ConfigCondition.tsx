import React from 'react'
import { SVGArrow1 } from '~/assets/svg'
import { Checkbox } from './Checkbox'

interface ConfigConditionProps {
  id?: string
  number?: string | number
  title?: string
  hasLocalChanges?: boolean
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
  hasLocalChanges = false,
  presetName = 'Preset one',
  checked = false,
  onCheckedChange,
  className = '',
  disabled = false,
}) => {
  const isDisabled = disabled || !hasLocalChanges

  const handleClick = () => {
    if (!isDisabled && onCheckedChange) {
      onCheckedChange(!checked)
    }
  }

  return (
    <label
      onClick={handleClick}
      className={`flex items-center w-full px-md py-sm rounded-lg bg-white ${className} ${
        !isDisabled ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'
      }`}
      id={id}
    >
      <div className="flex items-center gap-3 mr-4">
        <Checkbox
          checked={checked}
          onChange={onCheckedChange}
          disabled={isDisabled}
        />

        <span
          className={`text-style-small-standard ${
            isDisabled ? 'text-text-secondary' : 'text-text-primary'
          }`}
        >
          {number}.
        </span>

        <div className="flex items-center justify-center w-0 h-2">
          <div className="w-0.5 h-2 bg-gray-300 rotate-90"></div>
        </div>
      </div>

      <div className="flex flex-col w-[150px] mr-4">
        <p
          className={`text-style-small-emphasis ${
            isDisabled ? 'text-text-secondary' : 'text-text-primary'
          }`}
        >
          {title}
        </p>
        {hasLocalChanges ? (
          <p className="text-style-small-standard text-text-success">
            Has local changes
          </p>
        ) : (
          <p className="text-style-small-standard text-text-secondary">
            No changes
          </p>
        )}
      </div>

      <div className="flex justify-center w-[70px] mr-4">
        <SVGArrow1 className="w-[70px] h-2 text-purple-400" />
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
    </label>
  )
}

export default ConfigCondition
