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
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    dialog.showModal()

    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
      triggerRef?.current?.focus()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [onClose, triggerRef])

  const handleClose = () => {
    onClose()
    triggerRef?.current?.focus()
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none flex-col bg-white p-0 md:hidden"
      aria-label="Mobile menu"
    >
      <div className="shrink-0 flex items-center justify-between pt-lg pr-5 pb-2xs pl-7">
        <a href="https://webmonetization.org/">
          <img src={mobileLogo} alt="Web Monetization Logo" />
        </a>
        <GhostButton
          onClick={handleClose}
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
    </dialog>
  )
}
