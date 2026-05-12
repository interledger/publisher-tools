import { html, LitElement, unsafeCSS } from 'lit'
import { property } from 'lit/decorators.js'
import { createDefaultPaywallProfile } from '@shared/default-data'
import { formatCurrency } from '@shared/utils'
import styles from './home.css?raw'
import styleTokens from '../vars.css?raw'

const DEFAULTS = createDefaultPaywallProfile('')

export class PaywallHome extends LitElement {
  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  @property({ type: Object, attribute: false })
  price: PaymentCurrencyAmount = DEFAULTS.price

  @property({ type: String }) title = DEFAULTS.title.text
  @property({ type: String }) description = DEFAULTS.description.text
  @property({ type: String }) ctaText = DEFAULTS.ctaButton.text

  render() {
    return html`
      <h2 class="title">${this.title}</h2>
      <p class="description">${this.description}</p>

      <div class="price">
        <span>Unlock</span> <span>${formatCurrency(this.price)}</span>
      </div>
      <button type="button">${this.ctaText}</button>
      <p class="footer">Secured by Open Payments. No card needed</p>
    `
  }
}
