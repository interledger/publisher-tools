import { LitElement, html, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import walletTotemIcon from '@c/assets/wm_wallet_totem.svg'
import { CloseBtn } from '@c/shared/components/close-btn'
import { DotsLoader } from '@c/shared/components/dots-loader'
import styles from './home.css?raw'

const DEFAULT_TITLE = 'Future of support'
const DEFAULT_DESCRIPTION =
  'Experience the new way to support our content. Activate Web Monetization in your browser. Every visit helps us keep creating the content you love! You can also support us by a one time donation below!'
const DEFAULT_CTA_TEXT = 'Support me'

const COMPONENTS = {
  'wm-dots-loader': DotsLoader,
  'wm-close-btn': CloseBtn,
}

export interface SubmitEventDetail {
  walletAddress: string
  onComplete: (error?: string) => void
}

export class HomeView extends LitElement {
  @property({ type: String }) title = DEFAULT_TITLE
  @property({ type: String }) ctaText = ''
  @property({ type: String }) description = DEFAULT_DESCRIPTION
  @property({ type: Boolean }) showDescription = true
  @property({ type: String }) backgroundColor = '#fff'

  @state() private _walletAddress = ''
  @state() private _error = ''
  @state() private _isSubmitting = false

  static styles = unsafeCSS(styles)

  connectedCallback(): void {
    super.connectedCallback()
    for (const [name, elConstructor] of Object.entries(COMPONENTS)) {
      if (!customElements.get(name)) {
        customElements.define(name, elConstructor)
      }
    }
  }

  private triggerClose() {
    this.dispatchEvent(new CustomEvent('close'))
  }

  private onSubmit(ev: SubmitEvent) {
    ev.preventDefault()

    const formData = new FormData(ev.target as HTMLFormElement)
    const walletAddress = String(formData.get('walletAddress') ?? '')

    this._isSubmitting = true
    this.dispatchEvent(
      new CustomEvent<SubmitEventDetail>('submit', {
        detail: {
          walletAddress,
          onComplete: (error) => {
            this._isSubmitting = false
            this._error = error ?? ''
          },
        },
      }),
    )
  }

  private onInput() {
    this._error = ''
  }

  render() {
    const hasError = !!this._error

    const descriptionElement = this.showDescription
      ? html`<p>${this.description ?? DEFAULT_DESCRIPTION}</p>`
      : html`<div class="divider" />`

    return html`
      <div class="widget-header-container">
        <div class="widget-header">
          <img src=${walletTotemIcon} alt="header wallet totem" />
          <p class="white-text">${this.title || DEFAULT_TITLE}</p>
        </div>

        <wm-close-btn
          @click=${this.triggerClose}
          .color=${this.backgroundColor}
        ></wm-close-btn>
      </div>

      <form class="payment-form widget-body" @submit=${this.onSubmit}>
        ${descriptionElement}

        <div class="form-wallet-address">
          <label class="form-label">
            Pay from
            <span class="red-text"> * </span>
          </label>

          <input
            class="form-input"
            type="text"
            name="walletAddress"
            placeholder="Enter your wallet address"
            @input=${this.onInput}
            .value=${this._walletAddress}
            ?disabled=${this._isSubmitting}
            aria-invalid=${hasError}
            aria-describedby=${hasError ? 'wallet-error' : ''}
          />

          <div
            id="wallet-error"
            class="error-message"
            role="alert"
            aria-live="polite"
          >
            ${this._error}
          </div>
        </div>

        <button
          class="primary-button"
          type="submit"
          ?disabled=${this._isSubmitting}
        >
          ${this._isSubmitting
            ? html`<wm-dots-loader></wm-dots-loader>`
            : this.ctaText || DEFAULT_CTA_TEXT}
        </button>
      </form>
    `
  }
}
