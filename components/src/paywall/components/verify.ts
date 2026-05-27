import { html, LitElement, unsafeCSS } from 'lit'
import { property } from 'lit/decorators.js'
import type { WalletAddressInfo } from 'publisher-tools-api'
import { DotsLoader } from '@c/shared/dots-loader'
import { registerComponents } from '@c/utils'
import stylesCommon from './common.css?raw'
import styles from './verify.css?raw'
import { type Controller, NO_OP_CONTROLLER } from '../controller'
import { DEFAULTS } from '../utils'
import styleTokens from '../vars.css?raw'

export class PaywallVerify extends LitElement {
  static styles = [
    unsafeCSS(styleTokens),
    unsafeCSS(stylesCommon),
    unsafeCSS(styles),
  ]

  @property({ type: String }) title = DEFAULTS.title.text
  @property({ type: String }) description = DEFAULTS.description.text
  @property({ type: String }) paymentId!: string
  @property({ type: Object }) sender!: WalletAddressInfo

  connectedCallback() {
    super.connectedCallback()
    registerComponents({
      'wm-dots-loader': DotsLoader,
    })
  }

  #controller = NO_OP_CONTROLLER
  @property({ type: Object, attribute: false })
  set controller(controller: Controller) {
    if (this.#controller === controller) return
    if (this.#controller !== NO_OP_CONTROLLER) {
      throw new Error('controller is already set')
    }
    this.#controller = controller
  }

  firstUpdated() {
    void this.#startVerify()
  }

  render() {
    return html`
      <h2 class="title">${this.title}</h2>
      <p class="description">${this.description}</p>

      <div class="spinner">
        <wm-dots-loader></wm-dots-loader>
        <p>Verifying payment</p>
      </div>
    `
  }

  async #startVerify() {
    for await (const status of this.#controller.getStatus(this.paymentId)) {
      if (status.type === 'PAYMENT_CREATED') {
        // keep Verifying
        continue
      }
      if (status.type === 'PAYMENT_DONE') {
        // emit done
        break
      }
      throw new Error('Invalid payment status')
    }

    const entitlement = await this.#controller.checkEntitlement(this.sender)
    if (entitlement === 'has-access') {
      // dispatch hide paywall
    } else if (entitlement === 'auth-required') {
      // possible??
    } else if (entitlement === 'no-access') {
      // possible??
    }
  }
}
