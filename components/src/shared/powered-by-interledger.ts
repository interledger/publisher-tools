import { LitElement, css, html, unsafeCSS } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import interledgerLogo from '@c/assets/interledger_logo.svg?raw'

const styles = css`
  p {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  svg {
    height: var(--image-height, 1.5rem);
  }
`

export class PoweredByInterledger extends LitElement {
  static styles = unsafeCSS(styles)

  render() {
    return html` <p>powered by ${unsafeSVG(interledgerLogo)}</p> `
  }
}
