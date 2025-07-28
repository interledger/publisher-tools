import type {
  Quote,
  Grant,
  WalletAddress,
  PendingGrant
} from '@interledger/open-payments'
import { LitElement, html, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { PaymentQuoteInput } from 'publisher-tools-api'
import type { WidgetController } from '../../controller'
import type { Amount } from '../../types'

import confirmationCss from './confirmation.css?raw'

export interface PaymentResponse {
  quote: Quote
  incomingPaymentGrant: Grant
}

export class PaymentConfirmation extends LitElement {
  @property({ type: Object }) configController!: WidgetController
  @property({ type: String }) note = ''
  @property({ type: Boolean }) isPreview?: boolean = false

  @state() private inputAmount = ''
  @state() private inputWidth = ''
  @state() private isLoadingPreview = false
  @state() private debounceTimer: ReturnType<typeof setTimeout> | null = null
  @state() private formattedDebitAmount?: string
  @state() private formattedReceiveAmount?: string

  static styles = unsafeCSS(confirmationCss)

  connectedCallback() {
    super.connectedCallback()
    this.updateComplete.then(() => {
      const input =
        this.shadowRoot?.querySelector<HTMLInputElement>('#amount-input')
      if (input) {
        input.focus()
      }
    })
  }

  private debouncedProcessPayment(amount: string) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.isLoadingPreview = true

    this.debounceTimer = setTimeout(() => {
      const formatted = amount.replace(/,/g, '')
      this.processPaymentForAmount(formatted)
    }, 750)
  }

  private async processPaymentForAmount(amount: string) {
    if (!amount || amount === '0') {
      this.requestUpdate()
      return
    }

    const {
      walletAddress: { id }
    } = this.configController.state

    const paymentData = {
      walletAddress: id,
      receiver: this.configController.config.receiverAddress,
      amount: Number(amount)
    }

    if (this.isPreview) {
      await this.previewPaymentQuote(paymentData)
    } else {
      await this.getPaymentQuote(paymentData)
    }

    this.isLoadingPreview = false
  }

  private handlePresetClick(amount: string) {
    this.inputAmount = amount

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debouncedProcessPayment(amount)
  }

  private handleAmountInput(e: Event) {
    const input = e.target as HTMLInputElement

    const formatted = this.formatAmount(input.value)
    this.inputAmount = formatted
    this.inputWidth = this.calculateInputWidth(formatted)
    this.debouncedProcessPayment(this.inputAmount)
    this.requestUpdate()
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
      maximumFractionDigits: 2
    }).format(number)
  }

  private handleKeyDown(e: KeyboardEvent) {
    // allow only: backspace (8) and delete (46)
    if ([8, 46, 37, 39].includes(e.keyCode)) {
      return
    }

    if (
      // allow only numbers (48-57, 96-105) and decimal point (190, 110)
      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105) &&
      e.keyCode !== 190 &&
      e.keyCode !== 110
    ) {
      e.preventDefault()
    }

    // only allow one decimal point
    const input = e.target as HTMLInputElement
    if ((e.keyCode === 190 || e.keyCode === 110) && input.value.includes('.')) {
      e.preventDefault()
    }
  }

  /** Measures the width of the input field using a temporary canvas */
  calculateInputWidth(input: string) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    context!.font = '2.5rem Arial' // match the input font size
    const width = context!.measureText(input || '$0.00').width
    return input ? width + 20 + 'px' : '50px'
  }

  private async getPaymentQuote(paymentData: {
    walletAddress: string
    receiver: string
    amount: number
  }): Promise<void> {
    const response = await fetch(
      `${this.configController.config.apiUrl}tools/payment/quote`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderWalletAddress: paymentData.walletAddress,
          receiverWalletAddress: paymentData.receiver,
          amount: paymentData.amount,
          note: this.note
        } satisfies PaymentQuoteInput)
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch payment quote')
    }

    const payment = (await response.json()) as PaymentResponse
    const { quote } = payment

    this.formattedDebitAmount = this.configController.getFormattedAmount({
      value: quote.debitAmount.value,
      assetCode: quote.debitAmount.assetCode,
      assetScale: quote.debitAmount.assetScale
    }).amountWithCurrency

    this.formattedReceiveAmount = this.configController.getFormattedAmount({
      value: quote.receiveAmount.value,
      assetCode: quote.receiveAmount.assetCode,
      assetScale: quote.receiveAmount.assetScale
    }).amountWithCurrency

    this.configController.updateState({ ...payment })
  }

  private async previewPaymentQuote(paymentData: {
    walletAddress: string
    receiver: string
    amount: number
  }): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currencySymbol = this.configController.getCurrencySymbol(
          this.configController.state.walletAddress.assetCode
        )
        this.formattedDebitAmount = `${currencySymbol}${paymentData.amount.toString()}`
        this.formattedReceiveAmount = `${currencySymbol}${paymentData.amount.toString()}`
        resolve()
      }, 500)
    })
  }

  private onPaymentConfirmed = () => {
    if (this.isPreview) {
      this.previewPaymentConfirmed()
      return
    }

    this.handlePaymentConfirmed()
  }

  private async handlePaymentConfirmed() {
    try {
      const { walletAddress, quote } = this.configController.state
      const outgoingPaymentGrant = await this.requestOutgoingGrant({
        walletAddress,
        debitAmount: quote.debitAmount,
        receiveAmount: quote.receiveAmount
      })

      this.configController.updateState({
        outgoingPaymentGrant,
        note: this.note
      })

      this.dispatchEvent(
        new CustomEvent('payment-confirmed', {
          bubbles: true,
          composed: true
        })
      )
    } catch (error) {
      console.error('Error initializing payment:', error)
    }
  }

  private previewPaymentConfirmed() {
    this.dispatchEvent(
      new CustomEvent('payment-confirmed', {
        bubbles: true,
        composed: true
      })
    )
  }

  private async requestOutgoingGrant(paymentData: {
    walletAddress: WalletAddress
    debitAmount: Amount
    receiveAmount: Amount
  }): Promise<PendingGrant> {
    const response = await fetch(
      `${this.configController.config.apiUrl}tools/payment/grant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: paymentData.walletAddress,
          debitAmount: paymentData.debitAmount,
          receiveAmount: paymentData.receiveAmount
        })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to request outgoing payment grant')
    }

    return await response.json()
  }

  private goBack() {
    this.dispatchEvent(
      new CustomEvent('back', {
        bubbles: true,
        composed: true
      })
    )
  }

  private closeWidget() {
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true
      })
    )
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  }

  render() {
    const {
      walletAddress: { assetCode }
    } = this.configController.state
    const currencySymbol = this.configController.getCurrencySymbol(assetCode)

    return html`
      <div class="confirmation-container">
        <div class="widget-header-container confimation-buttons-header">
          <button id="back-button" class="back-button" @click=${this.goBack}>
            <svg height="20px" width="20px" fill="none" viewBox="0 0 20 20">
              <path
                fill="var(--wm-primary-color, #8075B3)"
                d="M8.251 14.423 3.828 10l4.423-4.423.59.6-3.407 3.406h10.733v.834H5.435l3.407 3.407-.59.6Z"
              />
            </svg>
            <span>back</span>
          </button>
          <button class="close-button" @click=${this.closeWidget}>
            <svg fill="none" viewBox="0 0 20 20">
              <path
                fill="var(--wm-primary-color, #8075B3)"
                d="m5.332 15.257-.59-.59L9.41 10 4.742 5.333l.59-.59L10 9.41l4.666-4.667.59.59L10.59 10l4.666 4.667-.59.59L10 10.59l-4.667 4.667Z"
              />
            </svg>
          </button>
        </div>

        <div class="widget-body">
          <div class="form-wallet-address">
            <label class="form-label">Amount</label>

            <div class="amount-input-wrapper">
              <span class="currency-symbol">${currencySymbol}</span>
              <input
                id="amount-input"
                class="form-input with-currency"
                type="text"
                inputmode="decimal"
                placeholder="0"
                .value=${this.inputAmount}
                @input=${this.handleAmountInput}
                @paste=${(e: Event) => e.preventDefault()}
                @keydown=${this.handleKeyDown}
                autocomplete="off"
                spellcheck="false"
              />
            </div>
          </div>

          <div class="preset-buttons">
            <button
              class="preset-btn ${this.inputAmount === '1' ? 'selected' : ''}"
              @click=${() => this.handlePresetClick('1')}
            >
              ${currencySymbol}1
            </button>
            <button
              class="preset-btn ${this.inputAmount === '5' ? 'selected' : ''}"
              @click=${() => this.handlePresetClick('5')}
            >
              ${currencySymbol}5
            </button>
            <button
              class="preset-btn ${this.inputAmount === '10' ? 'selected' : ''}"
              @click=${() => this.handlePresetClick('10')}
            >
              ${currencySymbol}10
            </button>
          </div>

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
            <div class="spinner"></div>
            Loading payment details...
          </div>
        </div>
      `
    }

    const { quote } = this.configController.state
    if (!this.isPreview && !quote) {
      return html`
        <div class="payment-details failed">
          <div class="loading-state">
            Failed to load payment details. Please try again.
          </div>
        </div>
      `
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

      <button class="primary-button" @click=${this.onPaymentConfirmed}>
        Confirm Payment
      </button>
    `
  }
}
customElements.define('wm-payment-confirmation', PaymentConfirmation)
