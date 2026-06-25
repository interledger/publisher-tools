import type { ReactiveController, ReactiveControllerHost } from 'lit'
import type { PaymentStatus, WalletAddressInfo } from 'publisher-tools-api'
import type { Grant, Quote, PendingGrant } from '@interledger/open-payments'
import {
  WIDGET_POSITION,
  BORDER_RADIUS,
  WIDGET_FONT_SIZE_MAP,
} from '@shared/types'
import type { FontFamilyKey, BorderRadiusKey } from '@shared/types'
import { applyFontFamily } from '../utils.js'
import type { WidgetConfig } from './types'

export interface WidgetState {
  /** sender wallet address */
  walletAddress: WalletAddressInfo
  receiver: WalletAddressInfo
  amount: number
  incomingPaymentGrant: Grant
  quote: Quote
  grantRedirectUrl: string
  paymentId: string
  debitAmount: string
  receiveAmount: string
  receiverPublicName?: string
  note?: string
}

type WalletAddressUrl = string
/** The amount sender wants to send (like "1.05"), does not include fees */
type UserAmount = number | PaymentCurrencyAmount['value']

interface QuoteInput {
  sender: WalletAddressInfo
  receiver: WalletAddressInfo
  amount: UserAmount
}
type QuoteResult =
  | { debitAmount: PaymentCurrencyAmount; receiveAmount: PaymentCurrencyAmount }
  | { error: string; minSendAmount?: PaymentCurrencyAmount }

interface InitiatePaymentInput {
  sender: WalletAddressInfo
  receiver: WalletAddressInfo
  amount: UserAmount
  note: string
}
interface InitiatePaymentResult {
  paymentId: string
  grantRedirectUrl: PendingGrant['interact']['redirect']
}

interface ProbeWalletCompatibilityInput {
  sender: WalletAddressInfo
  receiver: WalletAddressInfo
}
type ProbeWalletCompatibilityResult =
  | { ok: true }
  | { ok: false; code: 'WALLET_UNAVAILABLE' }

export interface Controller {
  getWallet(walletAddressUrl: WalletAddressUrl): Promise<WalletAddressInfo>
  probeWalletCompatibility(
    request: ProbeWalletCompatibilityInput,
  ): Promise<ProbeWalletCompatibilityResult>
  fetchQuote(request: QuoteInput): Promise<QuoteResult>
  initiatePayment(request: InitiatePaymentInput): Promise<InitiatePaymentResult>
  getStatus(
    paymentId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<PaymentStatus>

  isPreviewMode?: boolean
}

export const NO_OP_CONTROLLER: Controller = {
  getWallet(walletAddressUrl) {
    return Promise.resolve({
      $url: walletAddressUrl,
      id: walletAddressUrl,
      assetCode: 'USD',
      assetScale: 2,
      authServer: 'https://auth.example.com',
      resourceServer: 'https://resource.example.com',
      publicName: 'Wallet (Preview)',
    })
  },
  probeWalletCompatibility() {
    return Promise.resolve({ ok: true })
  },
  fetchQuote({ amount, sender, receiver }) {
    amount = String(amount)
    const debitAmount = { value: amount, currency: sender.assetCode }
    const receiveAmount = { value: amount, currency: receiver.assetCode }
    return Promise.resolve({ debitAmount, receiveAmount })
  },
  initiatePayment() {
    return Promise.resolve({
      paymentId: 'payment-id',
      grantRedirectUrl: 'https://example.com/redirect',
    })
  },
  async *getStatus() {
    yield {
      type: 'OUTGOING_PAYMENT_DONE',
      outgoingPaymentId: '',
      result: 'success',
    }
  },
}

export interface Actions {
  setScreen(screen: unknown): void
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
    this.applyPosition()
    this.host.requestUpdate()
  }

  updateState(updates: Partial<WidgetState>) {
    this._state = { ...this._state, ...updates }
    this.host.requestUpdate()
  }

  private applyBorderRadius(borderRadius: BorderRadiusKey) {
    const borderRadiusValue = BORDER_RADIUS[borderRadius]
    this.host.style.setProperty(
      '--wm-border-radius',
      borderRadiusValue || BORDER_RADIUS.None,
    )
  }

  private applyTriggerBackgroundColor(color: string) {
    this.host.style.setProperty('--wm-widget-trigger-bg-color', color)
  }

  private applyPosition() {
    this.host.classList.remove('position-left', 'position-right')

    const position = this._config.profile?.position || WIDGET_POSITION.Right
    if (position === WIDGET_POSITION.Left) {
      this.host.classList.add('position-left')
    } else {
      this.host.classList.add('position-right')
    }
  }

  private applyFontFamily(fontName: FontFamilyKey) {
    const fontBaseUrl = new URL('/assets/fonts/', this.config.cdnUrl).href
    applyFontFamily(this.host, fontName, 'widget', fontBaseUrl)
  }

  applyTheme(element: HTMLElement) {
    const { color, font, border, icon } = this._config.profile

    if (color.theme) {
      element.style.setProperty('--wm-primary-color', color.theme as string)
    }
    if (color.background) {
      element.style.setProperty(
        '--wm-background-color',
        color.background as string,
      )
    }
    if (color.text) {
      element.style.setProperty('--wm-text-color', color.text)
    }
    if (font.name) {
      this.applyFontFamily(font.name)
    }
    if (font.size) {
      element.style.setProperty(
        '--wm-font-size',
        `${WIDGET_FONT_SIZE_MAP[font.size]}px`,
      )
    }
    if (border.type) {
      this.applyBorderRadius(border.type)
    }
    if (icon.color) {
      this.applyTriggerBackgroundColor(icon.color as string)
    }
  }
}
