import { GhostButton, NavDropdown, NavLink } from '@/components'
import { SVGCloseIcon } from '@/assets'

export const MobileMenu = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="md:hidden fixed inset-0 bg-white flex flex-col items-center justify-center z-[60]">
      <GhostButton
        onClick={onClose}
        className="absolute top-0 right-0 size-12 m-sm"
      >
        <SVGCloseIcon className="w-5 h-5" />
      </GhostButton>
      <ul className="flex flex-col gap-md list-none">
        <NavDropdown title="Tools" onMenuItemClick={onClose} />
        <NavLink to="/docs">Documentation</NavLink>
        <NavLink to="/specification">Specification</NavLink>
      </ul>
    </div>
  )
}
