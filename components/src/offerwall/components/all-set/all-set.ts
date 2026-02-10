import { LitElement, html, unsafeCSS } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import iconCheck from '@c/assets/icon_check.svg?raw'
import { PoweredByInterledger } from '@c/shared/powered-by-interledger'
import { WebMonetizationHeader } from '@c/shared/web-monetization-header'
import styles from './all-set.css?raw'
import styleTokens from '../../vars.css?raw'

export class AllSet extends LitElement {
  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  connectedCallback(): void {
    super.connectedCallback()
    if (!customElements.get('powered-by-interledger')) {
      customElements.define('powered-by-interledger', PoweredByInterledger)
    }
    if (!customElements.get('wm-header')) {
      customElements.define('wm-header', WebMonetizationHeader)
    }
  }

  render() {
    return html`
      <div class="container">
        <wm-header></wm-header>

        <h2>You’re all set!</h2>

        <span class="icon">${unsafeSVG(iconCheck)}</span>

        <p>You're now supporting the content you love</p>
        <p>
          Whether continuous or one time support, the extension allows you to
          enjoy this content.
        </p>

        <p class="strong">
          Find out more on
          <a href="https://webmonetization.org" target="_blank"
            >webmonetization.org</a
          >
        </p>

        <button type="button" @click=${this.#onCloseButtonClick}>Close</button>

        <div class="footer">
          <powered-by-interledger></powered-by-interledger>
        </div>
      </div>
    `
  }

  #onCloseButtonClick = () => {
    const event = new CustomEvent('all-set-done', { cancelable: true })
    this.dispatchEvent(event)
  }
}
