import { LitElement, html, nothing, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type {
  PaymentStatusSuccess,
  PaymentStatus,
  PaymentStatusRejected,
} from 'publisher-tools-api'
import type { CheckPaymentResult } from 'publisher-tools-api/src/utils/open-payments'
import failedIcon from '@c/assets/interaction/authorization_failed.svg'
import loadingIcon from '@c/assets/interaction/authorization_loading.svg'
import successIcon from '@c/assets/interaction/authorization_success.svg'
import interactionStyles from './interaction.css?raw'
import type { WidgetController } from '../../controller'

type ButtonAction = {
  label: string
  buttonClass: 'primary-button' | 'empty-button'
  handler: () => void
}

type InteractionView = {
  titleClass: 'authorizing' | 'complete' | 'failed'
  title: string
  image: {
    src: string
    alt: string
  }
  button?: ButtonAction
  description?: string
}

function isInteractionSuccess(
  params: PaymentStatus,
): params is PaymentStatusSuccess {
  return 'interact_ref' in params
}

function isInteractionRejected(
  params: PaymentStatus,
): params is PaymentStatusRejected {
  return 'result' in params && params.result === 'grant_rejected'
}

function isAbortSignalTimeout(ev: unknown) {
  return (
    ev instanceof Event &&
    ev.target instanceof AbortSignal &&
    isTimeoutError(ev.target.reason)
  )
}

function isTimeoutError(err: unknown) {
  return err instanceof DOMException && err.name === 'TimeoutError'
}

export class PaymentInteraction extends LitElement {
  private _boundHandleMessage: (event: MessageEvent) => void = () => {}
  #pollingAbortController: AbortController | null = null
  #interactionCompleted = false
  @property({ type: Object }) configController!: WidgetController
  @property({ type: Boolean }) isPreview?: boolean = false
  @state() private currentView:
    | 'authorizing'
    | 'processing'
    | 'success'
    | 'failed' = 'authorizing'
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
        interact: { redirect },
      },
    } = this.configController.state
    if (!redirect) return

    window.open(redirect, '_blank')
    this._boundHandleMessage = this.handleMessage.bind(this)
    window.addEventListener('message', this._boundHandleMessage)

    const POLLING_TIMEOUT = 25_000 * 5
    this.#pollingAbortController = new AbortController()
    AbortSignal.timeout(POLLING_TIMEOUT).addEventListener('abort', (ev) => {
      this.#pollingAbortController?.abort(ev)
    })
    this._startLongPolling(this.#pollingAbortController.signal)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('message', this._boundHandleMessage)
    this._cancelPolling()
  }

  private handleMessage(event: MessageEvent) {
    if (event.data?.type !== 'GRANT_INTERACTION') return

    window.removeEventListener('message', this._boundHandleMessage)
    const { data } = event
    this._markPollingCompleted()

    if (isInteractionSuccess(data)) {
      void this.handleInteractionSuccess(data.interact_ref)
    } else if (isInteractionRejected(data)) {
      this.handleInteractionFail('Payment authorization rejected')
    } else {
      this.handleInteractionFail('Invalid payment response received')
    }
  }

  private cancel() {
    this._markPollingCompleted()
    this.dispatchEvent(
      new CustomEvent('interaction-cancelled', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private goBack() {
    this.dispatchEvent(
      new CustomEvent('back', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private async handleInteractionSuccess(interactRef: string) {
    this.currentView = 'processing'
    this.requestUpdate()

    try {
      const {
        walletAddress,
        outgoingPaymentGrant,
        quote,
        incomingPaymentGrant,
        note,
      } = this.configController.state
      const { apiUrl } = this.configController.config
      const url = new URL('/payment/finalize', apiUrl).href

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          pendingGrant: outgoingPaymentGrant,
          quote,
          incomingPaymentGrant,
          interactRef,
          note,
        }),
      })

      if (!response.ok) {
        this.handleInteractionFail(
          'Failed to process payment. Please try again',
        )
        return
      }

      const result = (await response.json()) as CheckPaymentResult

      if (result.success === false) {
        this.handleInteractionFail(
          result.error?.message || 'Payment processing failed',
        )
        return
      }

      this.currentView = 'success'
      this.requestUpdate()
    } catch {
      this.handleInteractionFail('There was an issue with your request')
    }
  }

  private handleInteractionFail(message: string) {
    this.currentView = 'failed'
    this.errorMessage = message
    this.requestUpdate()
  }

  private async _startLongPolling(signal?: AbortSignal): Promise<void> {
    if (this.#interactionCompleted) return

    const { paymentId } = this.configController.state
    const { apiUrl } = this.configController.config
    const url = new URL(`/payment/status/${paymentId}`, apiUrl).href

    signal?.throwIfAborted()
    try {
      const res = await fetch(url, { signal })
      if (res.ok) {
        const data = (await res.json()) as PaymentStatus
        if (isInteractionSuccess(data)) {
          void this.handleInteractionSuccess(data.interact_ref)
        } else if (isInteractionRejected(data)) {
          this.handleInteractionFail('Payment authorization rejected')
        } else {
          this.handleInteractionFail('Invalid payment response received')
        }
        return //success
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // don't handle errors if the request was aborted, another method succeeded
        return
      }
      if (isAbortSignalTimeout(error) || isTimeoutError(error)) {
        this._markPollingFailed('Payment authorization timed out')
        return
      }

      this._markPollingFailed('Failed to check payment status')
      throw error
    }
  }

  private _markPollingCompleted() {
    if (this.#interactionCompleted) return

    this.#interactionCompleted = true
    this._cancelPolling()
  }

  private _markPollingFailed(message: string) {
    if (this.#interactionCompleted) return
    this.#interactionCompleted = true

    this._cancelPolling()
    this.currentView = 'failed'
    this.errorMessage = message
    this.requestUpdate()
  }

  private _cancelPolling() {
    if (this.#pollingAbortController) {
      this.#pollingAbortController.abort()
      this.#pollingAbortController = null
    }
  }

  private previewInteractionCompleted() {
    setTimeout(() => {
      this.currentView = 'success'
      this.requestUpdate()
    }, 3000)
  }

  private resolveInteractionView(): InteractionView {
    switch (this.currentView) {
      case 'processing':
        return {
          titleClass: 'authorizing',
          title: 'Verifying payment',
          description: 'Checking payment status',
          image: {
            src: loadingIcon,
            alt: 'Payment verification in progress',
          },
        }

      case 'success':
        return {
          titleClass: 'complete',
          title: 'Payment complete!',
          description: 'Your payment has been processed successfully',
          image: {
            src: successIcon,
            alt: 'Payment successful',
          },
          button: {
            label: 'Done',
            buttonClass: 'primary-button',
            handler: this.goBack,
          },
        }
      case 'failed':
        return {
          titleClass: 'failed',
          title: this.errorMessage,
          image: {
            src: failedIcon,
            alt: 'Payment failed',
          },
          button: {
            label: 'Cancel payment',
            buttonClass: 'empty-button',
            handler: this.cancel,
          },
        }
      case 'authorizing':
        return {
          titleClass: 'authorizing',
          title: 'Authorizing payment',
          description: 'Please complete the authorization in the opened tab',
          image: {
            src: loadingIcon,
            alt: 'Payment authorization in progress',
          },
          button: {
            label: 'Cancel payment',
            buttonClass: 'empty-button',
            handler: this.cancel,
          },
        }
    }
  }

  private renderInteractionView(view: InteractionView) {
    return html`
      <div class="interaction-container">
        <div class="empty-header"></div>

        <div class="interaction-body">
          <div class="title ${view.titleClass}">${view.title}</div>
          ${view.description
            ? html`<div class="description">${view.description}</div>`
            : nothing}
          <img
            src=${view.image.src}
            width="122"
            height="200"
            alt=${view.image.alt}
          />
        </div>

        ${view.button
          ? html`
              <button
                class="button-container ${view.button.buttonClass}"
                @click=${view.button.handler}
              >
                ${view.button.label}
              </button>
            `
          : nothing}
      </div>
    `
  }

  render() {
    return this.renderInteractionView(this.resolveInteractionView())
  }
}
