import { html, LitElement, unsafeCSS } from 'lit'
import { property } from 'lit/decorators.js'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import icon from '@c/assets/lock_outline.svg?raw'
import stylesCommon from './common.css?raw'
import styles from './home.css?raw'
import { DEFAULTS } from '../utils'
import styleTokens from '../vars.css?raw'

export class PaywallHome extends LitElement {
  static styles = [
    unsafeCSS(styleTokens),
    unsafeCSS(stylesCommon),
    unsafeCSS(styles),
  ]

  @property({ type: Object, attribute: false })
  price: PaymentCurrencyAmount = DEFAULTS.price

  @property({ type: String }) title = DEFAULTS.title.text
  @property({ type: String }) description = DEFAULTS.description.text
  @property({ type: String }) ctaText = DEFAULTS.ctaButton.text

  render() {
    return html`
      <div class="top">
        <h2 class="title">${this.title}</h2>
        <p class="description">${this.description}</p>
        <p class="description">
          <button
            type="button"
            class="wallet-link"
            @click=${this.onWalletLinkClick}
          >
            Already paid? Enter your wallet address
          </button>
          to access this content for free.
        </p>
      </div>

      <span class="img">${unsafeSVG(icon)}</span>

      <div class="bottom">
        <div class="price">
          <span>Unlock</span> <span>${renderPrice(this.price)}</span>
        </div>
        <button type="button" @click=${this.onClick}>${this.ctaText}</button>
      </div>
    `
  }

  private onClick() {
    this.dispatchEvent(new CustomEvent('payStart'))
  }

  private onWalletLinkClick() {
    this.dispatchEvent(new CustomEvent('payStart'))
  }
}

function renderPrice(price: PaymentCurrencyAmount) {
  const parts = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price.currency,
  }).formatToParts(Number(price.value))
  return parts.map((p) =>
    p.type === 'currency'
      ? html`<span class="currency">${p.value}</span>`
      : p.value,
  )
}
