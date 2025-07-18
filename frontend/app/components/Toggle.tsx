import { type ComponentProps, forwardRef, useId, useState } from 'react'
import { cx } from 'class-variance-authority'
import { Label } from './index.js'
import type { SlideAnimationType } from '@shared/types'

type ToggleProps = Omit<ComponentProps<'div'>, 'children'> & {
  label?: string
  name?: string
  value?: string
  updateValue: (value: SlideAnimationType) => void
  error?: string | string[]
}

export const Toggle = forwardRef<HTMLDivElement, ToggleProps>(
  ({ label, id, name, value, ...props }, ref) => {
    const generatedId = useId()
    const internalId = id ?? generatedId

    const [isActive, setIsActive] = useState(value ?? false)

    return (
      <div {...props}>
        {label && (
          <Label htmlFor={internalId} required={false}>
            {label}
          </Label>
        )}
        <div
          ref={ref}
          className="h-10 float-right p-2 flex items-center justify-center"
        >
          {name && <input type="hidden" name={name} value={String(isActive)} />}
          <div
            className="h-8 w-16 cursor-pointer float-right ml-4  rounded-full"
            onClick={() => setIsActive(!isActive)}
          >
            <div
              className={cx(
                'w-6 h-6 top-1 rounded-full relative',
                isActive
                  ? 'float-right left-2 -right-2'
                  : 'float-left -left-2 right-2'
              )}
              style={{
                background: !isActive!
                  ? 'rgb(241, 146, 162)'
                  : 'rgb(144, 199, 202)'
              }}
            />
            <span
              className="select-none text-sm pt-1"
              style={{
                marginRight: !isActive ? 5 : -5,
                marginLeft: !isActive ? -5 : 5,
                color: !isActive! ? 'rgb(241, 146, 162)' : 'rgb(144, 199, 202)',
                float: !isActive ? 'right' : 'left'
              }}
            ></span>
          </div>
        </div>
      </div>
    )
  }
)

Toggle.displayName = 'Toggle'
