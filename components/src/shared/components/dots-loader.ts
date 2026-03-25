import { LitElement, html, css } from 'lit'
import { getContrastColor } from '@c/utils'

export class DotsLoader extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }

    span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--Colors-silver-800, #676767);
      background-color: color-mix(
        in srgb,
        contrast-color(var(--primary-color, white)) 55%,
        transparent
      );
      animation: dot-flash 1.2s infinite ease-in-out;
    }

    span:nth-child(2) {
      animation-delay: 0.2s;
    }

    span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes dot-flash {
      0%,
      80%,
      100% {
        opacity: 0.2;
      }
      40% {
        opacity: 1;
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
    return html`<span></span><span></span><span></span>`
  }
}
