import { LitElement, html, nothing, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { WalletAddressInfo } from 'publisher-tools-api'
import { CloseBtn } from '@c/shared/components/close-btn'
import { DotsLoader } from '@c/shared/components/dots-loader'
import { getFormattedAmount, registerComponents } from '@c/utils'
import {
  NO_OP_CONTROLLER,
  type Controller,
  type WidgetController,
} from '@c/widget/controller'
import { toAmount } from '@shared/utils'
import confirmationCss from './confirmation.css?raw'
import { type AmountChangeEventDetail, PaymentAmount } from '../amount/amount'

export class PaymentInitiate extends LitElement {
  @property({ type: Object }) configController!: WidgetController
  @property({ type: String }) note = ''

  @state() private inputAmount = ''
  @state() private isLoadingPreview = false
  @state() private isPreparingPayment = false
  @state() private amountError: string | null = null
  @state() private formattedDebitAmount?: string
  @state() private formattedReceiveAmount?: string
  #minSendAmount?: number

  static styles = unsafeCSS(confirmationCss)

  connectedCallback() {
    super.connectedCallback()
    registerComponents({
      'wm-dots-loader': DotsLoader,
      'wm-close-btn': CloseBtn,
      'wm-amount': PaymentAmount,
    })
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

  private onAmountChange(ev: CustomEvent<AmountChangeEventDetail>) {
    this.amountError = null
    const { amount, onComplete } = ev.detail
    const { walletAddress: sender, receiver } = this.configController.state

    const formatted = this.formatAmount(String(amount))
    this.inputAmount = formatted

    this.configController.updateState({ amount })

    if (amount <= 0 || (this.#minSendAmount && amount < this.#minSendAmount)) {
      if (this.#minSendAmount) {
        const minSendAmount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: sender.assetCode,
        }).format(amount)
        this.amountError = `Please enter an amount greater than ${minSendAmount}`
      } else {
        this.amountError = `Please enter a higher amount.`
      }
      onComplete(this.amountError)
      return
    }

    this.isLoadingPreview = true
    this.requestUpdate()

    void this.getPaymentQuote({ sender, receiver, amount })
      .then(() => onComplete(this.amountError))
      .catch((error) => onComplete((error as Error).message))
      .finally(() => {
        this.isLoadingPreview = false
        this.requestUpdate()
      })
  }

  private handleNoteInput(e: Event) {
    const input = e.target as HTMLInputElement
    this.note = input.value
  }

  /** Formats the input amount to 2 decimal places and adds commas */
  formatAmount(value: string) {
    if (!value) return ''

    const numericValue = value.replace(/[^0-9.]/g, '')

    const parts = numericValue.split('.')
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('')
    }

    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2)
    }

    const number = parseFloat(parts.join('.'))
    if (isNaN(number)) return ''

    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number)
  }

  validateAmount(amountToScale: number, minToScale: number): string | null {
    const val = Number(amountToScale)
    if (Number.isNaN(val)) {
      return 'Contribute a valid amount to continue.' // TODO: i18n
    }
    if (val < minToScale) {
      const { amountWithCurrency } = getFormattedAmount(
        minToScale,
        this.configController.state.walletAddress,
      )
      return `A minimum amount of ${amountWithCurrency} is required.`
    }

    return null
  }

  private async getPaymentQuote(params: {
    sender: WalletAddressInfo
    receiver: WalletAddressInfo
    amount: number | string
  }): Promise<void> {
    const { sender, amount } = params
    const data = await this.#controller.fetchQuote(params)

    if ('error' in data) {
      this.amountError = data.error
      if (data.error === 'NON_POSITIVE_AMOUNT') {
        if (!data.minSendAmount) {
          this.amountError = `The amount is too small. Please enter a higher amount.`
          return
        }
        const value = data.minSendAmount.value
        // Rafiki v1.2.0-beta and later include `minSendAmount` with error
        this.#minSendAmount = Number(toAmount(value, sender).value)
        // TODO: in validateAmount, remove concept of assetScale
        this.amountError = this.validateAmount(
          Number(amount) * 10 ** sender.assetScale,
          Number(value) * 10 ** sender.assetScale,
        )
      }
      return
    }

    if (!('debitAmount' in data)) {
      throw new Error('Unexpected: invalid data format')
    }
    const { debitAmount, receiveAmount } = data
    this.formattedDebitAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: debitAmount.currency,
    }).format(Number(debitAmount.value))
    this.formattedReceiveAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: receiveAmount.currency,
    }).format(Number(receiveAmount.value))
  }

  private onPaymentConfirmed = () => {
    this.isPreparingPayment = true
    this.handlePaymentConfirmed()
  }

  private async handlePaymentConfirmed() {
    try {
      const {
        walletAddress: sender,
        receiver,
        amount,
      } = this.configController.state
      const res = await this.#controller.initiatePayment({
        sender,
        receiver,
        amount,
        note: this.note,
      })

      this.configController.updateState({
        grantRedirectUrl: res.grantRedirectUrl,
        paymentId: res.paymentId,
        note: this.note,
      })

      this.isPreparingPayment = false
      this.dispatchEvent(
        new CustomEvent('payment-confirmed', {
          bubbles: true,
          composed: true,
        }),
      )
    } catch (error) {
      console.error('Error initializing payment:', error)
    }
  }

  private goBack() {
    this.dispatchEvent(
      new CustomEvent('back', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private closeWidget() {
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  disconnectedCallback() {
    super.disconnectedCallback()
  }

  render() {
    const {
      walletAddress: { assetCode },
    } = this.configController.state

    return html`
      <div class="confirmation-container">
        <div class="widget-header-container confirmation-buttons-header">
          <button id="back-button" class="back-button" @click=${this.goBack}>
            <svg height="20px" width="20px" fill="none" viewBox="0 0 20 20">
              <path
                fill="var(--wm-primary-color, #8075B3)"
                d="M8.251 14.423 3.828 10l4.423-4.423.59.6-3.407 3.406h10.733v.834H5.435l3.407 3.407-.59.6Z"
              />
            </svg>
            <span>back</span>
          </button>
          <wm-close-btn
            @click=${this.closeWidget}
            .color=${this.configController.config.profile.color.theme}
          ></wm-close-btn>
        </div>

        <div class="widget-body">
          <wm-amount
            .currency=${assetCode}
            @change=${this.onAmountChange}
          ></wm-amount>

          ${this.inputAmount
            ? this.renderPaymentDetails()
            : this.renderEmptyState()}
        </div>
      </div>
    `
  }

  private renderEmptyState() {
    return html`
      <p class="enter-amount-description">
        <b>Enter an amount</b> <br />
        Type an amount or select one of the preset values above
      </p>
    `
  }

  private renderPaymentDetails() {
    if (this.isLoadingPreview) {
      return html`
        <div class="payment-details">
          <div class="loading-state">
            <wm-dots-loader></wm-dots-loader>
          </div>
        </div>
      `
    }

    if (this.amountError) {
      return nothing
    }

    return html`
      <div class="payment-details">
        <div class="summary-row">
          <span class="summary-label">You send:</span>
          <span class="summary-value">${this.formattedDebitAmount}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">They will receive:</span>
          <span class="summary-value">${this.formattedReceiveAmount}</span>
        </div>
      </div>

      <div class="detail-note">
        <label class="form-label">❤ Leave some nice words (optional)</label>
        <input
          class="payment-note-input"
          type="text"
          name="note"
          placeholder="Note"
          maxlength="20"
          .value=${this.note}
          @input=${this.handleNoteInput}
        />
      </div>

      <button
        class="primary-button"
        type="button"
        @click=${this.onPaymentConfirmed}
        ?disabled=${this.isPreparingPayment}
      >
        ${this.isPreparingPayment
          ? html`<wm-dots-loader></wm-dots-loader>`
          : 'Confirm Payment'}
      </button>
    `
  }
}
