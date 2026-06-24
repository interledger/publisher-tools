import { LitElement, html, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { WalletAddressInfo } from 'publisher-tools-api'
import interledgerLogoIcon from '@tools/components/assets/interledger_logo.svg'
import defaultTriggerIcon from '@tools/components/assets/wm_logo_animated.svg'
import { registerComponents } from '@tools/components/utils.js'
import { HomeView, type SubmitEventDetail } from './components/home.js'
import { PaymentInitiate } from './components/initiate.js'
import { PaymentWaiting } from './components/waiting.js'
import {
  type Controller,
  NO_OP_CONTROLLER,
  WidgetController,
} from './controller'
import type { WidgetConfig } from './types'
import styles from './widget.css?raw'

export class PaymentWidget extends LitElement {
  #receiver!: Promise<WalletAddressInfo>
  private configController = new WidgetController(this)

  @property({ type: Object })
  set config(value: Partial<WidgetConfig>) {
    this.configController.updateConfig(value)
    if (value.receiverAddress && !this.#receiver) {
      this.#receiver = this.#controller.getWallet(value.receiverAddress)
    }
  }

  get config() {
    return this.configController.config
  }

  @property({ type: Boolean }) isOpen = false

  @state() private currentView: 'home' | 'initiate' | 'waiting' = 'home'

  static styles = unsafeCSS(styles)

  connectedCallback(): void {
    super.connectedCallback()
    registerComponents({
      'wm-payment-home': HomeView,
      'wm-payment-initiate': PaymentInitiate,
      'wm-payment-waiting': PaymentWaiting,
    })
  }

  #controller = NO_OP_CONTROLLER
  setController(controller: Controller) {
    if (this.#controller === controller) return
    if (this.#controller !== NO_OP_CONTROLLER) {
      throw new Error('controller is already set')
    }
    this.#controller = controller
  }

  private async _handleSubmit(walletAddress: string) {
    try {
      if (!walletAddress.trim() && !this.#controller.isPreviewMode) {
        throw new Error('Please fill out your wallet address.')
      }
      const walletInfo = await this.#controller.getWallet(walletAddress)
      const receiver = await this.#receiver

      const probe = await this.#controller.probeWalletCompatibility({
        sender: walletInfo,
        receiver,
      })
      if (!probe.ok) {
        return errorMessageFor(probe.code)
      }

      this.configController.updateState({
        walletAddress: walletInfo,
        receiver,
      })
      this.currentView = 'initiate'
    } catch (error) {
      return error instanceof Error
        ? error.message
        : 'Network error. Please try again.'
    }
  }

  private async onSubmit(ev: CustomEvent<SubmitEventDetail>) {
    const { walletAddress, onComplete } = ev.detail
    const error = await this._handleSubmit(walletAddress)
    onComplete(error)
  }

  private toggleWidget() {
    this.isOpen = !this.isOpen

    this.dispatchEvent(
      new CustomEvent('widget-toggle', {
        detail: { isOpen: this.isOpen },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleInteractionCancelled() {
    this.currentView = 'initiate'
  }

  private renderCurrentView() {
    switch (this.currentView) {
      case 'home':
        return this.renderHomeView()
      case 'initiate':
        return this.renderInitiateView()
      case 'waiting':
        return this.renderWaitingView()
      default:
        return this.renderHomeView()
    }
  }

  private navigateToInteraction() {
    this.currentView = 'waiting'
  }

  private navigateToHome() {
    this.currentView = 'home'
  }

  private renderHomeView() {
    const { profile } = this.configController.config
    return html`
      <wm-payment-home
        .title=${profile.title.text}
        .description=${profile.description.text}
        .ctaText=${profile.ctaPayButton.text}
        .showDescription=${profile.description.isVisible}
        .backgroundColor=${profile.color.background}
        @close=${this.toggleWidget}
        @submit=${this.onSubmit}
      ></wm-payment-home>
    `
  }

  private renderInitiateView() {
    return html`
      <wm-payment-initiate
        .configController=${this.configController}
        .controller=${this.#controller}
        .note=${this.config.note || ''}
        @back=${this.navigateToHome}
        @close=${this.toggleWidget}
        @payment-confirmed=${this.navigateToInteraction}
      ></wm-payment-initiate>
    `
  }

  private renderWaitingView() {
    const { paymentId, grantRedirectUrl } = this.configController.state
    return html`
      <wm-payment-waiting
        .paymentId=${paymentId}
        .grantRedirectUrl=${grantRedirectUrl}
        .controller=${this.#controller}
        @interaction-cancelled=${this.handleInteractionCancelled}
        @back=${this.navigateToHome}
      ></wm-payment-waiting>
    `
  }

  render() {
    if (!this.config) {
      return html``
    }

    const triggerIcon = this.config.profile?.icon.value || defaultTriggerIcon

    return html`
      <div class="content ${this.isOpen ? 'open' : 'closed'}">
        ${this.renderCurrentView()}

        <div class="widget-footer">
          <div class="delimiter"></div>
          <div class="powered-by">
            Powered by
            <a href="https://webmonetization.org" target="_blank">
              <img src=${interledgerLogoIcon} height="24px" alt="Interledger" />
            </a>
          </div>
        </div>
      </div>

      <button
        class="trigger"
        type="button"
        @click=${this.toggleWidget}
        aria-label="Toggle payment widget"
      >
        <img src="${triggerIcon}" alt="" />
      </button>
    `
  }
}

function errorMessageFor(code: 'WALLET_MISMATCH'): string {
  switch (code) {
    case 'WALLET_MISMATCH':
      return 'Your wallet is incompatible with this page. Please try a different wallet provider.'
  }
}
