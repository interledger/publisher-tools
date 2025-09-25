import { NavLink } from '@remix-run/react'
import { GhostButton, PoweredByFooter } from '@/components'
import { SVGCloseIcon } from '@/assets'
import mobileLogo from '~/assets/images/mobile_logo.svg'

const toolItems: MobileMenuItemData[] = [
  { to: '/publishers', text: 'Publisher tools' },
  { to: '/supporters', text: 'Supporter tools' },
  { to: '/developers', text: 'Developer tools' }
]

const technicalItems: MobileMenuItemData[] = [
  { to: '/docs', text: 'Documentation' },
  { to: '/specification', text: 'Specification' }
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
        className="flex w-full items-center gap-xs rounded-lg p-md text-base font-normal leading-md text-nav-link-default active:bg-secondary-surface"
      >
        {text}
      </a>
    </li>
  )
}

const MobileMenuSection = ({ title, items }: MobileMenuSectionProps) => {
  return (
    <section className="flex w-full flex-col gap-xs">
      <div className="flex flex-col gap-0.5">
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

export const MobileMenu = ({ onClose }: { onClose: () => void }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile menu"
    >
      <div className="flex-shrink-0 flex items-center justify-between pt-[22px] pr-[20px] pb-[6px] pl-[28px]">
        <NavLink to="/">
          <img src={mobileLogo} alt="Web Monetization Logo" />
        </NavLink>
        <GhostButton
          onClick={onClose}
          autoFocus
          className="size-12 flex items-center justify-center focusable-nav-item"
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
