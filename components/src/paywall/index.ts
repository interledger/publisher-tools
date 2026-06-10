import { html, LitElement, nothing, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import {
  NO_OP_CONTROLLER,
  type Controller,
  type Actions,
  type View,
  type ViewInfo,
} from '@c/paywall/controller'
import { applyFontFamily, registerComponents } from '@c/utils.js'
import {
  BORDER_RADIUS,
  PAYWALL_FONT_SIZE_MAP,
  type PaywallProfile,
} from '@shared/types'
import { sleep } from '@shared/utils'
import {
  PaywallWalletAddressForm,
  type FormSubmitEventDetail,
} from './components/form.js'
import { PaywallHome } from './components/home.js'
import { PaywallVerify, type PaymentVerifyEvents } from './components/verify.js'
import styles from './styles.css?raw'
import styleTokens from './vars.css?raw'

export class Paywall extends LitElement {
  #config!: Awaited<ReturnType<Controller['fetchConfig']>>
  #entitlement!: Awaited<ReturnType<Controller['checkEntitlement']>>

  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  @property({ type: Boolean, reflect: true }) hidden = true
  @state() _ready = false
  @state() _view: ViewInfo = { type: 'home', data: undefined }

  connectedCallback(): void {
    super.connectedCallback()

    if (this.#controller === NO_OP_CONTROLLER) {
      throw new Error('setController() before mount')
    }

    registerComponents({
      'wmt-paywall-home': PaywallHome,
      'wmt-paywall-form': PaywallWalletAddressForm,
      'wmt-paywall-verify': PaywallVerify,
    })

    void this.#init()
  }

  async #init() {
    const connectedAt = Date.now()

    const [config, entitlement] = await Promise.all([
      this.#controller.fetchConfig(),
      this.#controller.checkEntitlement(),
    ])

    this.#config = config
    this.#price ||= config.price.value
    this.#entitlement = entitlement
    this.setBaseStyles()
    this._ready = true
    void this.showAfterDelay(connectedAt).then(() => {
      this.hidden = false
    })
    if (entitlement.entitlement === 'auth-required') {
      this.#setView('form', {
        walletAddress: this.#controller.senderWalletAddressUrl ?? undefined,
        isAuthMode: true,
      })
    } else if (entitlement.entitlement === 'has-access') {
      this.#hidePaywall()
    } else if (entitlement.entitlement === 'pending') {
      this.#setView('verify', { paymentId: entitlement.paymentId! })
    }
  }

  #controller = NO_OP_CONTROLLER
  setController(controller: Controller): Actions {
    // @ts-expect-error We want to return action first time only, ideally.
    if (this.#controller === controller) return
    if (this.#controller !== NO_OP_CONTROLLER) {
      throw new Error('controller is already set')
    }
    this.#controller = controller
    return {
      setView: (...args) => {
        // @ts-expect-error weird
        this.#setView(...args)
      },
    }
  }

  #price = ''
  setPrice(price: string) {
    if (this.#price === '' || this.#controller.isPreviewMode) {
      this.#price = price
    } else {
      throw new Error('Price is already set')
    }
  }

  /** To be used with preview mode only */
  updateUI(conf: PaywallProfile) {
    if (this.#controller.isPreviewMode) {
      this.#config = conf
      this.setPrice(conf.price.value)
      this.setBaseStyles()
      this.requestUpdate()
    }
  }

  render() {
    if (!this._ready) return nothing
    if (this.#entitlement.entitlement === 'has-access') return nothing
    if (!this._delayComplete) return nothing

    const { title, description, ctaButton, price } = this.#config

    if (this._view.type === 'form') {
      return html`<wmt-paywall-form
        .title=${title.text}
        .description=${description.text}
        .ctaText=${ctaButton.text}
        .walletAddressUrl=${this._view.data.walletAddress}
        @submit=${this.#onSubmit}
      ></wmt-paywall-form>`
    }

    if (this._view.type === 'verify') {
      return html`<wmt-paywall-verify
        .title=${title.text}
        .description=${description.text}
        .sender=${this._view.data.sender}
        .paymentId=${this._view.data.paymentId}
        .controller=${this.#controller}
        @payment_confirmed=${this.#onPaymentConfirmed}
      ></wmt-paywall-verify>`
    }

    return html`<wmt-paywall-home
      .price=${{ value: this.#price, currency: price.currency }}
      .title=${title.text}
      .description=${description.text}
      .ctaText=${ctaButton.text}
      @payStart=${this.#onPayStart}
    ></wmt-paywall-home>`
  }

  async #onPayStart() {
    this.#setView('form', {
      walletAddress: this.#controller.senderWalletAddressUrl ?? undefined,
    })
    void this.#getReceiver() // pre-fetch
  }

  async #onSubmit(ev: CustomEvent<FormSubmitEventDetail>) {
    const { walletAddress, onComplete } = ev.detail
    try {
      await this.#handleSubmit(walletAddress)
      onComplete()
    } catch (err) {
      const error = err as Error
      onComplete(error.message)
    }
  }

  async #handleSubmit(walletAddress: string) {
    const sender = await this.#controller.getWallet(walletAddress)
    const receiver = await this.#getReceiver()

    const status = await this.#controller.checkEntitlement(sender)
    if (status.entitlement === 'has-access') {
      this.#hidePaywall()
      return
    }
    if (status.entitlement === 'auth-required') {
      this.#setView('form', { isAuthMode: true })
      await this.#controller.authenticate(sender)
      return
    }
    if (status.entitlement === 'pending') {
      this.#setView('verify', { paymentId: status.paymentId!, sender })
      return
    }

    await this.#controller.initiatePayment({
      sender,
      receiver,
      amount: this.#price,
      note: this.defaultNote,
    })
  }

  async #onPaymentConfirmed(
    ev: CustomEvent<PaymentVerifyEvents['payment_confirmed']>,
  ) {
    const sender = ev.detail.sender
    const status = await this.#controller.checkEntitlement(sender)
    if (status.entitlement === 'has-access') {
      this.#hidePaywall()
      return
    }
  }

  #hidePaywall() {
    this.dispatchEvent(new CustomEvent('paywall_hide'))
    this.#controller.remove(this)
  }

  #receiver_!: ReturnType<Controller['getWallet']>
  #getReceiver() {
    if (!this.#receiver_) {
      const walletAddress = this.#controller.receiverWalletAddressUrl
      this.#receiver_ = this.#controller.getWallet(walletAddress)
    }
    return this.#receiver_
  }

  get defaultNote() {
    return `Pay Per Article service`
  }

  #setView<K extends keyof View>(view: K, data: View[K]) {
    this._view = { type: view, data } as ViewInfo
    this.#controller.onScreenChange?.(view)
  }

  @state() _delayComplete = false
  private async showAfterDelay(connectedAt: number) {
    const delay = this.#config.behavior.delay.value * 1000
    const elapsed = Date.now() - connectedAt
    await sleep(delay - elapsed)
    this._delayComplete = true
  }

  private setBaseStyles() {
    const {
      border,
      font,
      colors,
      behavior: { coverage },
    } = this.#config

    const fontBaseUrl = new URL('/assets/fonts/', this.#controller.cdnUrl).href
    applyFontFamily(this, font.name, 'paywall', fontBaseUrl)
    this.style.setProperty('--wmt-font-scale', getBaseFontScale(font.size))
    this.style.setProperty('--wmt-height', `${coverage.value}vh`)
    this.style.setProperty('--wmt-background', colors.background as string)
    this.style.setProperty('--wmt-theme', colors.theme as string)
    this.style.setProperty('--wmt-color', colors.text)
    this.style.setProperty('--wmt-border-radius', BORDER_RADIUS[border.type])
  }
}

function getBaseFontScale(fontSize: PaywallProfile['font']['size']) {
  const size = PAYWALL_FONT_SIZE_MAP[fontSize] || PAYWALL_FONT_SIZE_MAP.base
  return (size / 16).toString()
}
