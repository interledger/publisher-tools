export type Screen = 'install-required' | 'contribution-required' | 'all-set'

export interface Controller {
  onModalClose(ev: Event): void
  onExtensionLinkClick(ev: Event): void
  onDone(ev: Event): void

  // TODO: add all handlers to controller only, instead of using the element
  // instance. The element instance should have `setController` as the only
  // public method.
  //
  // requestScreenChange(screen: Screen): void
}

export const NO_OP_CONTROLLER: Controller = {
  onModalClose: (ev) => ev.preventDefault(),
  onExtensionLinkClick: () => {},
  onDone: () => {},
}
