import { cx } from 'class-variance-authority'
import { NavLink, useLocation } from '@remix-run/react'
import { GhostButton, PoweredByFooter } from '@/components'
import { SVGCloseIcon } from '@/assets'
import mobileLogo from '~/assets/images/mobile_header.svg'

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
  const isActive = useLocation().pathname === to
  return (
    <li>
      <a
        href={to}
        className={cx(
          'flex w-full items-center gap-sm rounded-lg p-md text-nav-link-default',
          'transition-colors',
          'active:bg-secondary-surface',
          { 'bg-secondary-hover-surface': isActive }
        )}
      >
        <div
          className={cx('h-6 w-0.5 transition-colors', {
            'bg-secondary-edge': isActive
          })}
        />
        <span className="text-base font-normal leading-md">{text}</span>
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
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
      <div className="flex-shrink-0 flex items-center justify-between pt-[22px] pr-[20px] pb-[6px] pl-[28px]">
        <NavLink to="/">
          <img src={mobileLogo} alt="Web Monetization Logo" />
        </NavLink>
        <GhostButton
          onClick={onClose}
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
