import { useState, useRef, useEffect } from 'react'
import ClickAwayListener from 'react-click-away-listener'
import { cx } from 'class-variance-authority'
import { SVGDownArrow } from '@/assets'
import developerImage from '~/assets/images/dropdown-developer.png'
import publisherHoverImage from '~/assets/images/dropdown-publisher-active.png'
import publisherDefaultImage from '~/assets/images/dropdown-publisher-inactive.png'
import supporterHoverImage from '~/assets/images/dropdown-supporter-active.png'
import supporterDefaultImage from '~/assets/images/dropdown-supporter-inactive.png'

type ToolsMenuItemProps = {
  to: string
  text: string
  defaultImage: string
  hoverImage?: string
}

const ToolsMenuItem = ({
  to,
  defaultImage,
  hoverImage,
  text,
}: ToolsMenuItemProps) => {
  const imgClasses =
    'absolute h-full w-full transition-opacity duration-200 ease-in'

  return (
    <li>
      <a
        href={to}
        className={cx(
          'flex w-full items-center gap-xs p-sm focusable-nav-item',
          hoverImage && 'group',
        )}
      >
        <div className="relative w-20 h-20">
          <img
            className={cx(imgClasses, 'opacity-100 group-hover:opacity-0')}
            src={defaultImage}
            aria-hidden="true"
            alt=""
          />
          <img
            className={cx(imgClasses, 'opacity-0 group-hover:opacity-100')}
            src={hoverImage ?? defaultImage}
            aria-hidden="true"
            alt=""
          />
        </div>
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
  onMenuItemClick: _onMenuItemClick,
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
    <li className="relative inline-flex flex-col items-start justify-center">
      <button
        id="nav-dropdown-trigger"
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className={cx(
          'flex w-full items-center justify-between gap-xs',
          'px-md py-sm',
          'font-sans text-sm font-normal leading-sm',
          'md:w-auto md:justify-normal',
          'focusable-nav-item',
          isOpen ? 'text-nav-link-hover' : 'text-nav-link-default',
        )}
        aria-label={`Toggle submenu for ${title}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="nav-dropdown-content"
      >
        {title}
        <SVGDownArrow
          className={cx(
            'w-4 h-4',
            'flex items-center justify-center transition-transform duration-200',
            isOpen ? 'rotate-180 fill-nav-link-hover' : 'fill-nav-link-default',
          )}
        />
      </button>
      <ClickAwayListener onClickAway={handleClickAway}>
        <div
          id="nav-dropdown-content"
          aria-label={title}
          role="menu"
          tabIndex={0}
          inert={!isOpen}
          className={cx(
            'relative z-50 flex flex-col gap-xs overflow-hidden rounded-lg p-sm',
            !isOpen && '!sr-only',
            'md:absolute md:left-0 md:top-[calc(100%+1rem)] md:w-max',
            'md:items-start md:justify-start md:bg-interface-bg-container',
            'md:shadow-[0px_24px_24px_0px_rgba(0,0,0,0.08)]',
            'md:outline md:outline-1 md:outline-offset-[-1px] md:outline-interface-edge-container',
            'focus-visible:outline-offset-0',
          )}
        >
          <ul className="flex w-full flex-grow list-none flex-col gap-xs">
            <ToolsMenuItem
              to="/publishers"
              hoverImage={publisherHoverImage}
              defaultImage={publisherDefaultImage}
              text="For publishers"
            />
            <ToolsMenuItem
              to="/supporters"
              hoverImage={supporterHoverImage}
              defaultImage={supporterDefaultImage}
              text="For supporters"
            />
            <ToolsMenuItem
              to="/developers"
              defaultImage={developerImage}
              text="For developers"
            />
          </ul>
        </div>
      </ClickAwayListener>
    </li>
  )
}
