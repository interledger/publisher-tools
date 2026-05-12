/* eslint-disable no-unused-private-class-members */
import { html, LitElement, nothing, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { WalletAddressInfo } from 'publisher-tools-api'
import { type Controller, NO_OP_CONTROLLER } from '@c/paywall/controller'
import { registerComponents } from '@c/utils.js'
import {
  BORDER_RADIUS,
  PAYWALL_FONT_SIZE_MAP,
  type PaywallProfile,
} from '@shared/types'
import { sleep } from '@shared/utils'
import { PaywallHome } from './components/home.js'
import styles from './styles.css?raw'
import styleTokens from './vars.css?raw'

export class Paywall extends LitElement {
  #config_!: Promise<PaywallProfile>
  #config!: PaywallProfile

  #receiver!: Promise<WalletAddressInfo>

  #entitlement_!: ReturnType<Controller['checkEntitlement']>
  #entitlement!: Awaited<ReturnType<Controller['checkEntitlement']>>

  // Used to find delay in showing paywall
  #connectedAt!: ReturnType<(typeof Date)['now']>

  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  @property({ type: Boolean, reflect: true }) hidden = true
  @state() _ready = false

  connectedCallback(): void {
    super.connectedCallback()

    if (this.#controller === NO_OP_CONTROLLER) {
      throw new Error('setController() before mount')
    }
    if (!this.#price) {
      throw new Error('Price is not set')
    }

    this.#connectedAt = Date.now()
    registerComponents({
      'wmt-paywall-home': PaywallHome,
    })

    this.#receiver = this.#controller.getWallet(
      this.#controller.receiverWalletAddressUrl,
    )

    this.#config_ = this.#controller.fetchConfig().then(async (conf) => {
      this.#config = conf
      this.#price ||= conf.price.value
      await this.showAfterDelay()
      return conf
    })
    this.#entitlement_ = this.#controller.checkEntitlement('').then((res) => {
      this.#entitlement = res
      return Promise.resolve(res)
    })
    Promise.all([this.#config_, this.#entitlement_]).then(() => {
      this._ready = true
      this.setBaseStyles()
      this.hidden = false
    })
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
    if (!this._delayComplete) return nothing

    const { title, description, ctaButton, price } = this.#config

    return html`<wmt-paywall-home
      .price=${{ value: this.#price, currency: price.currency }}
      .title=${title.text}
      .description=${description.text}
      .ctaButton=${ctaButton.text}
    ></wmt-paywall-home>`
  }

  @state() _delayComplete = false
  private async showAfterDelay() {
    const delay = this.#config.behavior.delay.value * 1000
    const elapsed = Date.now() - this.#connectedAt
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

    this.style.setProperty('--wmt-font-family', font.name)
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
