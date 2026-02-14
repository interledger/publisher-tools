import {
  html,
  unsafeCSS,
  LitElement,
  type ReactiveController,
  type ReactiveControllerHost,
} from 'lit'
import { property, state } from 'lit/decorators.js'
import defaultLogo from '@c/assets/wm_logo_animated.svg?url'
import { bannerFontSizeToNumber, BORDER_RADIUS } from '@shared/types'
import type {
  FontFamilyKey,
  BorderRadiusKey,
  BannerProfile,
} from '@shared/types'
import { getExtensionHref } from '@shared/utils/extension'
import bannerStyles from './banner.css?raw'
import { applyFontFamily } from './utils.js'

const DEFAULT_BANNER_TITLE = 'How to support?'
const DEFAULT_BANNER_DESCRIPTION =
  'You can support this page and my work by a one time donation or proportional to the time you spend on this website through web monetization.'
const DEFAULT_BANNER_LINK_TEXT =
  'Install the Web Monetization browser extension'

interface Props extends BannerProfile {
  cdnUrl: string
}

export class Banner extends LitElement {
  private configController = new BannerController(this)

  @property({ type: Object })
  set config(value: Props) {
    this.configController.updateConfig(value)
  }
  get config() {
    return this.configController.config
  }
  @property({ type: Boolean }) isVisible = true

  @state() private isDismissed = false
  @state() private isAnimating = false
  @state() private animationClass = ''
  connectedCallback() {
    super.connectedCallback()
    this.previewAnimation()
  }

  static styles = unsafeCSS(bannerStyles)
  private handleClose() {
    this.isDismissed = true
    this.requestUpdate()

    this.dispatchEvent(
      new CustomEvent('banner-closed', {
        detail: { dismissed: true },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleLinkClick() {
    // TODO: do anything other than open the link in a new tab, like analytics, showing some thank you message etc.
  }

  /**
   * Triggers the preview animation for the banner.
   * If the banner was previously dismissed, it will be shown again before animating.
   */
  public previewAnimation() {
    if (this.isAnimating) return

    this.isDismissed = false
    this.isAnimating = true
    const position = this.config.position || 'Bottom'

    if (this.config.animation.type === 'FadeIn') {
      this.animationClass = 'fade-in-preview'
    } else if (this.config.animation.type === 'Slide') {
      this.animationClass =
        position === 'Top' ? 'slide-down-preview' : 'slide-up-preview'
    } else {
      this.animationClass = ''
    }

    this.requestUpdate()

    setTimeout(() => {
      this.isAnimating = false
      this.animationClass = ''
      this.requestUpdate()
    }, 2000)
  }

  render() {
    if (!this.isVisible || this.isDismissed) {
      return html``
    }

    const title = this.config.title.text || DEFAULT_BANNER_TITLE
    const description =
      this.config.description.text || DEFAULT_BANNER_DESCRIPTION

    const showThumbnail =
      typeof this.config.thumbnail === 'undefined' || !!this.config.thumbnail
    const thumbnail = showThumbnail
      ? html`<img
          src="${defaultLogo}"
          alt="Web Monetization Logo"
          class="banner-logo"
        />`
      : html``

    const showDescription = this.config.description.isVisible ?? true
    const descriptionElement = showDescription
      ? html`<p class="banner-description">${description}</p>`
      : null

    return html`
      <div class="banner ${this.animationClass}">
        ${thumbnail}

        <div class="banner-content">
          <h3 class="banner-title">${title}</h3>
          ${descriptionElement}
          <a
            class="banner-link"
            href="${this.extensionUrl}"
            target="_blank"
            rel="noopener noreferrer"
            @click=${this.handleLinkClick}
          >
            ${DEFAULT_BANNER_LINK_TEXT}
          </a>
        </div>

        <button
          class="close-button"
          @click=${this.handleClose}
          aria-label="Close banner"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `
  }

  get extensionUrl(): string {
    return getExtensionHref('banner')
  }
}

interface BannerState {
  isVisible: boolean
  isDismissed: boolean
}

export class BannerController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private _config!: Props
  private _state: BannerState = {
    isVisible: true,
    isDismissed: false,
  }

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host
    host.addController(this)
  }
  /** called when the host is connected to the DOM */
  hostConnected() {}

  /** called when the host is disconnected from the DOM */
  hostDisconnected() {}

  get config(): Props {
    return this._config
  }

  get state(): BannerState {
    return this._state
  }
  updateConfig(updates: Partial<Props>) {
    this._config = { ...this._config, ...updates }

    this.applyTheme(this.host)

    if (updates.border) {
      this.applyBorderRadius(updates.border.type)
    }

    if (updates.position) {
      this.applyPosition()
    }

    this.host.requestUpdate()
  }

  updateState(updates: Partial<BannerState>) {
    this._state = { ...this._state, ...updates }
    this.host.requestUpdate()
  }

  /**
   * Applies the specified border radius to the host element.
   *
   * @param borderRadius The border radius value to apply.
   */
  private applyBorderRadius(borderRadius: BorderRadiusKey) {
    const borderRadiusValue = BORDER_RADIUS[borderRadius]
    this.host.style.setProperty(
      '--wm-border-radius',
      borderRadiusValue || BORDER_RADIUS.None,
    )
  }

  /**
   * Applies the specified position to the host element.
   */
  applyPosition() {
    this.host.classList.remove('position-top', 'position-bottom')

    const position = this._config.position || 'Bottom'
    if (position === 'Top') {
      this.host.classList.add('position-top')
    } else {
      this.host.classList.add('position-bottom')
    }
  }

  /**
   * Applies the specified font family to the host element.
   *
   * @param fontName The name of the font family to apply.
   */
  private applyFontFamily(fontName: FontFamilyKey) {
    const fontBaseUrl = new URL('/assets/fonts/', this.config.cdnUrl).href
    applyFontFamily(this.host, fontName, 'banner', fontBaseUrl)
  }

  applyTheme(element: HTMLElement) {
    const { color, font } = this.config
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
        bannerFontSizeToNumber(font.size) + 'px',
      )
    }
  }
}
