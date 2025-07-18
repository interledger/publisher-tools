import '../confirmation.js'
import '../interaction.js'

import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { WidgetController } from './controller';
import type { WidgetConfig, WalletAddress } from './types';
import { widgetStyles } from './styles.js';

import defaultTriggerIcon from '../assets/wm_logo_animated.svg';
import closeButtonIcon from '../assets/wm_close_button.svg';
import walletTotemIcon from '../assets/wm_wallet_totem.svg';
import interledgerLogoIcon from '../assets/interledger_logo.svg';

export class PaymentWidget extends LitElement {
  private configController = new WidgetController(this);

  @property({ type: Object })
  set config(value: Partial<WidgetConfig>) {
    this.configController.updateConfig(value)
  }
  get config() {
    return this.configController.config
  }

  @property({ type: Boolean }) isOpen = false;
  @property({ type: Boolean }) requestQuote?: boolean = true;
  @property({ type: Boolean }) requestPayment?: boolean = true;

  @state() private currentView: string = 'home';

  static styles = widgetStyles

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
  };

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

  // Always have 'home' screen when opening the widget
  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('isOpen') && this.isOpen) {
      this.currentView = 'home';
    }
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
      <div class="widget-header-container coloured">
        <div class="widget-header">
          <img src=${walletTotemIcon} alt="header wallet totem" />
          <p class="white-text">${this.config.widgetTitleText || 'Support Me'}</p>
        </div>
        <img class="close-button" 
          src=${closeButtonIcon} alt="close widget" 
          @click=${this.toggleWidget}
        />
      </div>

      <div class="widget-body margin-top-24">
        <p>
          ${this.config.widgetDescriptionText || 'Enter your wallet address to make a payment'}
        </p>
        
        <form class="payment-form" @submit=${this.handleSubmit}>
          <div class="form-wallet-address">
            <label class="form-label">
              Pay from
              <label class="red-text">
              *
              </label>
            </label>

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
        @close=${this.toggleWidget}
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

          <div class="widget-footer">
            <div class="delimiter"></div>
            <div class="powered-by">
              Powered by
              <a href="https://webmonetization.org" target="_blank">
                <img src=${interledgerLogoIcon} />
              </a>
            </div>
          </div>
        </div>

        <div class="trigger" @click=${this.toggleWidget}>
          <img src="${triggerIcon}" alt="widget trigger" />
        </div>
      </div>
    `
  }
}
