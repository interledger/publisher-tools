import { html, LitElement, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import icon from '@c/assets/lock_outline.svg?raw'
import { DotsLoader } from '@c/shared/dots-loader'
import { registerComponents } from '@c/utils'
import stylesCommon from './common.css?raw'
import styles from './form.css?raw'
import { DEFAULTS } from '../utils'
import styleTokens from '../vars.css?raw'

export type FormSubmitEventDetail = {
  walletAddress: string
  onComplete(error?: string): void
}

export class PaywallWalletAddressForm extends LitElement {
  static styles = [
    unsafeCSS(styleTokens),
    unsafeCSS(stylesCommon),
    unsafeCSS(styles),
  ]

  @property({ type: String }) title = DEFAULTS.title.text
  @property({ type: String }) description = DEFAULTS.description.text
  @property({ type: String }) ctaText = 'Unlock'
  @property({ type: String }) walletAddressUrl = ''

  @state() private _error = ''
  @state() private _loading = false

  connectedCallback() {
    super.connectedCallback()
    registerComponents({
      'wm-dots-loader': DotsLoader,
    })
  }

  firstUpdated(): void {
    const input = this.renderRoot.querySelector('input')!
    if (this.walletAddressUrl) {
      input.value = this.walletAddressUrl
    }
    input.focus()
  }

  render() {
    return html`
      <div class="top">
        <h2 class="title">${this.title}</h2>
        <p class="description">${this.description}</p>
      </div>
      <span class="img">${unsafeSVG(icon)}</span>
      <div class="bottom">${this.#form}</div>
    `
  }

  get #form() {
    return html`
      <form @submit=${this.handleSubmit}>
        <label for="wallet-address-url"
          >Wallet address
          <span class="required" aria-hidden="true">*</span></label
        >
        <div class="field-row">
          <input
            type="text"
            id="wallet-address-url"
            name="walletAddress"
            placeholder="https://walletprovider.com/MyWallet"
            aria-invalid=${!!this._error}
            aria-describedby=${this._error ? 'wallet-address-url-error' : null}
            ?disabled=${this._loading}
            required
          />

          <button type="submit" ?disabled=${this._loading}>
            ${
              this._loading
                ? html`<wm-dots-loader></wm-dots-loader
                    ><span class="sr-only">${this.ctaText}</span>&nbsp;`
                : this.ctaText
            }
          </button>
        </div>
        <p id="wallet-address-url-error" class="error">${this._error}</p>
      </form>
    `
  }

  private async handleSubmit(ev: SubmitEvent) {
    ev.preventDefault()
    this._error = ''
    const formData = new FormData(ev.target as HTMLFormElement)
    const walletAddress = formData.get('walletAddress') as string

    if (!walletAddress) {
      this._error = 'Please enter a valid wallet address'
      return
    }

    this._loading = true
    const detail: FormSubmitEventDetail = {
      walletAddress,
      onComplete: (error) => {
        this._error = error || ''
        this._loading = false
      },
    }
    this.dispatchEvent(new CustomEvent('submit', { detail }))
  }
}
