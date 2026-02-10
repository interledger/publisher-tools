import { html, LitElement, unsafeCSS } from 'lit'
import { state } from 'lit/decorators.js'
import { createRef, ref, type Ref } from 'lit/directives/ref.js'
import {
  AllSet,
  ContributionRequired,
  InstallRequired,
} from './components/index.js'
import { NO_OP_CONTROLLER, type Controller, type Screen } from './controller.js'
import styles from './styles.css?raw'
import styleTokens from './vars.css?raw'

const COMPONENTS = {
  'wm-offerwall-install-required': InstallRequired,
  'wm-offerwall-all-set': AllSet,
  'wm-offerwall-contribution-required': ContributionRequired,
}

const ALLOWED_SCREENS: Screen[] = [
  'install-required',
  'contribution-required',
  'all-set',
]

export class OfferwallModal extends LitElement {
  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  constructor() {
    super()
  }

  #controller: Controller = NO_OP_CONTROLLER
  setController(controller: Controller) {
    if (this.#controller !== NO_OP_CONTROLLER) {
      throw new Error('Controller already set')
    }
    this.#controller = controller
  }

  @state() _screen: Screen = 'install-required'
  setScreen(screen: Screen) {
    if (!ALLOWED_SCREENS.includes(screen)) {
      throw new Error('Invalid screen')
    }
    this._screen = screen
    this._loading = false
  }

  // TODO: unused for now.
  @state() _loading = false
  setLoading(loading: boolean) {
    this._loading = loading
  }

  connectedCallback(): void {
    super.connectedCallback()
    for (const [name, elConstructor] of Object.entries(COMPONENTS)) {
      if (!customElements.get(name)) {
        customElements.define(name, elConstructor)
      }
    }
  }

  firstUpdated() {
    this.#openDialog()

    this.screenRef.value!.addEventListener('close', this.#onInstallScreenClose)
    this.dialogRef.value!.addEventListener('cancel', (ev) => {
      if (this._screen === 'install-required') {
        this.#onInstallScreenClose(ev)
        return
      }
      ev.preventDefault()
    })
  }

  render() {
    return html`
      <dialog ${ref(this.dialogRef)}>
        ${this.#renderScreen(this._screen)}
      </dialog>
    `
  }

  #renderScreen(screen: Screen) {
    switch (screen) {
      case 'install-required':
        return html`
          <wm-offerwall-install-required
            ${ref(this.screenRef)}
          ></wm-offerwall-install-required>
        `
      case 'all-set':
        return html`
          <wm-offerwall-all-set ${ref(this.screenRef)}></wm-offerwall-all-set>
        `
      case 'contribution-required':
        return html`
          <wm-offerwall-contribution-required
            ${ref(this.screenRef)}
          ></wm-offerwall-contribution-required>
        `
    }
  }

  #onInstallScreenClose(ev: MouseEvent | Event) {
    this.#controller.onModalClose(ev)
    if (ev.defaultPrevented) return
    this.#closeDialog()
  }

  dialogRef: Ref<HTMLDialogElement> = createRef()
  screenRef: Ref<HTMLElement> = createRef()

  #openDialog() {
    this.dialogRef.value!.showModal()
  }

  #closeDialog() {
    this.dialogRef.value!.close()
    this.dialogRef.value!.remove()
  }
}
