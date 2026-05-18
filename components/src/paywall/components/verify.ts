import { html, LitElement, unsafeCSS } from 'lit'
import { property } from 'lit/decorators.js'
import { DotsLoader } from '@c/shared/dots-loader'
import { registerComponents } from '@c/utils'
import stylesCommon from './common.css?raw'
import styles from './verify.css?raw'
import { DEFAULTS } from '../utils'
import styleTokens from '../vars.css?raw'

export class PaywallVerify extends LitElement {
  static styles = [
    unsafeCSS(styleTokens),
    unsafeCSS(stylesCommon),
    unsafeCSS(styles),
  ]

  @property({ type: String }) title = DEFAULTS.title.text
  @property({ type: String }) description = DEFAULTS.description.text

  connectedCallback() {
    super.connectedCallback()
    registerComponents({
      'wm-dots-loader': DotsLoader,
    })
  }

  render() {
    return html`
      <h2 class="title">${this.title}</h2>
      <p class="description">${this.description}</p>

      <div class="spinner">
        <wm-dots-loader></wm-dots-loader>
        <p>Verifying payment</p>
      </div>
    `
  }
}
