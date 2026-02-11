import { API_URL } from '@shared/defines'
import type { OfferwallProfile } from '@shared/types'
import { OfferwallModal } from '@tools/components'
import type { Controller } from '@tools/components/offerwall/controller'
import {
  appendPaymentPointer,
  fetchProfile,
  getScriptParams,
  withResolvers,
} from './utils'

const NAME = 'wm-offerwall'
customElements.define(NAME, OfferwallModal)

const params = getScriptParams('offerwall')

const linkElem = appendPaymentPointer(params.walletAddress)

class WebMonetizationCustomOfferwallChoice {
  #configPromise: Promise<OfferwallProfile>
  #monetizationEvents: MonetizationEvent[] = []

  /**
   * Initialize the custom choice, which may include loading or preparing any
   * resources required to function.
   *
   * This function must resolve within 1s.
   */
  async initialize(
    _initParams: InitializeParams,
  ): Promise<InitializeResponseEnum> {
    this.#configPromise = fetchProfile(API_URL, 'offerwall', params)

    linkElem.addEventListener('monetization', (ev) => {
      this.#monetizationEvents.push(ev as MonetizationEvent)
    })

    const win = window as unknown as MyWindow

    return win.googlefc.offerwall.customchoice.InitializeResponseEnum
      .ACCESS_NOT_GRANTED
  }

  /**
   * Show the custom choice UI on the web page, which may be a subscription
   * service, micro-payments service, rewarded ad, etc. Using this UI, user will
   * finish some task which will give them access to content.
   *
   * When it returns true, the user can access the content (equivalent to
   * {@linkcode InitializeResponseEnum.ACCESS_GRANTED}).
   *
   * If it returns false, user didn't fullfil the Offerwall requirements for
   * this custom choice (like didn't pay) (equivalent to
   * {@linkcode InitializeResponseEnum.ACCESS_NOT_GRANTED})
   */
  async show(): Promise<boolean> {
    const onDoneResolver = withResolvers<boolean>()
    const controller: Controller = {
      onExtensionLinkClick() {
        // can start tracking
      },
      onModalClose() {
        onDoneResolver.resolve(false)
      },
      onDone() {
        onDoneResolver.resolve(true)
      },
    }

    const owElem = document.createElement(NAME) as OfferwallModal
    owElem.setController(controller)

    // in case initialize() wasn't called
    this.#configPromise ??= fetchProfile(API_URL, 'offerwall', params)

    const profile = await this.#configPromise
    this.#setCssVars(owElem, profile)

    document.body.appendChild(owElem)

    // TODO(@sidvishnoi): add event handlers (extension install, monetization event) and call el.setScreen accordingly

    return onDoneResolver.promise
  }

  #setCssVars(elem: OfferwallModal, profile: OfferwallProfile) {
    const fontFamily = profile.font.name
    elem.style.setProperty('--wm-font-family', fontFamily)

    const borderRadius = profile.border.type
    elem.style.setProperty(
      '--wm-border-radius',
      borderRadiusToNumber(borderRadius),
    )

    const { background, text, theme, headline } = profile.color
    elem.style.setProperty('--wm-text-color', text)
    elem.style.setProperty('--wm-heading-color', headline)
    elem.style.setProperty(
      '--wm-background',
      typeof background === 'string' ? background : '', // TODO: handle gradient,
    )
    elem.style.setProperty(
      '--wm-accent-color',
      typeof theme === 'string' ? theme : '', // TODO: handle gradient,
    )
  }
}

// #region init
// Register your custom choice with your Offerwall.
const win = window as unknown as MyWindow
// @ts-expect-error defined by external script
win.googlefc ||= {}
// @ts-expect-error defined by external script
win.googlefc.offerwall ||= {}
// @ts-expect-error defined by external script
win.googlefc.offerwall.customchoice ||= {}
win.googlefc.offerwall.customchoice.registry =
  new WebMonetizationCustomOfferwallChoice()

win.googletag ||= { cmd: [] }
win.googletag?.cmd?.push(() => {
  win.googletag?.enableServices?.()
})

// Uncomment following to show regardless of initialization status
// win.googlefc.offerwall.customchoice.registry.show()

// #endregion

// #region Utils
function borderRadiusToNumber(border: OfferwallProfile['border']['type']) {
  switch (border) {
    case 'None':
      return '0'
    case 'Pill':
      return '2rem'
    case 'Light':
    default:
      return '1.5rem'
  }
}
// #endregion

// #region Types
declare enum InitializeResponseEnum {
  CUSTOM_CHOICE_DISABLED,
  ACCESS_GRANTED,
  ACCESS_NOT_GRANTED,
}

interface MyWindow extends Window {
  googlefc: {
    offerwall: {
      customchoice: {
        InitializeResponseEnum: typeof InitializeResponseEnum
        registry: WebMonetizationCustomOfferwallChoice
      }
    }
  }
  googletag?: {
    cmd?: (() => void)[]
    enableServices?: () => void
  }
}

interface GlobalEventHandlersEventMap {
  monetization: MonetizationEvent
}

interface InitializeParams {
  offerwallLanguageCode?: string
}

declare class MonetizationEvent extends Event {
  amountSent: { value: string; currency: string }
  paymentPointer: string
  incomingPayment: string
}
// #endregion
