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
      /* Resolves to white or black based on --primary-color lightness.
       * Uses oklch instead of contrast-color(). contrast-color is unsupported in Chrome,
       * and has issues inside custom elements (shadow DOM) even where partially supported.
       * Reference: https://css-tricks.com/approximating-contrast-color-with-other-css-features/ */
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

    @media (prefers-reduced-motion: reduce) {
      :host {
        align-items: center;
      }

      span {
        animation-name: circles-fade;
      }

      @keyframes circles-fade {
        0% {
          opacity: 1;
        }
        100% {
          opacity: 0.2;
        }
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
