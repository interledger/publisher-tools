import { LitElement, html, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { CheckPaymentResult } from 'publisher-tools-api/src/utils/open-payments'
import type { WidgetController } from '../../controller'

import interactionStyles from './interaction.css?raw'

import loadingIcon from '../../../assets/interaction/authorization_loading.svg'
import successIcon from '../../../assets/interaction/authorization_success.svg'
import failedIcon from '../../../assets/interaction/authorization_failed.svg'

type PaymentStatusResponse = {
  data: {
    type: string
    paymentId: string
    interact_ref: string
    hash: string
    result: string
  }
}

export class PaymentInteraction extends LitElement {
  private _boundHandleMessage: (event: MessageEvent) => void = () => {}
  private _pollingAbortController: AbortController | null = null
  private _interactionCompleted = false
  @property({ type: Object }) configController!: WidgetController
  @property({ type: Boolean }) isPreview?: boolean = false
  @state() private currentView: 'authorizing' | 'success' | 'failed' =
    'authorizing'
  @state() private errorMessage = ''

  static styles = unsafeCSS(interactionStyles)

  connectedCallback() {
    super.connectedCallback()
    if (this.isPreview) {
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

    this._startLongPolling()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('message', this._boundHandleMessage)
    this._cancelPolling()
  }

  private handleMessage(event: MessageEvent) {
    if (event.data?.type !== 'GRANT_INTERACTION') return
    if (this._interactionCompleted) return

    const { paymentId, interact_ref, result } = event.data
    this._markCompleted()

    if (result === 'grant_rejected') {
      this.currentView = 'failed'
      this.errorMessage = 'Payment authorization rejected'
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
    this._markCompleted()
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
      const { apiUrl } = this.configController.config
      const url = new URL('/payment/finalize', apiUrl).href

      const response = await fetch(url, {
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
      })

      if (!response.ok) {
        this.currentView = 'failed'
        this.errorMessage = 'Failed to process payment. Please try again.'
        this.requestUpdate()
        return
      }

      const result = (await response.json()) as CheckPaymentResult

      if (result.success === false) {
        this.currentView = 'failed'
        this.errorMessage = result.error?.message || 'Payment processing failed'
        this.requestUpdate()
        return
      }

      this.currentView = 'success'
      this.requestUpdate()
    } catch {
      this.currentView = 'failed'
      this.errorMessage = 'There was an issue with your request.'
      this.requestUpdate()
    }
  }

  private async _startLongPolling(): Promise<void> {
    if (this._interactionCompleted) return
    this._pollingAbortController = new AbortController()

    try {
      const { paymentId } = this.configController.state
      const { apiUrl } = this.configController.config
      const url = new URL(`/payment/status/${paymentId}`, apiUrl).href
      const res = await fetch(url, {
        signal: this._pollingAbortController.signal
      })

      if (this._interactionCompleted) return
      this._markCompleted()

      if (res.ok) {
        const data = (await res.json()) as PaymentStatusResponse

        this.handleInteractionCompleted(data.data.interact_ref)
      } else {
        if (res.status === 504) {
          this.errorMessage = 'Payment authorization timed out'
        } else {
          this.errorMessage = 'Failed to check payment status'
        }
        this.currentView = 'failed'
        this.requestUpdate()
      }
    } catch (error) {
      // don't handle errors if the request was aborted, another method succeeded
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      if (!this._interactionCompleted) {
        this._markCompleted()
        this.currentView = 'failed'
        this.errorMessage = 'Failed to check payment status'
        this.requestUpdate()
      }
    }
  }

  private _markCompleted() {
    if (this._interactionCompleted) return

    this._interactionCompleted = true
    this._cancelPolling()
  }

  private _cancelPolling() {
    if (this._pollingAbortController) {
      this._pollingAbortController.abort()
      this._pollingAbortController = null
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
          <img
            src=${loadingIcon}
            width="122px"
            height="200px"
            alt="Payment authorization in progress"
          />
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
          <img
            src=${successIcon}
            width="122px"
            height="200px"
            alt="Payment successful"
          />
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
          <div class="title failed">${this.errorMessage}</div>
          <img
            src=${failedIcon}
            width="122px"
            height="200px"
            alt="Payment failed"
          />
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
