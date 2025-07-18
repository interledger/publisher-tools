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
import { getWebMonetizationLinkHref } from './utils.js'

const DEFAULT_BANNER_TITLE = 'How to support?'
const DEFAULT_BANNER_DESCRIPTION =
  'You can support this page and my work by a one time donation or proportional to the time you spend on this website through web monetization.'
const DEFAULT_BANNER_LINK_TEXT =
  'Install the Web Monetization browser extension'

type BorderRadiusKey = 'Light' | 'Pill' | 'None'
const BORDER_RADIUS_VALUES: Record<BorderRadiusKey, string> = {
  Light: '0.375rem',
  Pill: '1rem',
  None: '0'
}

type FontFamilyKey =
  | 'Cookie'
  | 'Roboto'
  | 'Open Sans'
  | 'Titillium Web'
  | 'Arial'
  | 'Inherit'
const FONT_FAMILY_URLS: Record<
  Exclude<FontFamilyKey, 'Arial' | 'Inherit'>,
  string
> = {
  'Open Sans':
    'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap',
  'Cookie': 'https://fonts.googleapis.com/css2?family=Cookie&display=swap',
  'Roboto':
    'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap',
  'Titillium Web':
    'https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap'
}

export interface BannerConfig {
  bannerTitleText?: string
  bannerDescriptionText?: string
  bannerBorderRadius?: BorderRadiusKey
  bannerPosition?: 'Top' | 'Bottom'
  bannerSlideAnimation?: 'Down' | 'None'
  theme?: {
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
    fontFamily?: FontFamilyKey
    fontSize?: number
  }
  logo?: string
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
    const href = getWebMonetizationLinkHref(navigator.userAgent)
    window.open(href, '_blank')
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

    if (this.config.bannerSlideAnimation === 'Down') {
      this.animationClass =
        position === 'Top' ? 'slide-down-preview' : 'slide-up-preview'
    } else {
      this.animationClass = 'fade-in-preview'
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

    return html`
      <div class="banner ${this.animationClass}">
        <img src="${logo}" alt="Web Monetization Logo" class="banner-logo" />

        <div class="banner-content">
          <h3 class="banner-title">${title}</h3>
          <p class="banner-description">${description}</p>
          <p class="banner-link" @click=${this.handleLinkClick}>
            ${DEFAULT_BANNER_LINK_TEXT}
          </p>
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
    const borderRadiusValue = BORDER_RADIUS_VALUES[borderRadius]
    this.host.style.setProperty(
      '--wm-border-radius',
      borderRadiusValue || BORDER_RADIUS_VALUES.None
    )
  }

  /**
   * Applies the specified font family to the host element, removing any existing font link,
   * loading the font if necessary, and setting the CSS custom property.
   *
   * @param fontName The name of the font family to apply.
   */
  private applyFontFamily(fontName: FontFamilyKey) {
    const existingFont = document.getElementById(
      'wmt-font-family-banner'
    ) as HTMLLinkElement
    if (existingFont) {
      existingFont.remove()
    }

    if (fontName === 'Inherit') {
      this.host.style.setProperty('--wm-font-family', 'inherit')
      return
    }

    if (fontName === 'Arial') {
      this.host.style.setProperty('--wm-font-family', fontName)
      return
    }

    const fontFamilyUrl = FONT_FAMILY_URLS[fontName]
    if (!fontFamilyUrl) {
      this.host.style.setProperty('--wm-font-family', 'inherit')
      return
    }

    const fontLink = document.createElement('link') as HTMLLinkElement
    fontLink.id = 'wmt-font-family-banner'
    fontLink.rel = 'stylesheet'
    fontLink.type = 'text/css'
    fontLink.href = fontFamilyUrl
    document.head.appendChild(fontLink)

    this.host.style.setProperty('--wm-font-family', fontName)
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
