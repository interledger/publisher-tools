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
      const theme = getComputedStyle(this)
        .getPropertyValue('--primary-color')
        .trim()
      const color =
        getContrastColor(theme) === '#ffffff'
          ? 'rgba(255, 255, 255, 0.75)'
          : 'rgba(0, 0, 0, 0.75)'
      this.shadowRoot!.querySelectorAll('span').forEach((span) => {
        span.style.backgroundColor = color
      })
    }
  }

  render() {
    return html`<span></span><span></span><span></span>`
  }
}

customElements.define('wm-dots-loader', DotsLoader)
