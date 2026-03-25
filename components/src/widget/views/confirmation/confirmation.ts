import { LitElement, html, nothing, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { PaymentGrantInput, PaymentQuoteInput } from 'publisher-tools-api'
import { getCurrencySymbol, getFormattedAmount } from '@c/utils'
import type {
  Quote,
  Grant,
  WalletAddress,
  PendingGrant,
} from '@interledger/open-payments'
import confirmationCss from './confirmation.css?raw'
import '../../components/dots-loader.js'
import type { WidgetController } from '../../controller'
import type { Amount } from '../../types'

const MIN_SEND_AMOUNT = 1 // 1 unit

interface PaymentResponse {
  quote: Quote
  incomingPaymentGrant: Grant
  error?: string
  minSendAmount?: Amount
}

export class PaymentConfirmation extends LitElement {
  @property({ type: Object }) configController!: WidgetController
  @property({ type: String }) note = ''
  @property({ type: Boolean }) isPreview?: boolean = false

  @state() private inputAmount = ''
  @state() private isLoadingPreview = false
  @state() private debounceTimer: ReturnType<typeof setTimeout> | null = null
  @state() private amountError: string | null = null
  @state() private formattedDebitAmount?: string
  @state() private formattedReceiveAmount?: string
  #minSendAmount?: Amount

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

    const amountToSend = Number(amount)

    if (this.#minSendAmount) {
      const { value, assetScale } = this.#minSendAmount
      const minAmount = Number(value) / 10 ** assetScale

      if (amountToSend < minAmount) {
        const { assetScale } = this.configController.state.walletAddress
        this.amountError = this.validateAmount(
          amountToSend * 10 ** assetScale,
          Number(value),
        )
        return
      }
    }

    this.amountError = null
    this.isLoadingPreview = true
    this.debounceTimer = setTimeout(() => {
      this.processPaymentForAmount(amountToSend)
    }, 750)
  }

  private async processPaymentForAmount(amount: number) {
    const {
      walletAddress: { id, assetScale },
    } = this.configController.state
    const amountToSend = Math.max(amount, MIN_SEND_AMOUNT / 10 ** assetScale)

    const paymentData = {
      walletAddress: id,
      receiver: this.configController.config.receiverAddress,
      amount: amountToSend,
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
      maximumFractionDigits: 2,
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

  private async getPaymentQuote(paymentData: {
    walletAddress: string
    receiver: string
    amount: number
  }): Promise<void> {
    const { apiUrl } = this.configController.config
    const url = new URL(`/payment/quote`, apiUrl)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderWalletAddress: paymentData.walletAddress,
        receiverWalletAddress: paymentData.receiver,
        amount: paymentData.amount,
        note: this.note,
      } satisfies PaymentQuoteInput),
    })

    const data = (await response.json()) as PaymentResponse

    if (!response.ok) {
      this.amountError =
        'Failed to create payment. Please try a different amount.'
      if (response.status === 400 && data.error === 'NON_POSITIVE_AMOUNT') {
        if (data.minSendAmount?.value) {
          // Rafiki v1.2.0-beta and later include `minSendAmount` with error
          const {
            minSendAmount: { value, assetScale },
          } = data
          this.amountError = this.validateAmount(
            paymentData.amount * 10 ** assetScale,
            Number(value),
          )
          this.#minSendAmount = data.minSendAmount
        } else {
          this.amountError =
            'The amount is too small. Please enter a higher amount.' // TODO: i18n
        }
      }

      return
    }

    const {
      quote: { debitAmount, receiveAmount },
    } = data
    this.formattedDebitAmount = getFormattedAmount(
      debitAmount.value,
      debitAmount,
    ).amountWithCurrency

    this.formattedReceiveAmount = getFormattedAmount(
      receiveAmount.value,
      receiveAmount,
    ).amountWithCurrency

    this.configController.updateState({ ...data })
  }

  private async previewPaymentQuote(paymentData: {
    walletAddress: string
    receiver: string
    amount: number
  }): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currencySymbol = getCurrencySymbol(
          this.configController.state.walletAddress.assetCode,
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
      const { grant, paymentId } = await this.requestOutgoingGrant({
        walletAddress,
        debitAmount: quote.debitAmount,
        receiveAmount: quote.receiveAmount,
      })

      this.configController.updateState({
        outgoingPaymentGrant: grant,
        paymentId,
        note: this.note,
      })

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

  private previewPaymentConfirmed() {
    this.dispatchEvent(
      new CustomEvent('payment-confirmed', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private async requestOutgoingGrant(paymentData: {
    walletAddress: WalletAddress
    debitAmount: Amount
    receiveAmount: Amount
  }): Promise<{ grant: PendingGrant; paymentId: string }> {
    const { apiUrl, frontendUrl } = this.configController.config
    const url = new URL('/payment/grant', apiUrl).href
    const redirectUrl = new URL('payment-confirmation', frontendUrl).href

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirectUrl,
        walletAddress:
          paymentData.walletAddress as PaymentGrantInput['walletAddress'],
        debitAmount: paymentData.debitAmount,
        receiveAmount: paymentData.receiveAmount,
      } satisfies PaymentGrantInput),
    })

    if (!response.ok) {
      throw new Error('Failed to request outgoing payment grant')
    }

    return await response.json()
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
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  }

  render() {
    const {
      walletAddress: { assetCode },
    } = this.configController.state
    const currencySymbol = getCurrencySymbol(assetCode)

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
                class="form-input with-currency ${this.amountError
                  ? 'amount-error'
                  : ''}"
                type="text"
                inputmode="decimal"
                placeholder="0"
                .value=${this.inputAmount}
                @input=${this.handleAmountInput}
                @paste=${(e: Event) => e.preventDefault()}
                @keydown=${this.handleKeyDown}
                autocomplete="off"
                spellcheck="false"
                aria-invalid=${!!this.amountError}
                aria-describedby=${this.amountError ? 'amount-error' : nothing}
              />
            </div>
            ${this.amountError
              ? html`<p id="amount-error" class="amount-error" role="alert">
                  ${this.amountError}
                </p>`
              : nothing}
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

      <button class="primary-button" @click=${this.onPaymentConfirmed}>
        Confirm Payment
      </button>
    `
  }
}
customElements.define('wm-payment-confirmation', PaymentConfirmation)
