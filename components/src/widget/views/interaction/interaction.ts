import { LitElement, html, nothing, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import failedIcon from '@c/assets/interaction/authorization_failed.svg'
import loadingIcon from '@c/assets/interaction/authorization_loading.svg'
import successIcon from '@c/assets/interaction/authorization_success.svg'
import { NO_OP_CONTROLLER, type Controller } from '@c/widget/controller'
import styles from './interaction.css?raw'

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

export class PaymentWaiting extends LitElement {
  #pollingAbortController: AbortController | null = null
  #interactionCompleted = false

  @state() private currentView:
    | 'authorizing'
    | 'processing'
    | 'success'
    | 'failed' = 'authorizing'
  @state() private errorMessage = ''

  @property({ type: String, attribute: false }) private paymentId = ''
  @property({ type: String, attribute: false }) private grantRedirectUrl = ''

  static styles = unsafeCSS(styles)

  connectedCallback() {
    super.connectedCallback()

    if (!this.grantRedirectUrl) {
      throw new Error('Grant redirect URL not found')
    }
    if (!this.#controller.isPreviewMode) {
      window.open(this.grantRedirectUrl, '_blank')
    }

    const POLLING_TIMEOUT = 25_000 * 5
    this.#pollingAbortController = new AbortController()
    AbortSignal.timeout(POLLING_TIMEOUT).addEventListener('abort', (ev) => {
      this.#pollingAbortController?.abort(ev)
    })
    void this.waitForCompletion(this.paymentId)
  }

  #controller = NO_OP_CONTROLLER
  @property({ type: Object, attribute: false })
  set controller(controller: Controller) {
    if (this.#controller === controller) return
    if (this.#controller !== NO_OP_CONTROLLER) {
      throw new Error('controller is already set')
    }
    this.#controller = controller
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._cancelPolling()
  }

  private async waitForCompletion(paymentId: string) {
    try {
      for await (const status of this.#controller.getStatus(
        paymentId,
        this.#pollingAbortController?.signal,
      )) {
        if (status.type === 'OUTGOING_PAYMENT_CREATED') {
          this.currentView = 'processing'
        } else if (status.type === 'OUTGOING_PAYMENT_DONE') {
          this.currentView = 'success'
        } else if (status.type === 'PENDING_GRANT_INTERACTION') {
          this.currentView = 'authorizing'
        } else if (status.type === 'GRANT_REJECTED') {
          this.handleInteractionFail('Payment authorization rejected')
        }
        this.requestUpdate()
      }
      this._markPollingCompleted()
    } catch (err) {
      const error = err as Error
      this.handleInteractionFail(error.message)
      this._markPollingFailed(error.message)
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

  private handleInteractionFail(message: string) {
    this.currentView = 'failed'
    this.errorMessage = message
    this.requestUpdate()
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
