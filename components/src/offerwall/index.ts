import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { html, LitElement, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import { createRef, ref, type Ref } from 'lit/directives/ref.js'
import { applyFontFamily } from '@c/utils.js'
import {
  BORDER_RADIUS,
  type FontFamilyKey,
  type CornerType,
  type OfferwallProfile,
} from '@shared/types'
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

interface OfferwallConfig {
  profile: OfferwallProfile
  cdnUrl: string
}

export class OfferwallModal extends LitElement {
  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  private profileController = new OfferwallController(this)

  @property({ type: Object })
  set config(value: Partial<OfferwallConfig>) {
    this.profileController.updateProfile(value)
  }
  get config() {
    return this.profileController.config
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
  }

  render() {
    const isPreviewMode = !!this.#controller.isPreviewMode
    return html`
      <dialog
        ${ref(this.#dialogRef)}
        @cancel=${this.#onDialogCancel}
        ?data-preview=${isPreviewMode}
      >
        ${this.#renderScreen(this._screen)}
      </dialog>
    `
  }

  #renderScreen(screen: Screen) {
    switch (screen) {
      case 'install-required':
        return html`
          <wm-offerwall-install-required
            @close=${this.#onInstallScreenClose}
            @click-extension-link=${this.#onExtensionLinkClick}
          ></wm-offerwall-install-required>
        `
      case 'all-set':
        return html`
          <wm-offerwall-all-set
            @all-set-done=${this.#onAllSetDone}
          ></wm-offerwall-all-set>
        `
      case 'contribution-required':
        return html`
          <wm-offerwall-contribution-required></wm-offerwall-contribution-required>
        `
    }
  }

  #onDialogCancel = (ev: Event) => {
    if (this._screen === 'install-required') {
      return this.#onInstallScreenClose(ev)
    }
    if (this._screen === 'all-set') {
      return this.#onAllSetDone(ev)
    }
    ev.preventDefault()
  }

  #onInstallScreenClose = (ev: MouseEvent | Event) => {
    this.#controller.onModalClose(ev)
    if (ev.defaultPrevented) return
    this.#closeDialog()
  }

  #onExtensionLinkClick = (ev: Event) => {
    this.#controller.onExtensionLinkClick(ev)
    if (ev.defaultPrevented) return
  }

  #onAllSetDone = (ev: Event) => {
    this.#controller.onDone(ev)
    if (ev.defaultPrevented) return
    this.#closeDialog()
  }

  #dialogRef: Ref<HTMLDialogElement> = createRef()
  #openDialog() {
    if (this.#controller.isPreviewMode) {
      this.#dialogRef.value!.show()
      return
    }
    this.#dialogRef.value!.showModal()
  }
  #closeDialog = () => {
    this.#dialogRef.value!.close()
    this.#dialogRef.value!.remove()
  }
}

class OfferwallController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private _config!: OfferwallConfig

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host
    host.addController(this)
  }

  /** called when the host is connected to the DOM */
  hostConnected(): void {}

  /** called when the host is disconnected from the DOM */
  hostDisconnected(): void {}

  get config(): OfferwallConfig {
    return this._config
  }

  updateProfile(updates: Partial<OfferwallConfig>) {
    this._config = { ...this._config, ...updates }

    if (updates.profile?.border?.type) {
      this.applyBorderRadius(updates.profile.border.type)
    }

    if (updates.profile?.font?.name) {
      this.applyFontFamily(updates.profile.font.name)
    }

    if (updates.profile?.color) {
      this.applyTheme()
    }

    this.host.requestUpdate()
  }

  private applyBorderRadius(borderRadius: CornerType) {
    const borderRadiusValue = BORDER_RADIUS[borderRadius]
    this.host.style.setProperty('--wm-border-radius', borderRadiusValue)
  }

  private applyFontFamily(fontName: FontFamilyKey) {
    const fontBaseUrl = new URL('/assets/fonts/', this.config.cdnUrl).href
    applyFontFamily(this.host, fontName, 'banner', fontBaseUrl)
  }

  private applyTheme() {
    const element = this.host
    const { color } = this.config.profile
    if (color?.text) {
      element.style.setProperty('--wm-text-color', color.text)
    }
    if (color?.background) {
      element.style.setProperty('--wm-background', color.background as string)
    }
    if (color?.headline) {
      element.style.setProperty('--wm-headline-color', color.headline)
    }
    if (color?.theme) {
      element.style.setProperty('--wm-accent-color', color.theme as string)
    }
  }
}
