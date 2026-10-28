import type { RefObject } from 'react'
import { SVGCloseIcon } from '@/assets'
import { GhostButton, PoweredByFooter } from '@/components'
import wmLogo from '~/assets/images/wm_logo.svg'

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
  onItemClick: () => void
}

const MobileMenuItem = ({
  to,
  text,
  onClick,
}: MobileMenuItemData & { onClick: () => void }) => {
  return (
    <li>
      <a
        href={to}
        onClick={onClick}
        className="flex w-full items-center gap-xs rounded-lg p-md text-base font-normal leading-md text-nav-link-default focusable-nav-item"
      >
        {text}
      </a>
    </li>
  )
}

const MobileMenuSection = ({
  title,
  items,
  onItemClick,
}: MobileMenuSectionProps) => {
  return (
    <section className="flex w-full flex-col gap-xs">
      <div className="flex flex-col gap-3xs">
        <h2 className="text-style-caption-standard">{title}</h2>
        <hr className="border-silver-200" />
      </div>
      <ul className="flex flex-col gap-xs">
        {items.map((item) => (
          <MobileMenuItem
            key={item.text}
            to={item.to}
            text={item.text}
            onClick={onItemClick}
          />
        ))}
      </ul>
    </section>
  )
}

export const MobileMenu = ({
  dialogRef,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
}) => {
  const close = () => dialogRef.current?.close()

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 hidden h-full w-full max-h-none max-w-none border-none bg-white p-0 open:flex open:flex-col md:hidden"
      aria-label="Mobile menu"
    >
      <div className="shrink-0 flex items-center justify-between pt-lg pr-5 pb-2xs pl-7">
        <a href="https://webmonetization.org/">
          <img src={wmLogo} alt="Web Monetization" className="h-8 w-auto" />
        </a>
        <GhostButton
          onClick={close}
          className="size-[48px] flex items-center justify-center focusable-nav-item"
          aria-label="Close menu"
        >
          <SVGCloseIcon className="w-5 h-5" />
        </GhostButton>
      </div>
      <div className="flex-1 overflow-y-auto px-lg mt-lg">
        <div className="flex flex-col gap-lg">
          <MobileMenuSection
            title="Tools"
            items={toolItems}
            onItemClick={close}
          />
          <MobileMenuSection
            title="Technical"
            items={technicalItems}
            onItemClick={close}
          />
        </div>
      </div>
      <PoweredByFooter />
    </dialog>
  )
}
