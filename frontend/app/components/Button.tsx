import { forwardRef } from 'react'
import { cva, cx, type VariantProps } from 'class-variance-authority'
import { ButtonOrLink, type ButtonOrLinkProps } from './ButtonOrLink.js'

const buttonStyles = cva(
  'inline-flex items-center justify-center w-fit rounded-md-old px-3 py-1 border border-wm-green m-auto focus:outline-none disabled:cursor-not-allowed disabled:bg-mercury disabled:text-gray-500',
  {
    variants: {
      intent: {
        default:
          'text-sm bg-white hover:bg-gradient-to-r hover:from-wm-green hover:to-wm-green-fade',
        reset:
          'text-sm bg-white hover:from-wm-purple hover:to-[#7f7fff] hover:text-white hover:bg-gradient-to-r',
        danger:
          'disabled:bg-red-200 bg-red-500 hover:bg-red-600 shadow-md text-white',
        icon: 'bg-white enabled:hover:bg-gradient-to-r enabled:hover:from-wm-green enabled:hover:to-wm-green-fade aspect-square shadow-md max-w-[30px] disabled:bg-gray-200 disabled:hover:bg-gray-200!',
        invisible: 'px-1 border-none text-white',
      },
      size: {
        sm: 'px-2 py-1 ',
        md: '',
      },
    },
    defaultVariants: {
      intent: 'default',
      size: 'md',
    },
  },
)

type ButtonProps = VariantProps<typeof buttonStyles> &
  ButtonOrLinkProps & {
    ['aria-label']: string
    variant?: string
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ intent, children, className, ...props }, ref) => {
    return (
      <ButtonOrLink
        ref={ref}
        className={cx(buttonStyles({ intent }), className)}
        {...props}
      >
        {children}
      </ButtonOrLink>
    )
  },
)

Button.displayName = 'Button'
