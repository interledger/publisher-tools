import {
  html,
  css,
  LitElement,
  type ReactiveController,
  type ReactiveControllerHost
} from 'lit'
import { property, state } from 'lit/decorators.js'
import type { Grant, PendingGrant, Quote } from '@interledger/open-payments'
import './confirmation.js'
import './interaction.js'
import defaultTriggerIcon from './assets/wm_logo_animated.svg'

export interface WidgetConfig {
  walletAddress: string
  receiverAddress: string
  amount: string
  currency: string
  action?: string
  note?: string
  widgetTitleText?: string
  widgetDescriptionText?: string
  widgetTriggerIcon?: string
  theme?: {
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
    fontFamily?: string
    widgetButtonBackgroundColor?: string
  }
  apiUrl?: string
}

export type WalletAddress = {
  id: string
  publicName: string
  assetCode: string
  assetScale: number
  authServer: string
  resourceServer: string
}

export type FormattedAmount = {
  amount: number
  amountWithCurrency: string
  symbol: string
}

export interface Amount {
  value: string
  assetCode: string
  assetScale: number
}

type FormatAmountArgs = Amount & {
  value: string
}

export class PaymentWidget extends LitElement {
  private configController = new WidgetController(this)

  @property({ type: Object })
  set config(value: Partial<WidgetConfig>) {
    this.configController.updateConfig(value)
  }
  get config() {
    return this.configController.config
  }

  @property({ type: Boolean }) isOpen = false
  @property({ type: Boolean }) requestQuote?: boolean = true
  @property({ type: Boolean }) requestPayment?: boolean = true

  @state() private currentView: string = 'home'

  static styles = css`
    :host {
      display: block;
      font-family: var(--wm-font-family, system-ui, sans-serif);
      --primary-color: var(--wm-primary-color, #10b981);
      --background-color: var(--wm-background-color, #ffffff);
      --text-color: var(--wm-text-color, #000000);
    }

    .wm_widget {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .content {
      display: flex;
      flex-direction: column;
      background: var(--background-color);
      width: 24rem;
      height: 37rem;
      overflow: hidden;
      border: 1px solid #f3f4f6;
      transition: all 1s ease-in-out;
      border-radius: 6px;
      padding: 0.25rem;
      outline: none;
    }

    .content:focus {
      outline: none;
    }

    .content.open {
      max-width: 24rem;
      max-height: 37rem;
      opacity: 1;
    }

    .content.closed {
      max-width: 0;
      max-height: 0;
      opacity: 0;
    }

    .widget-header {
      display: flex;
      flex-direction: column;
      height: auto;
      padding: 16px;
    }

    .widget-header h5 {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .widget-header p {
      margin: 0;
      max-height: 8rem;
      overflow: hidden;
      color: var(--text-color);
      opacity: 0.8;
    }

    .payment-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .payment-form {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-color);
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 16px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .form-input:read-only {
      background-color: #f9fafb;
      color: #6b7280;
    }

    .support-button {
      width: 100%;
      padding: 16px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: auto;
    }

    .support-button:hover:not(:disabled) {
      background: #059669;
    }

    .support-button:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .trigger {
      cursor: pointer;
      background: var(--wm-widget-trigger-bg-color, #f3f4f6);
      width: 3.5rem;
      height: 3.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1rem;
      border: transparent;
      border-radius: 50%;
    }

    .trigger img {
      width: 2rem;
    }

    .powered-by {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      margin-top: 16px;
      padding: 0 16px;
    }

    .powered-by a {
      color: var(--primary-color);
      text-decoration: none;
    }
  `

  private async handleSubmit(e: Event) {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const walletAddress = String(formData.get('walletAddress') ?? '')

    if (!walletAddress) {
      alert('Please enter a valid wallet address')
      return
    }

    const response = await fetch(this.toWalletAddressUrl(walletAddress))
    if (!response.ok) {
      alert('Unable to fetch wallet details')
      return
    }

    const json = (await response.json()) as WalletAddress
    if (!this.isWalletAddress(json)) {
      alert('Invalid wallet address format')
      return
    }

    this.configController.updateState({ walletAddress: json })
    this.currentView = 'confirmation'
  }

  // TODO: Move this to the shared utils module!
  private toWalletAddressUrl(s: string): string {
    return s.startsWith('$') ? s.replace('$', 'https://') : s
  }

  // TODO: Move this to the shared utils module!
  private isWalletAddress = (
    o: Record<string, unknown>
  ): o is WalletAddress => {
    return !!(
      o.id &&
      typeof o.id === 'string' &&
      o.assetScale &&
      typeof o.assetScale === 'number' &&
      o.assetCode &&
      typeof o.assetCode === 'string' &&
      o.authServer &&
      typeof o.authServer === 'string' &&
      o.resourceServer &&
      typeof o.resourceServer === 'string'
    )
  }

  private toggleWidget() {
    this.isOpen = !this.isOpen
    this.requestUpdate()

    this.dispatchEvent(
      new CustomEvent('widget-toggle', {
        detail: { isOpen: this.isOpen },
        bubbles: true,
        composed: true
      })
    )
  }

  private handleInteractionCancelled() {
    this.currentView = 'confirmation'
  }

