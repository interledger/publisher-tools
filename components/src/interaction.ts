import { html, css, LitElement } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { CheckPaymentResult } from 'publisher-tools-api/src/utils/open-payments'
import type { WidgetController } from './widget'

export class PaymentInteraction extends LitElement {
  private _boundHandleMessage: (event: MessageEvent) => void = () => {}
  @property({ type: Object }) configController!: WidgetController
  @property({ type: Boolean }) requestPayment?: boolean = true
  @state() private currentView: 'authorizing' | 'success' | 'failed' =
    'authorizing'
  @state() private errorMessage = ''

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .interaction-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top: 3px solid var(--primary-color, #10b981);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .status-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .success-icon {
      background: #dcfce7;
      color: #16a34a;
    }

    .error-icon {
      background: #fef2f2;
      color: #dc2626;
    }

    .status-icon svg {
      width: 32px;
      height: 32px;
    }

    .status-title {
      margin: 0 0 8px 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color, #000);
    }

    .status-title.success {
      color: #16a34a;
    }

    .status-title.error {
      color: #dc2626;
    }

    .status-description {
      margin: 0 0 24px 0;
      font-size: 0.875rem;
      opacity: 0.7;
      color: var(--text-color, #000);
    }

    .error-code {
      font-weight: 600;
      color: #dc2626;
      font-size: 0.75rem;
      margin-bottom: 4px;
    }

    .error-message {
      color: #dc2626;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .action-button {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      min-width: 120px;
    }

    .cancel-button {
      background: transparent;
      border: 2px solid #dc2626;
      color: #dc2626;
    }

    .cancel-button:hover {
      background: #dc2626;
      color: white;
    }

    .success-button {
      background: #16a34a;
      color: white;
    }

    .success-button:hover {
      background: #15803d;
    }

    .retry-button {
      background: #dc2626;
      color: white;
    }

    .retry-button:hover {
      background: #b91c1c;
    }
  `

  connectedCallback() {
    super.connectedCallback()
    if (!this.requestPayment) {
      this.previewInteractionCompleted()
      return
    }
    const {
      outgoingPaymentGrant: {
        interact: { redirect }
      }
    } = this.configController.state
    if (!redirect) return

    window.open(redirect, '_blank')
    this._boundHandleMessage = this.handleMessage.bind(this)
    window.addEventListener('message', this._boundHandleMessage)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('message', this._boundHandleMessage)
  }

  private handleMessage(event: MessageEvent) {
    if (event.data?.type !== 'GRANT_INTERACTION') return
    const { paymentId, interact_ref, result } = event.data

    if (result === 'grant_rejected') {
      this.currentView = 'failed'
      this.errorMessage = 'Payment authorization was rejected'
      this.requestUpdate()
      return
    }

    if (!paymentId || !interact_ref) {
      this.currentView = 'failed'
      this.errorMessage = 'Invalid payment response received'
      this.requestUpdate()
      return
    }

    this.handleInteractionCompleted(interact_ref)
  }

  private cancel() {
    this.dispatchEvent(
      new CustomEvent('interaction-cancelled', {
        bubbles: true,
        composed: true
      })
    )
  }

  private goBack() {
    this.dispatchEvent(
      new CustomEvent('back', {
        bubbles: true,
        composed: true
      })
    )
  }

  private async handleInteractionCompleted(interactRef: string) {
    try {
      const {
        walletAddress,
        outgoingPaymentGrant,
        quote,
        incomingPaymentGrant,
        note
      } = this.configController.state
      const response = await fetch(
        `${this.configController.config.apiUrl}tools/payment/finalize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress,
            pendingGrant: outgoingPaymentGrant,
            quote,
            incomingPaymentGrant,
            interactRef,
            note
          })
        }
      )

      if (!response.ok) {
        this.currentView = 'failed'
        this.errorMessage = 'Failed to process payment. Please try again.'
        this.requestUpdate()
        return
      }

      const result = (await response.json()) as CheckPaymentResult
      if (result.success === false) {
        this.currentView = 'failed'
        this.errorMessage = result.error.message
        this.requestUpdate()
        return
      }

      this.currentView = 'success'
      this.requestUpdate()
    } catch {
      this.currentView = 'failed'
      this.errorMessage = 'There was an issues with your request.'
      this.requestUpdate()
    }
  }

  private previewInteractionCompleted() {
    setTimeout(() => {
      this.currentView = 'success'
      this.requestUpdate()
    }, 3000)
  }

  private renderAuthorizingView() {
    return html`
      <div class="interaction-container">
        <div class="spinner"></div>
        <h3 class="status-title">Authorizing Payment</h3>
        <p class="status-description">
          Please complete the authorization in the opened tab
        </p>
        <button class="action-button cancel-button" @click=${this.cancel}>
          Cancel
        </button>
      </div>
    `
  }

  private renderSuccessView() {
    return html`
      <div class="interaction-container">
        <div class="status-icon success-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 class="status-title success">Payment Complete!</h3>
        <p class="status-description">
          Your payment has been processed successfully.
        </p>
        <button class="action-button success-button" @click=${this.goBack}>
          Done
        </button>
      </div>
    `
  }

  private renderFailedView() {
    return html`
      <div class="interaction-container">
        <div class="status-icon error-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 class="status-title error">${this.errorMessage}</h3>

        <div style="display: flex; gap: 12px;">
          <button class="action-button cancel-button" @click=${this.goBack}>
            Go to homepage
          </button>
        </div>
      </div>
    `
  }

  render() {
    switch (this.currentView) {
      case 'success':
        return this.renderSuccessView()
      case 'failed':
        return this.renderFailedView()
      case 'authorizing':
      default:
        return this.renderAuthorizingView()
    }
  }
}

customElements.define('wm-payment-interaction', PaymentInteraction)
