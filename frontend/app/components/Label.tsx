import { type ComponentProps, forwardRef, type ReactNode } from 'react'
import { InfoWithTooltip } from './index.js'

type LabelProps = Omit<ComponentProps<'label'>, 'children'> & {
  children: ReactNode
  required?: boolean
  tooltip?: string
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ htmlFor, children, required, tooltip, ...props }, ref) => {
    return (
      <label
        htmlFor={htmlFor}
        className="block font-medium text-sm"
        {...props}
        ref={ref}
      >
        <span>{children}</span>
        {required ? <span className="text-red-500">*</span> : ''}
        <InfoWithTooltip tooltip={tooltip} />
      </label>
    )
  }
)
Label.displayName = 'Label'
