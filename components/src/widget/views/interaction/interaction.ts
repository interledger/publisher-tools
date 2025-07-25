import { LitElement, html, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { CheckPaymentResult } from 'publisher-tools-api/src/utils/open-payments'
import type { WidgetController } from '../../controller'

import interactionStyles from './interaction.css?raw'

import loadingIcon from '../../../assets/interaction/authorization_loading.svg'
import successIcon from '../../../assets/interaction/authorization_success.svg'
import failedIcon from '../../../assets/interaction/authorization_failed.svg'

export class PaymentInteraction extends LitElement {
  private _boundHandleMessage: (event: MessageEvent) => void = () => {}
  @property({ type: Object }) configController!: WidgetController
  @property({ type: Boolean }) requestPayment?: boolean = true
  @state() private currentView: 'authorizing' | 'success' | 'failed' =
    'authorizing'
  @state() private errorMessage = ''

  static styles = unsafeCSS(interactionStyles)

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
        <div class="empty-header"></div>

        <div class="interaction-body">
          <div class="title authorizing">Authorizing payment</div>
          <div class="description">
            Please complete the authorization in the opened tab
          </div>
          <img src=${loadingIcon} width="122px" height="200px" />
        </div>

        <button class="button-container empty-button" @click=${this.cancel}>
          Cancel payment
        </button>
      </div>
    `
  }

  private renderSuccessView() {
    return html`
      <div class="interaction-container">
        <div class="empty-header"></div>

        <div class="interaction-body">
          <div class="title complete">Payment complete!</div>
          <div class="description">
            Your payment has been processed successfully
          </div>
          <img src=${successIcon} width="122px" height="200px" />
        </div>

        <button class="button-container primary-button" @click=${this.goBack}>
          Done
        </button>
      </div>
    `
  }

  private renderFailedView() {
    return html`
      <div class="interaction-container">
        <div class="empty-header"></div>

        <div class="interaction-body">
          <div class="title red">Payment authorization rejected</div>
          <img src=${failedIcon} width="122px" height="200px" alt="failed payment icon" />
        </div>

        <button class="button-container empty-button" @click=${this.cancel}>
          Cancel payment
        </button>
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
