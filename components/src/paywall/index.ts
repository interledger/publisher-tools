import { html, LitElement, nothing, unsafeCSS } from 'lit'
import { state } from 'lit/decorators.js'
import { type Controller, NO_OP_CONTROLLER } from '@c/paywall/controller'
import styles from './styles.css?raw'
import styleTokens from './vars.css?raw'

export class Paywall extends LitElement {
  #config!: Awaited<ReturnType<Controller['fetchConfig']>>
  #entitlement!: Awaited<ReturnType<Controller['checkEntitlement']>>

  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  @state() _ready = false

  connectedCallback(): void {
    super.connectedCallback()

    if (this.#controller === NO_OP_CONTROLLER) {
      throw new Error('setController() before mount')
    }

    void this.#init()
  }

  async #init() {
    const [config, entitlement] = await Promise.all([
      this.#controller.fetchConfig(),
      this.#controller.checkEntitlement(''),
    ])

    this.#config = config
    this.#entitlement = entitlement
    this._ready = true
  }

  #controller = NO_OP_CONTROLLER
  setController(controller: Controller) {
    if (this.#controller === controller) return
    if (this.#controller !== NO_OP_CONTROLLER) {
      throw new Error('controller is already set')
    }
    this.#controller = controller
  }

  #price = ''
  setPrice(price: string) {
    if (this.#price === '' || this.#controller.isPreviewMode) {
      this.#price = price
    } else {
      throw new Error('Price is already set')
    }
  }

  render() {
    if (!this._ready) return nothing
    if (this.#entitlement === 'has-access') return nothing

    return html`<pre>${JSON.stringify(this.#config)}</pre>`
  }
}
