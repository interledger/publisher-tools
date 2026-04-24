export type Screen = 'install-required' | 'contribution-required' | 'all-set'

export interface Controller {
  onModalClose(ev: Event): void
  onExtensionLinkClick(ev: Event): void
  onDone(ev: Event): void
  /**
   * In preview mode, instead of rendering the component as "dialog" modal;  we
   * render it in a way so it can be embedded in editor's preview interface.
   */
  isPreviewMode?: boolean
}

export interface Actions {
  setScreen(screen: Screen): void
}

export const NO_OP_CONTROLLER: Controller = {
  onModalClose: (ev) => ev.preventDefault(),
  onExtensionLinkClick: () => {},
  onDone: () => {},
}
