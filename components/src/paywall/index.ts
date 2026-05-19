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
import { PaywallVerify } from './components/verify.js'
import styles from './styles.css?raw'
import styleTokens from './vars.css?raw'

export class Paywall extends LitElement {
  #config!: Awaited<ReturnType<Controller['fetchConfig']>>
  #entitlement!: Awaited<ReturnType<Controller['checkEntitlement']>>

  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  @property({ type: Boolean, reflect: true }) hidden = true
  @state() _ready = false
  @state() _screen: ViewInfo = { type: 'home', data: undefined }

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
      this.#controller.checkEntitlement(''),
    ])

    this.#config = config
    this.#price ||= config.price.value
    this.#entitlement = entitlement
    this.setBaseStyles()
    this._ready = true
    void this.showAfterDelay(connectedAt).then(() => {
      this.hidden = false
    })
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
      // @ts-expect-error weird
      setScreen: (...args) => this.#setScreen(...args),
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

  render() {
    if (!this._ready) return nothing
    if (this.#entitlement === 'has-access') return nothing
    if (!this._delayComplete) return nothing

    const { title, description, ctaButton, price } = this.#config

    if (this._screen.type === 'form') {
      return html`<wmt-paywall-form
        .title=${title.text}
        .description=${description.text}
        .ctaButton=${ctaButton.text}
        @submit=${this.#onSubmit}
      ></wmt-paywall-form>`
    }

    if (this._screen.type === 'verify') {
      return html`<wmt-paywall-verify
        .title=${title.text}
        .description=${description.text}
        .sender=${this._screen.data.sender}
        .paymentId=${this._screen.data.paymentId}
        .controller=${this.#controller}
      ></wmt-paywall-verify>`
    }

    return html`<wmt-paywall-home
      .price=${{ value: this.#price, currency: price.currency }}
      .title=${title.text}
      .description=${description.text}
      .ctaButton=${ctaButton.text}
      @payStart=${this.#onPayStart}
    ></wmt-paywall-home>`
  }

  async #onPayStart() {
    this.#setScreen('form', {})
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
    if (status === 'auth-required') {
      await this.#controller.validateWalletOwnership(sender)
    }

    await this.#controller.initiatePayment({
      sender,
      receiver,
      amount: this.#price,
      note: this.defaultNote,
    })
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

  #setScreen<K extends keyof View>(view: K, data: View[K]) {
    this._screen = { type: view, data } as ViewInfo
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
    this.style.setProperty('--wmt-font-size', getBaseFontSize(font.size))
    this.style.setProperty('--wmt-height', `${coverage.value}vh`)
    this.style.setProperty('--wmt-background', colors.background as string)
    this.style.setProperty('--wmt-theme', colors.theme as string)
    this.style.setProperty('--wmt-color', colors.text)
    this.style.setProperty('--wmt-border-radius', BORDER_RADIUS[border.type])
  }
}

function getBaseFontSize(fontSize: PaywallProfile['font']['size']) {
  return `${PAYWALL_FONT_SIZE_MAP[fontSize] || PAYWALL_FONT_SIZE_MAP['base']}px`
}
