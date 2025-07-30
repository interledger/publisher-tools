import { useLocation } from '@remix-run/react'
import { EnhancedFooter } from '@/components'

export const Footer = () => {
  const location = useLocation()
  const isIndexRoute = location.pathname === '/'

  if (isIndexRoute) {
    return <EnhancedFooter />
  }

  return (
    <footer className="w-full pb-xl mt-2xl bg-interface-bg-main">
      <div className="flex flex-row items-center justify-center w-full">
        <p className="!text-footer-content text-style-small-standard text-center">
          Copyright© {new Date().getFullYear()} Interledger Foundation.
        </p>
      </div>
    </footer>
  )
}
