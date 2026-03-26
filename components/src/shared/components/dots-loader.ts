import { LitElement, html, css } from 'lit'

export class DotsLoader extends LitElement {
  /* background-color: oklch
   * resolves to white or black based on --primary-color lightness.
   * We use oklch instead of contrast-color() due to limited browser support for contrast-color (Safari/Firefox only as of 2026).
   * Reference: https://css-tricks.com/approximating-contrast-color-with-other-css-features/ */
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
    return html`
      <span role="status" aria-label="Loading" style="display:contents">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </span>
    `
  }
}
