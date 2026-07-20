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
  @property({ type: Object }) sender?: WalletAddressInfo

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
    void this.#startVerify().catch((err) => {
      console.error('Payment verification failed', err)
      this.#fail('VERIFY_FAILED')
    })
  }

  render() {
    return html`
      <div class="top">
        <h2 class="title">${this.title}</h2>
        <p class="description">${this.description}</p>
      </div>

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
      if (status.type === 'PAYMENT_DONE' && status.result === 'success') {
        const detail: Events['payment_confirmed'] = {
          paymentId: this.paymentId,
          sender: this.sender,
        }
        this.dispatchEvent(new CustomEvent('payment_confirmed', { detail }))
        break
      }
      if (status.type === 'PAYMENT_DONE' || status.type === 'GRANT_REJECTED') {
        let errorCode = 'UNKNOWN'
        if (status.type === 'GRANT_REJECTED') {
          errorCode = status.type
        } else if (status.error?.code) {
          errorCode = status.error.code
        }
        this.#fail(errorCode)
        break
      }
      throw new Error('Invalid payment status')
    }
  }

  #fail(errorCode: string) {
    const detail: Events['payment_failed'] = {
      paymentId: this.paymentId,
      sender: this.sender,
      errorCode,
    }
    this.dispatchEvent(new CustomEvent('payment_failed', { detail }))
  }
}

type Events = {
  payment_confirmed: {
    paymentId: string
    sender?: WalletAddressInfo
  }
  payment_failed: {
    paymentId: string
    sender?: WalletAddressInfo
    errorCode: string
  }
}
export type { Events as PaymentVerifyEvents }
