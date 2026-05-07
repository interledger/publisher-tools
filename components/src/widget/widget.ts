import { LitElement, html, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { WalletAddressInfo } from 'publisher-tools-api'
import interledgerLogoIcon from '@c/assets/interledger_logo.svg'
import defaultTriggerIcon from '@c/assets/wm_logo_animated.svg'
import {
  type Controller,
  NO_OP_CONTROLLER,
  WidgetController,
} from './controller'
import type { WidgetConfig } from './types'
import { PaymentConfirmation } from './views/confirmation/confirmation'
import { HomeView, type SubmitEventDetail } from './views/home/home'
import { PaymentInteraction } from './views/interaction/interaction'
import styles from './widget.css?raw'

const COMPONENTS = {
  'wm-payment-home': HomeView,
  'wm-payment-confirmation': PaymentConfirmation,
  'wm-payment-interaction': PaymentInteraction,
}

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

  @state() private currentView: 'home' | 'confirmation' | 'interact' = 'home'

  static styles = unsafeCSS(styles)

  connectedCallback(): void {
    super.connectedCallback()
    for (const [name, elConstructor] of Object.entries(COMPONENTS)) {
      if (!customElements.get(name)) {
        customElements.define(name, elConstructor)
      }
    }
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
      this.configController.updateState({
        walletAddress: walletInfo,
        receiver: await this.#receiver,
      })
      this.currentView = 'confirmation'
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

  private renderConfirmationView() {
    return html`
      <wm-payment-confirmation
        .configController=${this.configController}
        .controller=${this.#controller}
        .note=${this.config.note || ''}
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
        .controller=${this.#controller}
        @interaction-cancelled=${this.handleInteractionCancelled}
        @back=${this.navigateToHome}
      ></wm-payment-interaction>
    `
  }

  render() {
    if (!this.config) {
      return html``
    }
    const isPreview = !!this.#controller.isPreviewMode
    const triggerIcon = this.config.profile?.icon.value || defaultTriggerIcon

    return html`
      <div
        class="content ${this.isOpen ? 'open' : 'closed'} ${isPreview
          ? 'preview-mode'
          : ''}"
      >
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
