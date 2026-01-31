import { useState, useRef, useEffect, forwardRef } from 'react'
import ClickAwayListener from 'react-click-away-listener'
import { HexColorInput, HexColorPicker } from 'react-colorful'
import { cx } from 'class-variance-authority'
import { SVGColorPicker, SVGArrowDropdown } from '../../../assets/svg'

export type Color = {
  value: string
  label?: string
}

const defaultColors: Color[] = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#7F76B2', label: 'Purple' }, // wm-purple
  { value: '#98E1D0', label: 'Mint' }, // mint-300
  { value: '#F69656', label: 'Orange' }, // wm-orange
  { value: '#F8C6DB', label: 'Pink' }, // wm-pink
  { value: '#A9CAC9', label: 'Teal' }, // custom teal
  { value: '#F2797F', label: 'Red' }, // custom red
]

interface ColorSelectorProps {
  label?: string
  value?: string
  className?: string
  disabled?: boolean
  onChange?: (color: string) => void
}

export const ColorSelector = forwardRef<HTMLDivElement, ColorSelectorProps>(
  (
    {
      label = 'Background color',
      value = '#FFFFFF',
      className = '',
      disabled = false,
      onChange,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [openColorPicker, setDisplayColorPicker] = useState(false)
    const [selectedColor, setSelectedColor] = useState<string>(value)
    const [isFocused, setIsFocused] = useState(false)
    const selectorRef = useRef<HTMLButtonElement>(null)
    useEffect(() => {
      setSelectedColor(value)
    }, [value])

    const handleColorSelect = (color: string) => {
      setSelectedColor(color)
      setIsOpen(false)
      if (onChange) {
        onChange(color)
      }
    }

    const toggleDropdown = () => {
      setIsOpen(!isOpen)
      setIsFocused(true)
    }

    return (
      <div
        className={cx('flex flex-row flex-1 items-center gap-xs', className)}
      >
        <ClickAwayListener onClickAway={() => setIsOpen(false)}>
          <div ref={ref} className={cx('relative w-full', className)}>
            <button
              type="button"
              onClick={toggleDropdown}
              className={cx(
                'flex items-center justify-between w-full px-xs py-xs rounded-sm border',
                disabled
                  ? 'bg-field-bg-disabled border-field-border-disabled cursor-not-allowed'
                  : isOpen
                    ? 'border-field-border-focus'
                    : isFocused
                      ? 'border-field-border-hover'
                      : 'border-field-border hover:border-field-border-hover',
                'focus:outline-none',
              )}
              disabled={disabled}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              ref={selectorRef}
            >
              <div className="flex items-center">
                <div
                  className="w-8 h-8 rounded-full border border-silver-200 mr-2"
                  style={{ backgroundColor: selectedColor }}
                />

                <span className="text-sm leading-sm text-text-primary">
                  {label}
                </span>
              </div>

              <span
                className={cx(
                  'flex items-center justify-center transition-transform duration-200',
                  isOpen ? 'rotate-180' : '',
                )}
              >
                <SVGArrowDropdown
                  className={cx(
                    'w-5 h-5',
                    disabled ? 'fill-text-disabled' : 'fill-text-primary',
                  )}
                />
              </span>
            </button>
            {isOpen && (
              <div className="absolute z-10 mt-1 left-0 w-auto bg-white border border-silver-200 rounded-sm shadow-sm p-3">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <SVGColorPicker
                    className="w-5 h-5 cursor-pointer fill-purple-300"
                    onClick={() => {
                      setIsOpen(false)
                      setDisplayColorPicker(!openColorPicker)
                    }}
                  />

                  {defaultColors.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleColorSelect(color.value)}
                      className={cx(
                        'h-5 w-5 rounded-full border border-silver-300',
                        selectedColor === color.value
                          ? 'ring-1 ring-offset-1 ring-purple-600'
                          : '',
                      )}
                      style={{ backgroundColor: color.value }}
                      aria-label={color.label || `Color ${index + 1}`}
                      title={color.label}
                    >
                      {selectedColor === color.value && (
                        <svg
                          className="h-4 w-4 text-text-primary"
                          viewBox="0 -960 960 960"
                          fill="currentColor"
                        >
                          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {openColorPicker && (
              <div>
                <ClickAwayListener
                  onClickAway={() => setDisplayColorPicker(false)}
                >
                  <div
                    className={cx(
                      'absolute border border-gray-400 p-1 bg-gray-200 rounded-lg z-10',
                      openColorPicker ? 'flex flex-col' : 'hidden',
                    )}
                  >
                    <style>{`.react-colorful__last-control { border-radius: 0; }`}</style>
                    <HexColorPicker
                      color={String(value)}
                      onChange={(color) => {
                        setSelectedColor(color)
                        if (onChange) {
                          onChange(color)
                        }
                      }}
                    />
                    <div className="flex items-center justify-center p-2 bg-white border-t border-gray-300">
                      <span className="text-gray-600 mr-2">#</span>
                      <HexColorInput
                        color={String(selectedColor)}
                        onChange={(color) => {
                          setSelectedColor(color)
                          if (onChange) {
                            onChange(color)
                          }
                        }}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        placeholder="000000"
                      />
                    </div>
                  </div>
                </ClickAwayListener>
              </div>
            )}
          </div>
        </ClickAwayListener>
      </div>
    )
  },
)

ColorSelector.displayName = 'ColorSelector'
