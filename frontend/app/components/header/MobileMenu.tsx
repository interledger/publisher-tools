import React, { useEffect, useRef } from 'react'
import { SVGCloseIcon } from '@/assets'
import { GhostButton, PoweredByFooter } from '@/components'
import mobileLogo from '~/assets/images/mobile_logo.svg'

const toolItems: MobileMenuItemData[] = [
  { to: '/publishers', text: 'Publisher tools' },
  { to: '/supporters', text: 'Supporter tools' },
  { to: '/developers', text: 'Developer tools' },
]

const technicalItems: MobileMenuItemData[] = [
  { to: '/docs', text: 'Documentation' },
  { to: '/specification', text: 'Specification' },
]

interface MobileMenuItemData {
  to: string
  text: string
}

interface MobileMenuSectionProps {
  title: string
  items: MobileMenuItemData[]
}

const MobileMenuItem = ({ to, text }: MobileMenuItemData) => {
  return (
    <li>
      <a
        href={to}
        className="flex w-full items-center gap-xs rounded-lg p-md text-base font-normal leading-md text-nav-link-default focusable-nav-item"
      >
        {text}
      </a>
    </li>
  )
}

const MobileMenuSection = ({ title, items }: MobileMenuSectionProps) => {
  return (
    <section className="flex w-full flex-col gap-xs">
      <div className="flex flex-col gap-3xs">
        <h2 className="text-style-caption-standard">{title}</h2>
        <hr className="border-silver-200" />
      </div>
      <ul className="flex flex-col gap-xs">
        {items.map((item) => (
          <MobileMenuItem key={item.text} to={item.to} text={item.text} />
        ))}
      </ul>
    </section>
  )
}

export const MobileMenu = ({
  onClose,
  triggerRef,
}: {
  onClose: () => void
  triggerRef?: React.RefObject<HTMLElement>
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const focusableSelectors =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        triggerRef?.current?.focus()
        return
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(focusableSelectors),
        ).filter((el) => el.offsetParent !== null)

        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, triggerRef])

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex flex-col bg-white md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile menu"
    >
      <div className="shrink-0 flex items-center justify-between pt-lg pr-5 pb-2xs pl-7">
        <a href="https://webmonetization.org/">
          <img src={mobileLogo} alt="Web Monetization Logo" />
        </a>
        <GhostButton
          onClick={() => {
            onClose()
            triggerRef?.current?.focus()
          }}
          autoFocus
          className="size-[48px] flex items-center justify-center focusable-nav-item"
          aria-label="Close menu"
        >
          <SVGCloseIcon className="w-5 h-5" />
        </GhostButton>
      </div>
      <div className="flex-1 overflow-y-auto px-lg mt-lg">
        <div className="flex flex-col gap-lg">
          <MobileMenuSection title="Tools" items={toolItems} />
          <MobileMenuSection title="Technical" items={technicalItems} />
        </div>
      </div>
      <PoweredByFooter />
    </div>
  )
}
