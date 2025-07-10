import {
  html,
  css,
  LitElement,
  type ReactiveController,
  type ReactiveControllerHost
} from 'lit'
import { property, state } from 'lit/decorators.js'
import defaultLogo from './assets/wm_logo_animated.svg?url'

export interface BannerConfig {
  bannerTitleText?: string
  bannerDescriptionText?: string
  bannerBorderRadius?: string
  bannerPosition?: 'Top' | 'Bottom'
  bannerSlideAnimation?: 'Down' | 'None'
  theme?: {
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
    fontFamily?: string
    fontSize?: number
  }
  logo?: string
}

export class PaymentBanner extends LitElement {
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

  static styles = css`
    :host {
      display: block;
      font-family: var(--wm-font-family, system-ui, sans-serif);
      --primary-color: var(--wm-primary-color, #7f76b2);
      --background-color: var(--wm-background-color, #ffffff);
      --text-color: var(--wm-text-color, #000000);
      --font-size: var(--wm-font-size, 16px);
      --border-radius: var(--wm-border-radius, 4px);
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    .banner {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--background-color);
      border: 1px solid transparent;
      border-radius: var(--border-radius);
      padding: 12px;
      position: relative;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    /* Tablet styles */
    @media (max-width: 768px) {
      .banner {
        padding: 10px;
        gap: 12px;
      }
    }

    /* Mobile styles */
    @media (max-width: 480px) {
      .banner {
        flex-direction: column;
        align-items: flex-start;
        padding: 12px;
        gap: 12px;
        text-align: left;
      }
    }
    .banner.hidden {
      display: none;
    }

    /* Animation classes */
    .banner.slide-down-preview {
      max-height: 0px;
      transform: translateY(-40px);
      animation: slideDownPreview 2s ease-in-out forwards;
    }
    .banner.slide-up-preview {
      max-height: 0px;
      transform: translateY(40px);
      animation: slideUpPreview 2s ease-in-out forwards;
    }

    .banner.fade-in-preview {
      animation: fadeInPreview 2s ease-in-out forwards;
    }
    @keyframes slideUpPreview {
      0% {
        max-height: 0px;
        transform: translateY(40px);
        opacity: 0;
      }
      50% {
        max-height: 300px;
        transform: translateY(0px);
        opacity: 1;
      }
      100% {
        max-height: 300px;
        transform: translateY(0px);
        opacity: 1;
      }
    }
    @keyframes slideDownPreview {
      0% {
        max-height: 0px;
        transform: translateY(-40px);
        opacity: 0;
      }
      50% {
        max-height: 300px;
        transform: translateY(0px);
        opacity: 1;
      }
      100% {
        max-height: 300px;
        transform: translateY(0px);
        opacity: 1;
      }
    }

    @keyframes fadeInPreview {
      0% {
        opacity: 0.3;
        transform: scale(0.95);
      }
      50% {
        opacity: 1;
        transform: scale(1.02);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .banner-logo {
      width: 50px;
      flex-shrink: 0;
    }

    /* Tablet styles */
    @media (max-width: 768px) {
      .banner-logo {
        width: 45px;
      }
    }

    /* Mobile styles */
    @media (max-width: 480px) {
      .banner-logo {
        width: 40px;
        align-self: center;
      }
    }

    .banner-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    /* Mobile styles */
    @media (max-width: 480px) {
      .banner-content {
        width: 100%;
        gap: 8px;
      }
    }

    .banner-title {
      margin: 0;
      font-size: var(--font-size);
      font-weight: 700;
      color: var(--text-color);
      line-height: 1.2;
    }

    /* Tablet styles */
    @media (max-width: 768px) {
      .banner-title {
        font-size: calc(var(--font-size) * 0.9);
      }
    }

    /* Mobile styles */
    @media (max-width: 480px) {
      .banner-title {
        font-size: calc(var(--font-size) * 0.85);
        line-height: 1.3;
      }
    }

    .banner-description {
      margin: 0;
      font-size: calc(var(--font-size) * 0.75);
      color: var(--text-color);
      line-height: 1.3;
      opacity: 0.9;
    }

    /* Tablet styles */
    @media (max-width: 768px) {
      .banner-description {
        font-size: calc(var(--font-size) * 0.7);
        line-height: 1.4;
      }
    }

    /* Mobile styles */
    @media (max-width: 480px) {
      .banner-description {
        font-size: calc(var(--font-size) * 0.75);
        line-height: 1.4;
      }
    }

    .banner-link {
      margin: 0;
      font-size: calc(var(--font-size) * 0.75);
      color: var(--text-color);
      text-decoration: underline;
      cursor: pointer;
      line-height: 1.3;
    }

    /* Tablet styles */
    @media (max-width: 768px) {
      .banner-link {
        font-size: calc(var(--font-size) * 0.7);
      }
    }

    /* Mobile styles */
    @media (max-width: 480px) {
      .banner-link {
        font-size: calc(var(--font-size) * 0.75);
        margin-top: 4px;
      }
    }

    .banner-link:hover {
      opacity: 0.8;
    }

    .close-button {
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: #6b7280;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    /* Tablet styles */
    @media (max-width: 768px) {
      .close-button {
        top: 10px;
        right: 10px;
        width: 22px;
        height: 22px;
      }
    }

    /* Mobile styles */
    @media (max-width: 480px) {
      .close-button {
        top: 8px;
        right: 8px;
        width: 28px;
        height: 28px;
      }
    }

    .close-button:hover {
      background-color: #f3f4f6;
      color: #374151;
    }

    .close-button svg {
      width: 16px;
      height: 16px;
    }

    /* Mobile styles */
    @media (max-width: 480px) {
      .close-button svg {
        width: 18px;
        height: 18px;
      }
    }
  `
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
    const getWebMonetizationLinkHref = () => {
      const userAgent = navigator.userAgent
      if (userAgent.includes('Firefox')) {
        return 'https://addons.mozilla.org/en-US/firefox/addon/web-monetization-extension/'
      } else if (
        userAgent.includes('Chrome') &&
        !userAgent.includes('Edg') &&
        !userAgent.includes('OPR')
      ) {
        return 'https://chromewebstore.google.com/detail/web-monetization/oiabcfomehhigdepbbclppomkhlknpii'
      } else if (userAgent.includes('Edg')) {
        return 'https://microsoftedge.microsoft.com/addons/detail/web-monetization/imjgemgmeoioefpmfefmffbboogighjl'
      }
      return 'https://webmonetization.org/'
    }
    window.open(getWebMonetizationLinkHref(), '_blank')
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
    const title = this.config.bannerTitleText || 'How to support?'
    const description =
      this.config.bannerDescriptionText ||
      'You can support this page and my work by a one time donation or proportional to the time you spend on this website through web monetization.'

