import { LitElement, html, css } from 'lit'
import { getContrastColor } from '@c/utils'

export class DotsLoader extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      gap: 6px;
      align-items: flex-end;
      height: 20px;
    }

    span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--Colors-silver-800, #676767);
      background-color: color-mix(
        in srgb,
        contrast-color(var(--primary-color, white)) 75%,
        transparent
      );
      animation: circles-bounce 500ms infinite ease-in alternate;
    }

    span:nth-child(2) {
      animation-delay: 150ms;
    }

    span:nth-child(3) {
      animation-delay: 300ms;
    }

    span:nth-child(4) {
      animation-delay: 450ms;
    }

    @keyframes circles-bounce {
      0% {
        transform: translateY(0);
      }
      100% {
        transform: translateY(-10px);
      }
    }
  `

  firstUpdated(): void {
    if (!CSS.supports('color: contrast-color(black)')) {
      const theme = getComputedStyle(this).getPropertyValue('--primary-color')
      const color = getContrastColor(theme)
      this.renderRoot.querySelectorAll('span').forEach((span) => {
        span.style.backgroundColor = color
      })
    }
  }

  render() {
    return html`<span></span><span></span><span></span><span></span>`
  }
}
