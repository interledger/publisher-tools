import { LitElement, html, unsafeCSS } from 'lit'
import { property } from 'lit/decorators.js'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import lockWithGradient from '@c/assets/lock_with_gradient.svg?raw'
import { PoweredByInterledger } from '@c/shared/powered-by-interledger'
import { WebMonetizationHeader } from '@c/shared/web-monetization-header'
import styles from './contribution-required.css?raw'
import styleTokens from '../../vars.css?raw'

export class ContributionRequired extends LitElement {
  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  @property({ type: Function }) onDone: (ev: MouseEvent) => void = () => {}

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

        <h2>Oops!</h2>

        <span class="icon">${unsafeSVG(lockWithGradient)}</span>

        <p class="cta-heading">A small contribution unlocks great content</p>

        <p>
          Make a one-time or continuous contribution using the Web Monetization
          extension to keep consuming and supporting this content.
        </p>

        <p class="strong footer">
          Find out more on
          <a href="https://webmonetization.org" target="_blank"
            >webmonetization.org</a
          >
        </p>

        <div class="footer">
          <powered-by-interledger></powered-by-interledger>
        </div>
      </div>
    `
  }
}
