

type NavLinkProps = {
  to: string
  children: React.ReactNode
}

export const NavLink = ({ to, children }: NavLinkProps) => {
  return (
    <li className="group flex md:justify-center md:items-center">
      <a
        href={to}
        className="w-full px-md py-sm text-sm leading-sm bg-transparent text-nav-link-default focusable-nav-item"
      >
        {children}
      </a>
    </li>
  )
}
