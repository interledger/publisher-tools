import { useState, useEffect } from 'react'
import { NavLink as RemixNavLink } from '@remix-run/react'
import { GhostButton, NavDropdown, NavLink, MobileMenu } from '@/components'
import { SVGHamburgerIcon } from '@/assets'
import wmLogo from '~/assets/images/wm_logo.svg?url'

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    if (!isMobileMenuOpen) {
      setIsVisible(true)
    }
  }

  useEffect(() => {
    const controlNavbar = () => {
      if (isMobileMenuOpen) return

      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 75) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', controlNavbar)
    return () => {
      window.removeEventListener('scroll', controlNavbar)
    }
  }, [lastScrollY, isMobileMenuOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } md:bg-white md:shadow-[0px_12px_20px_0px_rgba(0,0,0,0.06)]`}
      >
        <nav
          role="navigation"
          className="relative flex items-center justify-between bg-white shadow-[0px_12px_20px_0px_rgba(0,0,0,0.06)] rounded-lg mx-4 mt-4 h-14 py-1 pl-4 pr-2 md:max-w-7xl md:mx-auto md:px-xl md:py-xs md:mt-0 md:rounded-none md:shadow-none md:bg-transparent md:h-auto md:w-full"
        >
          <RemixNavLink
            to="/"
            className="flex items-center focus:outline-none focus-visible:outline-2 focus-visible:outline-nav-link-hover focus-visible:outline-offset-0 rounded-sm"
          >
            <img
              src={wmLogo}
              alt="Web Monetization Logo"
              className="w-8 md:w-11 h-8 md:h-11"
            />
          </RemixNavLink>

          <ul className="hidden md:flex gap-md list-none">
            <NavDropdown title="Tools" />
            <NavLink to="/docs">Documentation</NavLink>
            <NavLink to="/specification">Specification</NavLink>
          </ul>

          <GhostButton
            onClick={toggleMobileMenu}
            tabIndex={0}
            className="md:hidden size-12"
          >
            <SVGHamburgerIcon className="w-5 h-5" />
          </GhostButton>
        </nav>
      </header>

      {isMobileMenuOpen && <MobileMenu onClose={toggleMobileMenu} />}
    </>
  )
}
