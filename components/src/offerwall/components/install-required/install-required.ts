import { LitElement, html, unsafeCSS } from 'lit'
import { property } from 'lit/decorators.js'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import iconCheckDone from '@c/assets/icon_check_done.svg?raw'
import iconExtension from '@c/assets/icon_extension.svg?raw'
import iconWallet from '@c/assets/icon_wallet.svg?raw'
import iconClose from '@c/assets/icon_x_close.svg?raw'
import { PoweredByInterledger } from '@c/shared/powered-by-interledger'
import { WebMonetizationHeader } from '@c/shared/web-monetization-header'
import { getWebMonetizationLinkHref } from '@c/utils'
import styles from './install-required.css?raw'
import styleTokens from '../../vars.css?raw'

const TITLE = 'Web Monetization'
const HEADER_TEXT = `Get the Web Monetization Extension to be able to support us`
const STEP_1 = `You'll need a Web Monetization compatible wallet to use with the extension.`
const STEP_2 = `Install the Web Monetization extension from your browser's web store. This includes getting and/or connecting to your wallet.`
const STEP_3 = `All set! You can control how and when to support us from the extension settings.`
const BUTTON_CTA = 'Install the Web Monetization Extension'

export class InstallRequired extends LitElement {
  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  @property({ type: Function }) onExtensionLinkClick: (ev: MouseEvent) => void =
    () => {}

  constructor() {
    super()
  }

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
        <wm-header title="${TITLE}" size="large"></wm-header>

        <h2>${HEADER_TEXT}</h2>

        <ol class="steps">
          <li>
            <span class="step-content">
              <span class="step-icon">${unsafeSVG(iconWallet)}</span>
              <span>${STEP_1}</span>
            </span>
          </li>
          <li>
            <span class="step-content">
              <span class="step-icon">${unsafeSVG(iconExtension)}</span>
              <span>${STEP_2}</span>
            </span>
            <a
              class="button"
              href="${this.extensionUrl}"
              target="_blank"
              @click=${this.onExtensionLinkClick}
              >${BUTTON_CTA}</a
            >
          </li>
          <li>
            <span class="step-content">
              <span class="step-icon">${unsafeSVG(iconCheckDone)}</span>
              <span>${STEP_3}</span>
            </span>
          </li>
        </ol>

        <div class="footer">
          <p class="semi-bold">
            <span
              >Find out more on
              <a href="https://webmonetization.org"
                >webmonetization.org</a
              ></span
            >
          </p>

          <powered-by-interledger></powered-by-interledger>
        </div>

        <button
          type="button"
          @click=${() =>
            this.dispatchEvent(new CustomEvent('close', { cancelable: true }))}
        >
          <span aria-hidden="true" tabindex="-1">${unsafeSVG(iconClose)}</span>
          <span class="sr-only">Close</span>
        </button>
      </div>
    `
  }

  get extensionUrl(): string {
    const url = new URL(getWebMonetizationLinkHref(navigator.userAgent))
    url.searchParams.set('utm_source', window.location.origin)
    url.searchParams.set('utm_medium', 'offerwall-embed')
    return url.href
  }
}
