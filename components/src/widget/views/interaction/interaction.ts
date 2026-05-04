import { LitElement, html, nothing, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { PaymentStatus } from 'publisher-tools-api'
import failedIcon from '@c/assets/interaction/authorization_failed.svg'
import loadingIcon from '@c/assets/interaction/authorization_loading.svg'
import successIcon from '@c/assets/interaction/authorization_success.svg'
import { sleep } from '@shared/utils'
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
    const { grantRedirectUrl } = this.configController.state
    if (!grantRedirectUrl) {
      throw new Error('Grant redirect URL not found')
    }
    window.open(grantRedirectUrl, '_blank')

    const POLLING_TIMEOUT = 25_000 * 5
    this.#pollingAbortController = new AbortController()
    AbortSignal.timeout(POLLING_TIMEOUT).addEventListener('abort', (ev) => {
      this.#pollingAbortController?.abort(ev)
    })
    this._pollPaymentCompletion(this.#pollingAbortController.signal)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('message', this._boundHandleMessage)
    this._cancelPolling()
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

  private handleInteractionFail(message: string) {
    this.currentView = 'failed'
    this.errorMessage = message
    this.requestUpdate()
  }

  private async _pollPaymentCompletion(signal?: AbortSignal) {
    while (true) {
      const res = await this._getAndHandleStatus(signal)
      if (!res) return
      if (res.type === 'PENDING_GRANT_INTERACTION') {
        await sleep(3000)
        continue
      }
      if (res.type === 'OUTGOING_PAYMENT_CREATED') {
        this.currentView = 'processing'
        this.requestUpdate()
        await sleep(1500)
        continue
      }
      if (res.type === 'OUTGOING_PAYMENT_DONE') {
        if (res.result === 'success') {
          this.currentView = 'success'
        } else {
          this.currentView = 'failed'
          this.errorMessage = res.error?.message || 'Payment failed'
        }
        this._markPollingCompleted()
        this.requestUpdate()
        return
      }
      if (res.type === 'GRANT_REJECTED') {
        this.handleInteractionFail('Payment authorization rejected')
        this._markPollingCompleted()
        return
      }

      this.handleInteractionFail('Invalid payment response received')
      this._markPollingCompleted()
      return
    }
  }

  private async _getAndHandleStatus(
    signal?: AbortSignal,
  ): Promise<PaymentStatus | void> {
    if (this.#interactionCompleted) return

    const { paymentId } = this.configController.state
    const { apiUrl } = this.configController.config
    const url = new URL(`/payment/status2/${paymentId}`, apiUrl).href

    signal?.throwIfAborted()
    try {
      const res = await fetch(url, { signal })
      if (!res.ok) {
        this._markPollingFailed('Failed to check payment status')
        return
      }
      const data = await res.json()
      return data as PaymentStatus
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

  private get interactionView(): InteractionView {
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

  render() {
    const { titleClass, title, description, image, button } =
      this.interactionView

    return html`
      <div class="interaction-container">
        <div class="empty-header"></div>

        <div class="interaction-body">
          <div class="title ${titleClass}">${title}</div>
          ${description
            ? html`<div class="description">${description}</div>`
            : nothing}
          <img src=${image.src} width="122" height="200" alt=${image.alt} />
        </div>

        ${button
          ? html`
              <button
                class="button-container ${button.buttonClass}"
                @click=${button.handler}
              >
                ${button.label}
              </button>
            `
          : nothing}
      </div>
    `
  }
}
