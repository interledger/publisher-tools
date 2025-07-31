import './views/confirmation/confirmation.js'
import './views/interaction/interaction.js'

import { LitElement, html, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import { WidgetController } from './controller'
import {
  checkHrefFormat,
  getWalletAddress,
  normalizeWalletAddress,
  toWalletAddressUrl
} from '@shared/utils'
import type { WalletAddress } from '@interledger/open-payments'
import type { WidgetConfig } from './types'

import defaultTriggerIcon from '../assets/wm_logo_animated.svg'
import closeButtonIcon from '../assets/wm_close_button.svg'
import walletTotemIcon from '../assets/wm_wallet_totem.svg'
import interledgerLogoIcon from '../assets/interledger_logo.svg'
import widgetStyles from './widget.css?raw'

const defaultDescription =
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

  static styles = unsafeCSS(widgetStyles)

  private async handleSubmit(e: Event) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const walletAddress = String(formData.get('walletAddress') ?? '')

    if (this.isPreview && !walletAddress) {
      this.configController.updateState({
        walletAddress: {
          id: 'https://ilp.dev/mock-wallet',
          assetCode: 'USD',
          assetScale: 2,
          authServer: 'https://auth.interledger.cards',
          resourceServer: 'https://ilp.dev',
          publicName: 'Mock Wallet (Preview)'
        }
      })
      this.currentView = 'confirmation'
      return
    }

    if (!walletAddress) {
      this.walletAddressError = 'Please fill out your wallet address.'
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

      <div class="widget-body">
        <p>${this.config.widgetDescriptionText || defaultDescription}</p>

        <form class="payment-form" @submit=${this.handleSubmit}>
          <div class="form-wallet-address">
            <label class="form-label">
              Pay from
              <span class="red-text"> * </span>
            </label>

            <input
              class="form-input ${this.walletAddressError ? 'error' : ''}"
              type="text"
              name="walletAddress"
              placeholder="Enter your wallet address"
            />

            ${this.walletAddressError
              ? html`<div class="error-message">
                  ${this.walletAddressError}
                </div>`
              : ''}
          </div>

          <button class="primary-button" type="submit">
            ${this.config.action || 'Support me'}
          </button>
        </form>
      </div>
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
