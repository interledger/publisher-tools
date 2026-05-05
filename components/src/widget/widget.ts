import { LitElement, html, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { WalletAddressInfo } from 'publisher-tools-api'
import interledgerLogoIcon from '@c/assets/interledger_logo.svg'
import defaultTriggerIcon from '@c/assets/wm_logo_animated.svg'
import walletTotemIcon from '@c/assets/wm_wallet_totem.svg'
import { CloseBtn } from '@c/shared/components/close-btn'
import { DotsLoader } from '@c/shared/components/dots-loader'
import {
  type Controller,
  NO_OP_CONTROLLER,
  WidgetController,
} from './controller'
import type { WidgetConfig } from './types'
import { PaymentConfirmation } from './views/confirmation/confirmation'
import { PaymentInteraction } from './views/interaction/interaction'
import widgetStyles from './widget.css?raw'

const COMPONENTS = {
  'wm-payment-confirmation': PaymentConfirmation,
  'wm-payment-interaction': PaymentInteraction,
  'wm-dots-loader': DotsLoader,
  'wm-close-btn': CloseBtn,
}

const DEFAULT_WIDGET_DESCRIPTION =
  'Experience the new way to support our content. Activate Web Monetization in your browser. Every visit helps us keep creating the content you love! You can also support us by a one time donation below!'

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

  @state() private currentView: string = 'home'
  @state() private walletAddressError: string = ''
  @state() private isSubmitting: boolean = false

  static styles = unsafeCSS(widgetStyles)

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

  private async handleSubmit(e: Event) {
    e.preventDefault()
    this.isSubmitting = true

    const formData = new FormData(e.target as HTMLFormElement)
    const walletAddress = String(formData.get('walletAddress') ?? '')

    try {
      if (!walletAddress.trim() && !this.#controller.isPreviewMode) {
        throw new Error('Please fill out your wallet address.')
      }
      const walletInfo = await this.#controller.getWallet(walletAddress)
      this.configController.updateState({
        walletAddress: walletInfo,
        receiver: await this.#receiver,
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
        composed: true,
      }),
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

  private renderHomeView() {
    const { profile } = this.configController.config
    const description = profile?.description.text || DEFAULT_WIDGET_DESCRIPTION
    const showDescription = profile?.description.isVisible ?? true
    const descriptionElement = showDescription
      ? html`<p>${description}</p>`
      : html`<div class="divider" />`

    return html`
      <div class="widget-header-container">
        <div class="widget-header">
          <img src=${walletTotemIcon} alt="header wallet totem" />
          <p class="white-text">
            ${profile?.title.text || 'Future of support'}
          </p>
        </div>

        <wm-close-btn
          @click=${this.toggleWidget}
          .color=${profile.color.background}
        ></wm-close-btn>
      </div>

      <form class="payment-form widget-body" @submit=${this.handleSubmit}>
        ${descriptionElement}

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
            ? html`<wm-dots-loader></wm-dots-loader>`
            : profile?.ctaPayButton.text || 'Support me'}
        </button>
      </form>
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
