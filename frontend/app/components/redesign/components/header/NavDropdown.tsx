import { useState, useRef, useEffect } from 'react'
import { cx } from 'class-variance-authority'
import devHeroSVG from '~/assets/images/developer-icon.png'
import pubHeroSVG from '~/assets/images/publishers-icon.png'
import supHeroSVG from '~/assets/images/supporters-icon.png'
import ClickAwayListener from 'react-click-away-listener'
import { SVGDownArrow } from '@/assets'

type ToolsMenuItemProps = {
  to: string
  imgSrc: string
  text: string
}

const ToolsMenuItem = ({ to, imgSrc, text }: ToolsMenuItemProps) => {
  return (
    <li>
      <a
        href={to}
        className="flex w-full items-center gap-xs rounded-lg p-sm transition-colors duration-200 ease-in hover:bg-secondary-hover-surface focus:outline-none focus-visible:bg-secondary-hover-surface focus-visible:text-nav-link-hover focus-visible:outline-nav-link-hover focus-visible:outline-offset-1"
      >
        <img
          className="size-10 md:size-5xl"
          src={imgSrc}
          aria-hidden="true"
          alt=""
        />
        <div className="flex-grow whitespace-nowrap font-sans text-sm font-normal leading-normal text-text-primary md:text-base md:font-bold">
          {text}
        </div>
      </a>
    </li>
  )
}

type NavDropdownProps = {
  title: string
  onMenuItemClick?: () => void
}

export const NavDropdown = ({
  title,
  onMenuItemClick: _onMenuItemClick
}: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        if (triggerRef.current) {
          triggerRef.current.focus()
        }
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  /** only handle click away on desktop (md breakpoint and above) */
  const handleClickAway = () => {
    if (window.innerWidth >= 768) {
      setIsOpen(false)
    }
  }

  return (
    <li
      className={cx(
        'group relative ',
        'flex flex-col md:flex-row items-center justify-between gap-xs md:w-auto md:justify-normal',
        'rounded-lg px-md py-sm',
        'font-sans text-sm font-normal leading-sm',
        'cursor-pointer transition-colors',
        'hover:bg-secondary-hover-surface hover:text-nav-link-hover',
        'md:focus-within:bg-secondary-hover-surface md:focus-within:text-nav-link-hover',
        'focus:outline-none md:focus-within:outline focus-within:outline-2 focus-within:outline-nav-link-hover focus-within:outline-offset-2',
        isOpen ? 'text-nav-link-hover' : 'text-nav-link-default'
      )}
    >
      <span className='flex w-full gap-xs justify-between'>
        <span aria-hidden="true">{title}</span>
        <button
          id="nav-dropdown-trigger"
          ref={triggerRef}
          type="button"
          onClick={toggleDropdown}
          className="after:absolute after:inset-0 focus:outline-none"
          aria-label={`Toggle submenu for ${title}`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls="nav-dropdown-content"
        >
          <SVGDownArrow
            className={cx(
              'w-4 h-4',
              'flex items-center justify-center transition-transform duration-200',
              isOpen && 'rotate-180',
              isOpen ? 'fill-nav-link-hover' : 'fill-nav-link-default'
            )}
          />
        </button>
      </span>

      <ClickAwayListener onClickAway={handleClickAway}>
        <div
          id="nav-dropdown-content"
          aria-label={title}
          role="menu"
          tabIndex={0}
          inert={!isOpen}
          className={cx(
            !isOpen && '!sr-only',
            'flex flex-col gap-xs md:justify-start md:items-start',
            'relative z-50 overflow-hidden',
            'rounded-lg p-sm',
            'md:absolute md:left-0 md:top-[calc(100%+1rem)] md:h-[472px] md:w-[299px]',
            'md:bg-interface-bg-container md:shadow-[0px_24px_24px_0px_rgba(0,0,0,0.08)] md:outline md:outline-1 md:outline-offset-[-1px] md:outline-interface-edge-container',
            'focus-visible:outline focus-visible:outline-current'
          )}
        >
          <ul className="flex w-full flex-grow list-none flex-col gap-xs">
            <ToolsMenuItem
              to="/publishers"
              imgSrc={pubHeroSVG}
              text="Publisher tools"
            />
            <ToolsMenuItem
              to="/supporters"
              imgSrc={supHeroSVG}
              text="Supporter tools"
            />
            <ToolsMenuItem
              to="/developers"
              imgSrc={devHeroSVG}
              text="Developer tools"
            />
          </ul>
        </div>
      </ClickAwayListener>
    </li>
  )
}
