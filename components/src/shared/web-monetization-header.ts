import { LitElement, css, html, unsafeCSS } from 'lit'
import { property } from 'lit/decorators.js'
import wmLogo from '@c/assets/wm_logo_animated.svg'

const styles = css`
  .header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.5rem;

    img {
      height: var(--img-height, 1.5rem);
    }

    h1 {
      font-size: var(--font-size, 1rem);
      font-weight: 400;
      line-height: var(--line-height, 1.4rem);
      color: var(--heading-color);
    }
  }

  @media (min-width: 480px) {
    .header[data-size='large'] {
      --img-height: 3.5rem;
      --font-size: 1.7rem;
      --line-height: 2.5rem;
    }
  }
`

export class WebMonetizationHeader extends LitElement {
  static styles = unsafeCSS(styles)

  @property({ type: String }) title = 'Web Monetization'
  @property({ type: String }) size: 'large' | 'small' = 'small'

  render() {
    return html`<div class="header" data-size="${this.size}">
      <img src="${wmLogo}" alt="" />
      <h1>${this.title}</h1>
    </div>`
  }
}
