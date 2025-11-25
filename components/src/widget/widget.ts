import './views/confirmation/confirmation.js'
import './views/interaction/interaction.js'
import type { WalletAddress } from '@interledger/open-payments'
import {
  checkHrefFormat,
  getWalletAddress,
  normalizeWalletAddress,
  toWalletAddressUrl
} from '@shared/utils'
import { LitElement, html, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import { WidgetController } from './controller'
import type { WidgetConfig } from './types'
import widgetStyles from './widget.css?raw'
import interledgerLogoIcon from '../assets/interledger_logo.svg'
import closeButtonIcon from '../assets/wm_close_button.svg'
import defaultTriggerIcon from '../assets/wm_logo_animated.svg'
import walletTotemIcon from '../assets/wm_wallet_totem.svg'

const DEFAULT_WIDGET_DESCRIPTION =
  'Experience the new way to support our content. Activate Web Monetization in your browser. Every visit helps us keep creating the content you love! You can also support us by a one time donation below!'

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
  @property({ type: Boolean }) isPreview?: boolean = false

  @state() private currentView: string = 'home'
  @state() private walletAddressError: string = ''
  @state() private isSubmitting: boolean = false

  static styles = unsafeCSS(widgetStyles)

  private async handleSubmit(e: Event) {
    e.preventDefault()
    this.isSubmitting = true

    const formData = new FormData(e.target as HTMLFormElement)
    const walletAddress = String(formData.get('walletAddress') ?? '')

    if (this.isPreview && !walletAddress) {
      this.previewWalletAddress()
      this.isSubmitting = false
      return
    }

    if (!walletAddress.trim()) {
      this.walletAddressError = 'Please fill out your wallet address.'
      this.isSubmitting = false
      return
    }

    let walletAddressInfo: WalletAddress
    try {
      const walletAddressUrl = checkHrefFormat(
        toWalletAddressUrl(walletAddress)
      )

      walletAddressInfo = await getWalletAddress(walletAddressUrl)

      this.configController.updateState({
        walletAddress: {
          ...walletAddressInfo,
          id: normalizeWalletAddress(walletAddressInfo)
        }
      })
      this.walletAddressError = ''
      this.currentView = 'confirmation'
    } catch (error) {
      if (error instanceof Error) {
        this.walletAddressError = error.message
      } else {
        this.walletAddressError = 'Network error. Please try again.'
      }
    } finally {
      this.isSubmitting = false
    }
  }

  private toggleWidget() {
    this.isOpen = !this.isOpen

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

  private handleInputChange() {
    if (this.walletAddressError) {
      this.walletAddressError = ''
    }
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

  private previewWalletAddress() {
    this.configController.updateState({
      walletAddress: {
        id: 'https://ilp.dev/mock-wallet',
        assetCode: 'USD',
        assetScale: 2,
        authServer: 'https://auth.interledger.cards',
        resourceServer: 'https://ilp.dev',
        publicName: 'Wallet (Preview)'
      }
    })
    this.currentView = 'confirmation'
  }

  private renderHomeView() {
    const description =
      this.config.widgetDescriptionText || DEFAULT_WIDGET_DESCRIPTION
    const showDescription = this.config.isWidgetDescriptionVisible ?? true
    const descriptionElement = showDescription
      ? html`<p>${description}</p>`
      : html`<div class="divider" />`

    return html`
      <div class="widget-header-container">
        <div class="widget-header">
          <img src=${walletTotemIcon} alt="header wallet totem" />
          <p class="white-text">
            ${this.config.widgetTitleText || 'Future of support'}
          </p>
        </div>
        <button
          class="close-button"
          @click=${this.toggleWidget}
          aria-label="Close widget"
        >
          <img src=${closeButtonIcon} alt="close widget" />
        </button>
      </div>

      <form class="payment-form widget-body" @submit=${this.handleSubmit}>
        <div class="form-wallet-address">
          ${descriptionElement}
          <label class="form-label">
            Pay from
            <span class="red-text"> * </span>
          </label>

          <input
            class="form-input ${this.walletAddressError ? 'error' : ''}"
            type="text"
            name="walletAddress"
            placeholder="Enter your wallet address"
            @input=${this.handleInputChange}
          />

          ${this.walletAddressError
            ? html`<div class="error-message">${this.walletAddressError}</div>`
            : ''}
        </div>

        <button
          class="primary-button"
          type="submit"
          ?disabled=${this.isSubmitting}
        >
          ${this.isSubmitting
            ? html`<div class="spinner"></div>`
            : this.config.action || 'Support me'}
        </button>
      </form>
    `
  }

  private renderConfirmationView() {
    return html`
      <wm-payment-confirmation
        .configController=${this.configController}
        .note=${this.config.note || ''}
        .isPreview=${this.isPreview}
        @back=${this.navigateToHome}
        @close=${this.toggleWidget}
        @payment-confirmed=${this.navigateToInteraction}
      ></wm-payment-confirmation>
    `
  }

  private renderInteractionView() {
    return html`
      <wm-payment-interaction
        .configController=${this.configController}
        .isPreview=${this.isPreview}
        @interaction-cancelled=${this.handleInteractionCancelled}
        @back=${this.navigateToHome}
      ></wm-payment-interaction>
    `
  }

  render() {
    if (!this.config) {
      return html``
    }
    const triggerIcon = this.config.widgetTriggerIcon || defaultTriggerIcon

    return html`
      <div
        class="content ${this.isOpen ? 'open' : 'closed'} ${this.isPreview
          ? 'preview-mode'
          : ''}"
      >
        ${this.renderCurrentView()}

        <div class="widget-footer">
          <div class="delimiter"></div>
          <div class="powered-by">
            Powered by
            <a href="https://webmonetization.org" target="_blank">
              <img
                src=${interledgerLogoIcon}
                height="24px"
                alt="Interledger logo"
              />
            </a>
          </div>
        </div>
      </div>

      <button
        class="trigger"
        @click=${this.toggleWidget}
        aria-label="Toggle payment widget"
      >
        <img src="${triggerIcon}" alt="widget trigger" />
      </button>
    `
  }
}
