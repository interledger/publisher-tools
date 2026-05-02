import { LitElement, html, nothing, unsafeCSS } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { getCurrencySymbol } from '@c/utils'
import styles from './amount.css?raw'
import stylesBase from '../confirmation/confirmation.css?raw'

export interface AmountChangeEventDetail {
  amount: number
}

export class PaymentAmount extends LitElement {
  #debounceTimer: ReturnType<typeof setTimeout> | null = null

  @property({ type: String }) currency = 'USD'
  @property({ type: Number }) minSendAmount = 0.5
  @property({ type: Array }) presets: number[] = [1, 5, 10]
  @property({ type: Number }) value = 0
  @property({ type: String }) externalError = ''

  @query('input') private _inputEl!: HTMLInputElement

  @state() private _internalError: string | null = null

  static styles = [unsafeCSS(stylesBase), unsafeCSS(styles)]

  connectedCallback(): void {
    super.connectedCallback()
  }

  protected firstUpdated() {
    this._inputEl.focus()
  }

  private _handleInput(e: Event) {
    const el = e.target as HTMLInputElement
    const rawValue = el.value

    // assumes assetScale=2 here
    const validFormat = /^\d*\.?\d{0,2}$/.test(rawValue)
    if (!validFormat) {
      el.value = this.value === 0 ? '' : this.value.toString()
      return
    }

    const newValue = Number.parseFloat(rawValue) || 0
    if (newValue === this.value) return
    if (Number.isNaN(newValue)) return

    this.value = newValue

    if (newValue <= 0 || newValue < this.minSendAmount) {
      if (this.minSendAmount) {
        this._internalError = `Please enter an amount greater than ${getCurrencySymbol(this.currency)}${this.minSendAmount}`
      } else {
        this._internalError = `Please enter a higher amount.`
      }
      return
    }

    this._internalError = null
    this._processUpdate()
  }

  private _handlePresetClick(presetAmount: number) {
    this._internalError = null
    this.value = presetAmount
    this._processUpdate(true)
  }

  private _processUpdate(immediate = false) {
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer)
    this.#debounceTimer = setTimeout(
      () => this.onChange(this.value),
      immediate ? 0 : 750,
    )
  }

  private onChange(amount: number) {
    this.dispatchEvent(
      new CustomEvent<AmountChangeEventDetail>('change', {
        detail: { amount },
      }),
    )
  }

  render() {
    const currencySymbol = getCurrencySymbol(this.currency)
    const displayError = this.externalError || this._internalError
    const hasError = !!displayError

    return html`
      <fieldset>
        <legend id="amount-label" class="form-label">Amount</legend>

        <div class="amount-input-wrapper">
          <span class="currency-symbol">${currencySymbol}</span>
          <input
            id="amount-input"
            aria-labelledby="amount-label"
            class="form-input with-currency"
            type="text"
            inputmode="decimal"
            placeholder="1.5"
            .value=${this.value === 0 ? '' : this.value.toString()}
            @input=${this._handleInput}
            @keydown=${allowOnlyNumericInput}
            aria-invalid=${hasError}
            aria-describedby=${hasError ? 'amount-error' : nothing}
            @paste=${(ev: Event) => ev.preventDefault()}
            autocomplete="off"
            spellcheck="false"
          />
        </div>
        <p
          id="amount-error"
          class="amount-error"
          role="alert"
          aria-live="polite"
        >
          ${hasError ? displayError : nothing}
        </p>
      </div>

      <div class="preset-buttons" role="radiogroup" aria-label="Preset amounts">
        ${this.presets.map(
          (amount) => html`
            <button
              type="button"
              role="radio"
              aria-checked="${this.value === amount}"
              @click=${() => this._handlePresetClick(amount)}
            >
              ${currencySymbol}${amount}
            </button>
          `,
        )}
      </fieldset>
    `
  }
}

function allowOnlyNumericInput(
  ev: KeyboardEvent & { currentTarget: HTMLInputElement },
) {
  if (ev.key.length > 1 || ev.ctrlKey || ev.metaKey) return
  if (ev.key === 'Tab') return
  if (
    !charIsNumber(ev.key) ||
    (ev.key === '.' && ev.currentTarget.value.includes('.'))
  ) {
    ev.preventDefault()
  }
}

function charIsNumber(char?: string) {
  return !!(char || '').match(/\d|\./)
}
