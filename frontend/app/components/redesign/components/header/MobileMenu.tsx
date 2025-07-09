import GhostButton from '../GhostButton'
import { NavDropdown } from './NavDropdown'
import { NavLink } from './NavigationLink'
import { SVGCloseIcon } from '~/assets/svg'

export const MobileMenu = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="md:hidden fixed inset-0 bg-white flex flex-col items-center justify-center z-[60]">
      <GhostButton
        onClick={onClose}
        className="absolute top-0 right-0 size-12 m-sm"
      >
        <SVGCloseIcon />
      </GhostButton>
      <ul className="flex flex-col gap-md list-none">
        <NavDropdown title="Tools" onMenuItemClick={onClose} />
        <NavLink to="/docs">Documentation</NavLink>
        <NavLink to="/specification">Specification</NavLink>
      </ul>
    </div>
  )
}
