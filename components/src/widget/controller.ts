import type {
  Grant,
  Quote,
  PendingGrant,
  WalletAddress
} from '@interledger/open-payments'
import { WIDGET_POSITION, BORDER_RADIUS } from '@shared/types'
import type { FontFamilyKey, BorderRadiusKey } from '@shared/types'
import { applyFontFamily } from '../utils.js'
import type { WidgetConfig, FormatAmountArgs, FormattedAmount } from './types'
import type { ReactiveController, ReactiveControllerHost } from 'lit'

export interface WidgetState {
  walletAddress: WalletAddress
  incomingPaymentGrant: Grant
  quote: Quote
  outgoingPaymentGrant: PendingGrant
  paymentId: string
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
    this.applyPosition()
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

  private applyBorderRadius(borderRadius: BorderRadiusKey) {
    const borderRadiusValue = BORDER_RADIUS[borderRadius]
    this.host.style.setProperty(
      '--wm-border-radius',
      borderRadiusValue || BORDER_RADIUS.None
    )
  }

  private applyPosition() {
    this.host.classList.remove('position-left', 'position-right')

    const position = this._config.widgetPosition || WIDGET_POSITION.Right
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
      this.applyFontFamily(theme.fontFamily)
    }
    if (theme.fontSize) {
      element.style.setProperty('--wm-font-size', `${theme.fontSize}px`)
    }
    if (theme.widgetBorderRadius) {
      element.style.setProperty(
        '--wm-widget-border-radius',
        theme.widgetBorderRadius
      )
    }
    if (theme.widgetBorderRadius) {
      this.applyBorderRadius(theme.widgetBorderRadius)
    }
    if (theme.widgetButtonBackgroundColor) {
      element.style.setProperty(
        '--wm-widget-trigger-bg-color',
        theme.widgetButtonBackgroundColor
      )
    }
  }
}
