import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { forwardRef, useId } from 'react'
import { cx } from 'class-variance-authority'
import { FieldError, Label } from './index.js'

type TextareaProps = ComponentPropsWithoutRef<'textarea'> & {
  label?: string
  error?: string | string[]
  description?: ReactNode
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ description, label, error, id, className, ...props }, ref) => {
    const generatedId = useId()
    const internalId = id ?? generatedId

    return (
      <div className="flex flex-col mt-4">
        {label && (
          <Label
            className="w-full"
            htmlFor={internalId}
            required={props.required ?? false}
          >
            {label}
          </Label>
        )}
        <div className="shadow-sm flex relative rounded-md-old">
          <textarea
            ref={ref}
            id={internalId}
            rows={4}
            className={cx(
              'block w-full p-2 rounded-md-old border border-tealish/50 transition-colors duration-150 placeholder:font-extralight focus:border-tealish focus:outline-none focus:ring-0 disabled:bg-mercury',
              className
            )}
            {...props}
          />
        </div>
        {description ? (
          <div className="font-medium text-sm">{description}</div>
        ) : null}
        <FieldError error={error} />
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