    return html`
      <div class="banner ${this.animationClass}">
        <img src="${logo}" alt="Web Monetization Logo" class="banner-logo" />

        <div class="banner-content">
          <h3 class="banner-title">${title}</h3>
          <p class="banner-description">${description}</p>
          <p class="banner-link" @click=${this.handleLinkClick}>
            Install the Web Monetization browser extension
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

customElements.define('wm-banner', PaymentBanner)

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
      let borderRadiusValue = updates.bannerBorderRadius

      switch (updates.bannerBorderRadius) {
        case 'Light':
          borderRadiusValue = '0.375rem'
          break
        case 'Pill':
          borderRadiusValue = '1rem'
          break
        case 'None':
          borderRadiusValue = '0'
          break
      }

      this.host.style.setProperty('--wm-border-radius', borderRadiusValue)
    }

    this.host.requestUpdate()
  }
  updateState(updates: Partial<BannerState>) {
    this._state = { ...this._state, ...updates }
    this.host.requestUpdate()
  }

  /**
   * Applies the specified font family to the host element, removing any existing font link,
   * loading the font if necessary, and setting the CSS custom property.
   *
   * @param fontName The name of the font family to apply.
   */
  private applyFontFamily(fontName: string) {
    const allowedFonts = [
      'Cookie',
      'Roboto',
      'Open Sans',
      'Titillium Web',
      'Arial'
    ]

    const existingFont = document.getElementById(
      'wmt-font-family-banner'
    ) as HTMLLinkElement
    if (existingFont) {
      existingFont.remove()
    }

    if (fontName === 'Inherit' || !allowedFonts.includes(fontName)) {
      this.host.style.setProperty('--wm-font-family', 'inherit')
      return
    }

    const fontLink = document.createElement('link') as HTMLLinkElement
    fontLink.id = 'wmt-font-family-banner'
    fontLink.rel = 'stylesheet'
    fontLink.type = 'text/css'

    switch (fontName) {
      case 'Open Sans':
        fontLink.href =
          'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap'
        break
      case 'Cookie':
        fontLink.href =
          'https://fonts.googleapis.com/css2?family=Cookie&display=swap'
        break
      case 'Roboto':
        fontLink.href =
          'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap'
        break
      case 'Titillium Web':
        fontLink.href =
          'https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap'
        break
      case 'Arial':
        break
    }

    if (fontLink.href && fontName !== 'Arial') {
      document.head.appendChild(fontLink)
    }

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
