import { useLocation } from '@remix-run/react'
import { EnhancedFooter } from '@/components'

export const Footer = () => {
  const location = useLocation()
  const isIndexRoute = location.pathname === '/'

  if (isIndexRoute) {
    return <EnhancedFooter />
  }

  return (
    <footer className="w-full pb-[169px] xl:pb-xl bg-interface-bg-main">
      <div className="flex flex-row items-center justify-center w-full">
        <p className="!text-footer-content text-style-small-standard">
          Copyright© {new Date().getFullYear()} Interledger Foundation.
        </p>
      </div>
    </footer>
  )
}
