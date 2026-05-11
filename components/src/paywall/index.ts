/* eslint-disable no-unused-private-class-members */
import { html, LitElement, nothing, unsafeCSS } from 'lit'
import { state } from 'lit/decorators.js'
import type { WalletAddressInfo } from 'publisher-tools-api'
import { type Controller, NO_OP_CONTROLLER } from '@c/paywall/controller'
import type { PaywallProfile } from '@shared/types'
import styles from './styles.css?raw'
import styleTokens from './vars.css?raw'

export class Paywall extends LitElement {
  #config_!: Promise<PaywallProfile>
  #config!: PaywallProfile
  #receiver!: Promise<WalletAddressInfo>

  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  @state() _configReady = false

  connectedCallback(): void {
    super.connectedCallback()

    if (this.#controller === NO_OP_CONTROLLER) {
      throw new Error('setController() before mount')
    }
    if (!this.#price) {
      throw new Error('Price is not set')
    }

    this.#config_ = this.#controller.fetchConfig().then((conf) => {
      this.#config = conf
      this._configReady = true
      return Promise.resolve(conf)
    })
    this.#receiver = this.#controller.getWallet(
      this.#controller.receiverWalletAddressUrl,
    )
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
    if (!this._configReady) return nothing

    return html`<pre>${JSON.stringify(this.#config)}</pre>`
  }
}
