import { LitElement, html, css } from 'lit'

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
      background-color: oklch(from var(--primary-color) round(1.21 - L) 0 0);
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

  render() {
    return html`<span></span><span></span><span></span><span></span>`
  }
}
