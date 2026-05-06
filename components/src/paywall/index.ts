import { html, LitElement, nothing, unsafeCSS } from 'lit'
import { state } from 'lit/decorators.js'
import { createRef, ref, type Ref } from 'lit/directives/ref.js'
import type { WalletAddressInfo } from 'publisher-tools-api'
// import {
//   AllSet,
//   ContributionRequired,
//   InstallRequired,
// } from './components/index.js'
// import { NO_OP_CONTROLLER } from './controller.js'
// import type { Actions, Controller, Screen } from './controller.js'
import { type Controller, NO_OP_CONTROLLER } from '@c/paywall/controller'
import type { PaywallProfile } from '@shared/types'
import styles from './styles.css?raw'
import styleTokens from './vars.css?raw'

const COMPONENTS = {
  // 'wm-offerwall-install-required': InstallRequired,
  // 'wm-offerwall-all-set': AllSet,
  // 'wm-offerwall-contribution-required': ContributionRequired,
}

export class Paywall extends LitElement {
  #config_!: Promise<PaywallProfile>
  #config!: PaywallProfile
  #receiver!: Promise<WalletAddressInfo>

  static styles = [unsafeCSS(styleTokens), unsafeCSS(styles)]

  @state() _configReady = false

  connectedCallback(): void {
    super.connectedCallback()
    for (const [name, elConstructor] of Object.entries(COMPONENTS)) {
      if (!customElements.get(name)) {
        customElements.define(name, elConstructor)
      }
    }

    if (!this.#baseConfig) {
      throw new Error('setBaseConfig() before mount')
    }
    if (this.#controller === NO_OP_CONTROLLER) {
      throw new Error('setController() before mount')
    }

    this.#config_ = this.#controller.fetchConfig().then((conf) => {
      this.#config = conf
      this._configReady = true
      return Promise.resolve(conf)
    })
    this.#receiver = this.#controller.getWallet(
      this.#baseConfig.receiverWalletAddressUrl,
    )
  }

  #baseConfig!: BaseConfig
  setBaseConfig(baseConfig: BaseConfig) {
    if (this.#baseConfig) {
      throw new Error('setBaseConfig already called')
    }
    this.#baseConfig = { ...baseConfig }
  }

  #controller = NO_OP_CONTROLLER
  setController(controller: Controller) {
    if (this.#controller === controller) return
    if (this.#controller !== NO_OP_CONTROLLER) {
      throw new Error('controller is already set')
    }
    this.#controller = controller
  }

  render() {
    if (!this._configReady) return nothing

    return html`<pre>${JSON.stringify(this.#config)}</pre>`
  }
}

interface BaseConfig {
  receiverWalletAddressUrl: string
  price: string
}
