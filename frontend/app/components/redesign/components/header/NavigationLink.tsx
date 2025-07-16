type NavLinkProps = {
  to: string
  children: React.ReactNode
}

export const NavLink = ({ to, children }: NavLinkProps) => {
  return (
    <li className="group flex md:justify-center md:items-center">
      <a
        href={to}
        className="w-full px-md py-sm font-sans font-normal text-sm leading-sm rounded-lg bg-transparent text-nav-link-default hover:bg-secondary-hover-surface hover:text-nav-link-hover focus:outline-none focus-visible:outline-2 focus-visible:outline-nav-link-hover focus-visible:outline-offset-2 focus-visible:bg-secondary-hover-surface focus-visible:text-nav-link-hover transition-colors"
      >
        {children}
      </a>
    </li>
  )
}
