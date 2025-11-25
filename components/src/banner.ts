import { BORDER_RADIUS } from '@shared/types'
import type {
  FontFamilyKey,
  BorderRadiusKey,
  SlideAnimationType,
  BannerPositionKey
} from '@shared/types'
import {
  html,
  unsafeCSS,
  LitElement,
  type ReactiveController,
  type ReactiveControllerHost
} from 'lit'
import { property, state } from 'lit/decorators.js'
import defaultLogo from './assets/wm_logo_animated.svg?url'
import bannerStyles from './banner.css?raw'
import { getWebMonetizationLinkHref, applyFontFamily } from './utils.js'

const DEFAULT_BANNER_TITLE = 'How to support?'
const DEFAULT_BANNER_DESCRIPTION =
  'You can support this page and my work by a one time donation or proportional to the time you spend on this website through web monetization.'
const DEFAULT_BANNER_LINK_TEXT =
  'Install the Web Monetization browser extension'

export interface BannerConfig {
  bannerTitleText?: string
  bannerDescriptionText?: string
  isBannerDescriptionVisible?: boolean
  bannerBorderRadius?: BorderRadiusKey
  bannerPosition?: BannerPositionKey
  bannerSlideAnimation?: SlideAnimationType
  bannerThumbnail?: string
  theme?: {
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
    fontFamily?: FontFamilyKey
    fontSize?: number
  }
  logo?: string
  cdnUrl: string
}

export class Banner extends LitElement {
  private configController = new BannerController(this)

  @property({ type: Object })
  set config(value: Partial<BannerConfig>) {
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
        composed: true
      })
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
    const position = this.config.bannerPosition || 'Bottom'

    if (this.config.bannerSlideAnimation === 'FadeIn') {
      this.animationClass = 'fade-in-preview'
    } else if (this.config.bannerSlideAnimation === 'Slide') {
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

    const logo = this.config.logo || defaultLogo
    const title = this.config.bannerTitleText || DEFAULT_BANNER_TITLE
    const description =
      this.config.bannerDescriptionText || DEFAULT_BANNER_DESCRIPTION

    const showThumbnail =
      typeof this.config.bannerThumbnail === 'undefined' ||
      !!this.config.bannerThumbnail
    const thumbnail = showThumbnail
      ? html`<img
          src="${logo}"
          alt="Web Monetization Logo"
          class="banner-logo"
        />`
      : html``

    const showDescription = this.config.isBannerDescriptionVisible ?? true
    const descriptionElement = showDescription
      ? html`<p class="banner-description">${description}</p>`
      : null

    const extensionLink = getWebMonetizationLinkHref(navigator.userAgent)

    return html`
      <div class="banner ${this.animationClass}">
        ${thumbnail}

        <div class="banner-content">
          <h3 class="banner-title">${title}</h3>
          ${descriptionElement}
          <a
            class="banner-link"
            href="${extensionLink}"
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
}

interface BannerState {
  isVisible: boolean
  isDismissed: boolean
}

export class BannerController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private _config!: BannerConfig
  private _state: BannerState = {
    isVisible: true,
    isDismissed: false
  }

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host
    host.addController(this)
  }
  /** called when the host is connected to the DOM */
  hostConnected() {}

  /** called when the host is disconnected from the DOM */
  hostDisconnected() {}

  get config(): BannerConfig {
    return this._config
  }

  get state(): BannerState {
    return this._state
  }
  updateConfig(updates: Partial<BannerConfig>) {
    this._config = { ...this._config, ...updates }

    this.applyTheme(this.host)

    if (updates.bannerBorderRadius) {
      this.applyBorderRadius(updates.bannerBorderRadius)
    }

    if (updates.bannerPosition) {
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
      borderRadiusValue || BORDER_RADIUS.None
    )
  }

  /**
   * Applies the specified position to the host element.
   */
  applyPosition() {
    this.host.classList.remove('position-top', 'position-bottom')

    const position = this._config.bannerPosition || 'Bottom'
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
    const theme = this.config.theme
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
  }
}