  private renderCurrentView() {
    switch (this.currentView) {
      case 'home':
        return this.renderHomeView()
      case 'confirmation':
        return this.renderConfirmationView()
      case 'interact':
        return this.renderInteractionView()
      default:
        return this.renderHomeView()
    }
  }

  private navigateToInteraction() {
    this.currentView = 'interact'
  }

  private navigateToHome() {
    this.currentView = 'home'
  }

  private renderHomeView() {
    return html`
      <div class="payment-content">
        <div class="widget-header">
          <h5>${this.config.widgetTitleText || 'Support Me'}</h5>
          <p>
            ${this.config.widgetDescriptionText ||
            'Enter your wallet address to make a payment'}
          </p>
        </div>
        <form class="payment-form" @submit=${this.handleSubmit}>
          <div class="form-group">
            <label class="form-label">Pay From</label>
            <input
              class="form-input"
              type="text"
              name="walletAddress"
              placeholder="https://ilp.example.com/alice"
              required
            />
          </div>

          <button class="support-button" type="submit">
            ${this.config.action || 'Support Me'}
          </button>
        </form>

        <div class="powered-by">
          Powered by
          <a href="https://webmonetization.org" target="_blank">Interledger</a>
        </div>
      </div>
    `
  }

  private renderConfirmationView() {
    return html`
      <wm-payment-confirmation
        .configController=${this.configController}
        .note=${this.config.note || ''}
        .requestQuote=${this.requestQuote}
        .requestPayment=${this.requestPayment}
        @back=${this.navigateToHome}
        @payment-confirmed=${this.navigateToInteraction}
      ></wm-payment-confirmation>
    `
  }

  private renderInteractionView() {
    return html`
      <wm-payment-interaction
        .configController=${this.configController}
        .requestPayment=${this.requestPayment}
        @interaction-cancelled=${this.handleInteractionCancelled}
        @back=${this.navigateToHome}
      ></wm-payment-interaction>
    `
  }

  render() {
    const triggerIcon = this.config.widgetTriggerIcon || defaultTriggerIcon

    return html`
      <div class="wm_widget">
        <div class="content ${this.isOpen ? 'open' : 'closed'}">
          ${this.renderCurrentView()}
        </div>

        <div class="trigger" @click=${this.toggleWidget}>
          <img src="${triggerIcon}" alt="widget trigger" />
        </div>
      </div>
    `
  }
}

export interface WidgetState {
  walletAddress: WalletAddress
  incomingPaymentGrant: Grant
  quote: Quote
  outgoingPaymentGrant: PendingGrant
  debitAmount: string
  receiveAmount: string
  receiverPublicName?: string
  note?: string
}

export class WidgetController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private _config!: WidgetConfig
  private _state!: WidgetState

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host
    host.addController(this)
  }

  /** called when the host is connected to the DOM */
  hostConnected() {}

  /** called when the host is disconnected from the DOM */
  hostDisconnected() {}

  get config(): WidgetConfig {
    return this._config
  }

  get state(): WidgetState {
    return this._state
  }

  updateConfig(updates: Partial<WidgetConfig>) {
    this._config = { ...this._config, ...updates }

    this.applyTheme(this.host)
    this.host.requestUpdate()
  }

  updateState(updates: Partial<WidgetState>) {
    this._state = { ...this._state, ...updates }
    this.host.requestUpdate()
  }

  getCurrencySymbol(assetCode: string): string {
    const isISO4217Code = (code: string): boolean => {
      return code.length === 3
    }

    if (!isISO4217Code(assetCode)) {
      return assetCode.toUpperCase()
    }
    return new Intl.NumberFormat('en-US', {
      currency: assetCode,
      style: 'currency',
      currencyDisplay: 'symbol',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    })
      .format(0)
      .replace(/0/g, '')
      .trim()
  }

  getFormattedAmount = (args: FormatAmountArgs): FormattedAmount => {
    const { value, assetCode, assetScale } = args
    const formatterWithCurrency = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: assetCode,
      maximumFractionDigits: assetScale,
      minimumFractionDigits: assetScale
    })
    const formatter = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: assetScale,
      minimumFractionDigits: assetScale
    })

    const amount = Number(formatter.format(Number(`${value}e-${assetScale}`)))
    const amountWithCurrency = formatterWithCurrency.format(
      Number(`${value}e-${assetScale}`)
    )
    const symbol = this.getCurrencySymbol(assetCode)

    return {
      amount,
      amountWithCurrency,
      symbol
    }
  }

  applyTheme(element: HTMLElement) {
    const theme = this._config.theme
    if (!theme) return

    if (theme.primaryColor) {
      element.style.setProperty('--wm-primary-color', theme.primaryColor)
    }
    if (theme.backgroundColor) {
      element.style.setProperty('--wm-background-color', theme.backgroundColor)
    }
    if (theme.textColor) {
      element.style.setProperty('--wm-text-color', theme.textColor)
    }
    if (theme.fontFamily) {
      element.style.setProperty('--wm-font-family', theme.fontFamily)
    }
    if (theme.widgetButtonBackgroundColor) {
      element.style.setProperty(
        '--wm-widget-trigger-bg-color',
        theme.widgetButtonBackgroundColor
      )
    }
  }
}
