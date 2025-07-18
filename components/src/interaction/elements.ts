import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { CheckPaymentResult } from 'publisher-tools-api/src/utils/open-payments';
import type { WidgetController } from '../widget';
import { interactionStyles } from './styles';


export class PaymentInteraction extends LitElement {
  private _boundHandleMessage: (event: MessageEvent) => void = () => { };
  @property({ type: Object }) configController!: WidgetController
  @property({ type: Boolean }) requestPayment?: boolean = true;
  @state() private currentView: 'authorizing' | 'success' | 'failed' = 'authorizing';
  @state() private errorMessage = '';

  static styles = interactionStyles;

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
        walletAddress, outgoingPaymentGrant, quote, incomingPaymentGrant, note
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
