import { LitElement, css, html } from 'lit'
import { property } from 'lit/decorators.js'

export class CloseBtn extends LitElement {
  @property({ type: String }) color: string = 'currentColor'

  static styles = css`
    button {
      border: none;
      background: none;
      cursor: pointer;
      padding: 0px;
      border-radius: 8px;
      width: 25px;
      height: 25px;
      aspect-ratio: 1/1;
    }

    button:hover {
      border-radius: 8px;
      background-color: rgba(0, 0, 0, 0.05);
    }
  `

  render() {
    return html` <button
      aria-label="Close window"
      @click=${() =>
        this.dispatchEvent(new CustomEvent('close', { bubbles: true }))}
    >
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M5.33219 15.2575L4.74219 14.6675L9.40885 10.0008L4.74219 5.33414L5.33219 4.74414L9.99885 9.41081L14.6655 4.74414L15.2555 5.33414L10.5889 10.0008L15.2555 14.6675L14.6655 15.2575L9.99885 10.5908L5.33219 15.2575Z"
          fill=${this.color}
        />
      </svg>
    </button>`
  }
}
