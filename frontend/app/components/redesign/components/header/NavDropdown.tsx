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
    <li className="group relative inline-flex flex-col items-start justify-center">
      <button
        id="nav-dropdown-trigger"
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className={cx(
          'flex w-full items-center justify-between gap-xs rounded-lg px-md py-sm font-sans text-sm font-normal leading-sm transition-colors hover:bg-secondary-hover-surface hover:text-nav-link-hover focus:outline-none focus-visible:bg-secondary-hover-surface focus-visible:text-nav-link-hover focus-visible:outline-nav-link-hover focus-visible:outline-offset-1 md:w-auto md:justify-normal',
          isOpen ? 'text-nav-link-hover' : 'text-nav-link-default'
        )}
        aria-label="Toggle Dropdown"
        aria-expanded={isOpen}
        aria-controls="nav-dropdown-content"
      >
        {title}
        <span
          className={cx(
            'flex items-center justify-center transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        >
          <SVGDownArrow
            className={cx(
              'w-4 h-4',
              isOpen ? 'fill-nav-link-hover' : 'fill-nav-link-default'
            )}
          />
        </span>
      </button>

      {isOpen && (
        <ClickAwayListener onClickAway={handleClickAway}>
          <div
            id="nav-dropdown-content"
            className="relative z-50 flex flex-col gap-xs overflow-hidden rounded-lg p-sm md:absolute md:left-0 md:top-[calc(100%+1rem)] md:h-[472px] md:w-[299px] md:items-start md:justify-start md:bg-interface-bg-container md:shadow-[0px_24px_24px_0px_rgba(0,0,0,0.08)] md:outline md:outline-1 md:outline-offset-[-1px] md:outline-interface-edge-container"
            role="menu"
            aria-hidden={!isOpen}
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
      )}
    </li>
  )
}
